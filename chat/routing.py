from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # 匹配 ws://127.0.0.1:8000/ws/chat/1/
    re_path(r'ws/chat/(?P<course_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/private/(?P<room_name>[\w_]+)/$', consumers.PrivateChatConsumer.as_asgi()),
]