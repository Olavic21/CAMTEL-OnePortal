from django.urls import include, path

urlpatterns = [
    path('', include('apps.users.urls')),
    path('', include('apps.core.urls')),
    path('', include('apps.categories.urls')),
    path('', include('apps.products.urls')),
    path('', include('apps.news.urls')),
    path('', include('apps.promotions.urls')),
    path('', include('apps.media.urls')),
    path('', include('apps.contacts.urls')),
    path('', include('apps.subscriptions.urls')),
    path('partner/', include('apps.partners.urls')),
]
