from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('room/<int:course_id>/', views.course_chat_room, name='course_chat_room'),
    path('upload/image/', views.chat_file_upload, name='chat_image_upload'),
    path('private/<int:target_user_id>/', views.private_chat_room, name='private_chat_room'),
    path('api/conversations/', views.get_recent_conversations, name='api_conversations'),
]