from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # course room history
    path('courses/<int:course_id>/history/', views.CourseChatHistoryAPIView.as_view(), name='api_course_chat_history'),
    # private chat room and name
    path('private/<int:target_user_id>/history/', views.PrivateChatHistoryAPIView.as_view(), name='api_private_chat_history'),
    # file or image upload
    path('upload/', views.ChatFileUploadAPIView.as_view(), name='api_chat_file_upload'),
    # recent conversation
    path('conversations/', views.RecentConversationsAPIView.as_view(), name='api_recent_conversations'),
    # delete group message
    path('messages/<int:pk>/', views.MessageDeleteView.as_view(), name='message-delete'),
    # delete own private messages
    path('private-messages/<int:pk>/', views.PrivateMessageDeleteView.as_view(), name='private-message-delete'),
]