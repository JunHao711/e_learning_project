from django.contrib import admin
from .models import Enrollment, UserContentProgress

# Register your models here.
@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'date_joined']
    list_filter = ['date_joined', 'course']
    search_fields = ['user__username', 'course__title', 'course__course_code']
    raw_id_fields = ['user', 'course']

@admin.register(UserContentProgress)
class UserContentProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'content', 'created']
    list_filter = ['created']
    search_fields = ['student__username']
    raw_id_fields = ['student', 'content']