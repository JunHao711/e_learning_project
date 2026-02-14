from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Message, PrivateMessage

User = get_user_model()

class ChatUserSnippetSerializer(serializers.ModelSerializer):
    """
    A highly optimized, lightweight serializer for user info in chats.
    Prevents leaking sensitive data (email, role) into the public chat payload.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'photo']

class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for course group chat history.
    """
    sender_info = ChatUserSnippetSerializer(source='sender', read_only=True)
    formatted_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender_info', 'content', 'file', 'formatted_timestamp']

    def get_formatted_timestamp(self, obj):
        return obj.timestamp.strftime('%H:%M %d/%m')

class PrivateMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for 1-on-1 private chat history.
    """
    sender_info = ChatUserSnippetSerializer(source='sender', read_only=True)
    recipient_info = ChatUserSnippetSerializer(source='recipient', read_only=True)
    formatted_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = PrivateMessage
        fields = ['id', 'sender_info', 'recipient_info', 'content', 'file', 'formatted_timestamp']

    def get_formatted_timestamp(self, obj):
        return obj.timestamp.strftime('%H:%M %d/%m')