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
    list_display = ['id', 'username', 'email', 'is_student', 'is_teacher', 'is_admin']
    
    # 可选：让 ID 也可以点击进入编辑页面
    list_display_links = ['id', 'username']
    
    # 保持原有的字段设置（因为我们继承了 UserAdmin，要保留它的 fieldsets）
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('is_student', 'is_teacher','is_admin', 'bio', 'photo')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('is_student', 'is_teacher','is_admin', 'bio', 'photo')}),
    )

@admin.register(ProfileStatus)
class ProfileStatusAdmin(admin.ModelAdmin):
    list_display = ['user','created','content']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'title', 'is_read', 'created_at']
    list_filter = ['is_read','created_at']
    search_fields = ['recipient__username','title','message']