from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'users' # set app name to support URL namespaces

router = DefaultRouter()
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    # registration endpoint.
    path('register/', views.UserRegistrationAPIView.as_view(), name='api_user_register'),
    
    # search for other users endpoint
    path('search/', views.UserSearchAPIView.as_view(), name='api_user_search'),
    
    # retrieve or update the current user endpoint
    path('me/', views.UserMeAPIView.as_view(), name='api_user_me'),
    
    # changing password endpoint
    path('me/change-password/', views.ChangePasswordAPIView.as_view(), name='api_change_password'),
    
    # post a new status update to their profile endpoint
    path('status/', views.UserStatusCreateAPIView.as_view(), name='api_user_status_create'),
    
    # fetch the public profile data of a specific user
    path('profile/<str:username>/', views.UserProfileAPIView.as_view(), name='api_user_profile'),
    
    # admin dashboard
    path('admin/dashboard/', views.AdminDashboardAPIView.as_view(), name='api_admin_dashboard'),
    # list all users
    path('admin/users/', views.AdminUserListAPIView.as_view(), name='api_admin_user_list'),
    # toggle a user's active status 
    path('admin/users/<int:user_id>/toggle-active/', views.AdminUserToggleAPIView.as_view(), name='api_admin_user_toggle'),
    
    path('', include(router.urls)),
]