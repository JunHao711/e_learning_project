from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, ProfileStatus, Notification
# Register your models here.

# teacher_wang
# ttt123456

# 
# 

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('is_student', 'is_teacher')
    list_filter = UserAdmin.list_filter + ('is_student', 'is_teacher')
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('is_student', 'is_teacher', 'bio', 'photo')}),
    )

@admin.register(ProfileStatus)
class ProfileStatusAdmin(admin.ModelAdmin):
    list_display = ['user','created','content']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'title', 'is_read', 'created_at']
    list_filter = ['is_read','created_at']
    search_fields = ['recipient__username','title','message']