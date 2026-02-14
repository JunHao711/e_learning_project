from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # course room history
    path('room/<int:course_id>/history/', views.CourseChatHistoryAPIView.as_view(), name='api_course_chat_history'),
    # private chat room and name
    path('private/<int:target_user_id>/history/', views.PrivateChatHistoryAPIView.as_view(), name='api_private_chat_history'),
    # file or image upload
    path('upload/', views.ChatFileUploadAPIView.as_view(), name='api_chat_file_upload'),
    # recent conversation
    path('conversations/', views.RecentConversationsAPIView.as_view(), name='api_recent_conversations'),
]