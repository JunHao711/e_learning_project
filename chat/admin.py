from django.contrib import admin
from .models import Message, PrivateMessage

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'course', 'timestamp', 'content_preview', 'has_file']
    list_filter = ['course', 'timestamp']
    search_fields = ['content', 'sender__username']
    
    def content_preview(self, obj):
        return obj.content[:30] if obj.content else "(No Text)"

    def has_file(self, obj):
        return bool(obj.file)
    has_file.boolean = True

@admin.register(PrivateMessage)
class PrivateMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'timestamp', 'content_preview', 'has_file']
    list_filter = ['timestamp']
    search_fields = ['content', 'sender__username', 'recipient__username']

    def content_preview(self, obj):
        return obj.content[:30] if obj.content else "(No Text)"

    def has_file(self, obj):
        return bool(obj.file)
    has_file.boolean = True