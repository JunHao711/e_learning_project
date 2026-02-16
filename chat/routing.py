from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Match ws://127.0.0.1:8000/ws/chat/<course_id>/
    re_path(r'ws/chat/(?P<course_id>\d+)/$', consumers.ChatConsumer.as_asgi()),    
    # Match ws://127.0.0.1:8000/ws/chat/private/<room_name>/
    re_path(r'ws/chat/(?P<room_name>private_\d+_\d+)/$', consumers.PrivateChatConsumer.as_asgi()),
]