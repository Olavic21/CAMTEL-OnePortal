from rest_framework import serializers

from .models import ActivityLog, AnalyticsEvent, Notification, SupportTicket, TicketMessage


class ActivityLogSerializer(serializers.ModelSerializer):
    """Journal d'activite — contrat aligne sur le frontend.

    Contrat attendu par AdminActivityLogPage (types/index.ts) :
      user_id : number | null
      user    : { id, username } | null   (jamais une simple string)
    Un rendu `#undefined` survenait quand `user` etait serialise en
    StringRelatedField (string) sans `user_id` : le frontend affichait
    `#${log.user_id}` avec user_id absent. Ce serializer expose donc les deux
    champs explicitement ; `user` reste null quand l'acteur a ete supprime
    (SET_NULL) — le frontend affiche alors un fallback propre.
    """

    user_id = serializers.IntegerField(read_only=True, allow_null=True)
    user = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = (
            'id',
            'user_id',
            'user',
            'action',
            'target_model',
            'target_id',
            'details',
            'created_at',
        )

    def get_user(self, obj):
        if obj.user_id is None or obj.user is None:
            return None
        return {'id': obj.user.pk, 'username': obj.user.get_username()}


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id',
            'channel',
            'message',
            'type',
            'is_read',
            'read_at',
            'link',
            'created_at',
        )
class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsEvent
        fields = ('id', 'event_type', 'product', 'payload', 'created_at')
        read_only_fields = ('id', 'created_at')


class TicketMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = TicketMessage
        fields = ('id', 'ticket', 'author', 'author_name', 'message', 'created_at')
        read_only_fields = ('id', 'author', 'created_at')


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.username', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.username', read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            'id',
            'client',
            'client_name',
            'subject',
            'category',
            'priority',
            'status',
            'assigned_agent',
            'assigned_agent_name',
            'messages',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'client', 'created_at', 'updated_at')
