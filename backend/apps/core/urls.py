from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityLogViewSet,
    ChatbotView,
    DashboardSummaryView,
    HealthView,
    NotificationViewSet,
    SearchAutocompleteView,
)

router = DefaultRouter()
router.register(r'activitylogs', ActivityLogViewSet, basename='activity-log')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log-alt')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('search/autocomplete/', SearchAutocompleteView.as_view(), name='search-autocomplete'),
    path('chatbot/ask/', ChatbotView.as_view(), name='chatbot-ask'),
    path('', include(router.urls)),
]
