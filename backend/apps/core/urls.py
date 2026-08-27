from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityLogViewSet,
    AnalyticsEventCreateView,
    AnalyticsSummaryView,
    CatalogDataQualityView,
    ChatbotView,
    DashboardSummaryView,
    DocumentSearchView,
    EligibilityCheckView,
    HealthLiveView,
    HealthReadyView,
    HealthView,
    NotificationViewSet,
    PaymentInitiateView,
    RecommendationView,
    SearchAutocompleteView,
    SupportTicketViewSet,
)

router = DefaultRouter()
router.register(r'activitylogs', ActivityLogViewSet, basename='activity-log')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log-alt')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('health/live/', HealthLiveView.as_view(), name='health-live'),
    path('health/ready/', HealthReadyView.as_view(), name='health-ready'),
    path('catalog/quality/', CatalogDataQualityView.as_view(), name='catalog-quality'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('search/autocomplete/', SearchAutocompleteView.as_view(), name='search-autocomplete'),
    path('chatbot/ask/', ChatbotView.as_view(), name='chatbot-ask'),
    path('eligibility/check/', EligibilityCheckView.as_view(), name='eligibility-check'),
    path('payments/initiate/', PaymentInitiateView.as_view(), name='payment-initiate'),
    path('documents/', DocumentSearchView.as_view(), name='document-search'),
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
    path('analytics/events/', AnalyticsEventCreateView.as_view(), name='analytics-events'),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('', include(router.urls)),
]
