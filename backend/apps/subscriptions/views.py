from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import AdminOnly, ReadPublicWriteAdminOrEditor

from .models import SubscriptionRequest, SubscriptionStatusHistory
from .serializers import SubscriptionRequestSerializer, SubscriptionStatusHistorySerializer


class SubscriptionRequestViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionRequest.objects.select_related('product', 'user').prefetch_related('status_history')
    serializer_class = SubscriptionRequestSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in {'my_subscriptions', 'my_dashboard'}:
            return [permissions.IsAuthenticated()]
        if self.action in {'list', 'retrieve', 'update', 'partial_update', 'destroy', 'change_status'}:
            return [AdminOnly()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(user=user)
        # Historique initial + notification admin (evenement subscription_created)
        SubscriptionStatusHistory.objects.create(
            subscription=instance,
            old_status='',
            new_status=instance.status,
            changed_by=user,
            comment='Demande creee',
        )
        # Phase 17 : evenement analytics metier (source serveur).
        from apps.core.analytics import record_event
        record_event(
            event_type='subscription_submitted',
            user=user,
            product=instance.product,
            payload={'request_number': instance.request_number},
        )
        from apps.core.models import Notification
        Notification.objects.create(
            message=f'Nouvelle demande de souscription {instance.request_number}: {instance.product.name}',
            type='info',
            link='/admin/subscriptions',
        )
        if user is not None:
            Notification.objects.create(
                user=user,
                message=f'Votre demande {instance.request_number} a ete enregistree (en attente).',
                type='info',
                link='/mon-compte',
            )

    def retrieve(self, request, *args, **kwargs):
        """Allow owners to retrieve their own subscription, admins can retrieve any."""
        subscription = self.get_object()
        # Admin users (staff/roles SUPER_ADMIN, ADMIN) can always retrieve
        role = getattr(request.user, 'role', None)
        if request.user and request.user.is_authenticated and (request.user.is_staff or role in {'SUPER_ADMIN', 'ADMIN'}):
            serializer = self.get_serializer(subscription, context={'request': request})
            return Response(serializer.data)

        # Allow the owner (authenticated) to retrieve their own subscription
        if request.user and request.user.is_authenticated and subscription.user_id == request.user.id:
            serializer = self.get_serializer(subscription, context={'request': request})
            return Response(serializer.data)

        # Otherwise hide existence (404) or require auth
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        """Transition de statut (admin). Trace dans SubscriptionStatusHistory et notifie."""
        subscription = self.get_object()
        new_status = (request.data.get('status') or '').strip().upper()
        valid = SubscriptionRequest.Status.values
        if new_status not in valid:
            return Response(
                {'detail': f'Statut invalide. Valeurs acceptees: {", ".join(sorted(valid))}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = subscription.status
        if new_status == old_status:
            return Response(SubscriptionRequestSerializer(subscription, context={'request': request}).data)
        reason = (request.data.get('reason') or '').strip()
        comment = (request.data.get('comment') or '').strip()
        subscription.status = new_status
        subscription.save(update_fields=['status', 'updated_at'])
        SubscriptionStatusHistory.objects.create(
            subscription=subscription,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            reason=reason,
            comment=comment,
        )
        # Phase 17 : evenements metier enregistres cote serveur uniquement.
        from apps.core.analytics import record_event
        event_type = {
            SubscriptionRequest.Status.APPROVED: 'subscription_approved',
            SubscriptionRequest.Status.ACTIVATED: 'subscription_activated',
        }.get(new_status)
        if event_type:
            record_event(
                event_type=event_type,
                user=subscription.user,
                product=subscription.product,
                payload={'request_number': subscription.request_number},
            )
        if subscription.user_id:
            from apps.core.models import Notification
            Notification.objects.create(
                user=subscription.user,
                message=f'La demande {subscription.request_number} est passee au statut {new_status}.',
                type='success' if new_status in {SubscriptionRequest.Status.APPROVED, SubscriptionRequest.Status.ACTIVATED}
                else 'warning',
                link='/mon-compte',
            )
        return Response(SubscriptionRequestSerializer(subscription, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='my-subscriptions')
    def my_subscriptions(self, request):
        """Les demandes de l'utilisateur courant (espace client)."""
        queryset = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-dashboard')
    def my_dashboard(self, request):
        """KPIs de l'espace client (demandes en cours / validees / terminees)."""
        qs = self.get_queryset().filter(user=request.user)
        return Response({
            'total': qs.count(),
            'in_progress': qs.exclude(status__in=[
                SubscriptionRequest.Status.ACTIVATED,
                SubscriptionRequest.Status.REJECTED,
                SubscriptionRequest.Status.CANCELLED,
            ]).count(),
            'completed': qs.filter(status=SubscriptionRequest.Status.ACTIVATED).count(),
            'rejected': qs.filter(status=SubscriptionRequest.Status.REJECTED).count(),
        })

    @action(detail=False, methods=['get'], url_path='admin-analytics')
    def admin_analytics(self, request):
        """Admin analytics dashboard: pipeline metrics by status and top products."""
        from django.db.models import Count, Q
        from django.utils import timezone
        from datetime import timedelta

        # Require admin permissions
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_role = getattr(request.user, 'role', None)
        if not (request.user.is_staff or user_role in ['SUPER_ADMIN', 'ADMIN']):
            return Response({'detail': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)

        qs = self.get_queryset()
        
        # Pipeline by status
        pipeline = {}
        for status_choice in SubscriptionRequest.Status.choices:
            status_value = status_choice[0]
            pipeline[status_value] = qs.filter(status=status_value).count()
        
        # Conversion rates
        total = qs.count()
        approved = qs.filter(status=SubscriptionRequest.Status.APPROVED).count()
        activated = qs.filter(status=SubscriptionRequest.Status.ACTIVATED).count()
        rejected = qs.filter(status=SubscriptionRequest.Status.REJECTED).count()
        
        # Top products by subscription count
        top_products = (
            qs.values('product__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        
        # Average processing time (time from creation to approval/rejection)
        from django.db.models import Avg, F
        from django.db.models.functions import Extract
        
        completed = qs.filter(
            Q(status=SubscriptionRequest.Status.APPROVED) |
            Q(status=SubscriptionRequest.Status.REJECTED) |
            Q(status=SubscriptionRequest.Status.ACTIVATED)
        )
        
        # Time series: subscriptions created in last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent = qs.filter(created_at__gte=thirty_days_ago)
        daily_counts = (
            recent
            .extra(select={'date': 'DATE(created_at)'})
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        return Response({
            'total': total,
            'pipeline': pipeline,
            'conversion_rates': {
                'approval_rate': round((approved / total * 100) if total > 0 else 0, 2),
                'activation_rate': round((activated / total * 100) if total > 0 else 0, 2),
                'rejection_rate': round((rejected / total * 100) if total > 0 else 0, 2),
            },
            'top_products': list(top_products),
            'recent_daily_trend': list(daily_counts),
            'timestamp': timezone.now().isoformat(),
        })
