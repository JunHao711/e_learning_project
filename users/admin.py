from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, ProfileStatus, Notification

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Admin configuration for the CustomUser model.
    Updated to utilize the new 'role' CharField.
    """
    list_display = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']
    list_display_links = ['id', 'username']
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Profile Fields', {'fields': ('role', 'bio', 'photo')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Profile Fields', {'fields': ('role', 'bio', 'photo')}),
    )

@admin.register(ProfileStatus)
class ProfileStatusAdmin(admin.ModelAdmin):
    """Admin configuration for user profile statuses."""
    list_display = ['user', 'content_snippet', 'created']
    list_filter = ['created']
    search_fields = ['user__username', 'content']
    
    def content_snippet(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_snippet.short_description = 'Content Snippet'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for system notifications."""
    list_display = ['recipient', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']