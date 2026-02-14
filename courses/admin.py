from django.contrib import admin
from .models import Subject, Course, Module, CourseReview
from .models import Text, File, Image, Video, Content
# superuser
# testing 11234

# Register your models here.
@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}

class ModuleInline(admin.StackedInline): 
    model = Module
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'course_code', 'subject', 'owner', 'created'] # 增加了 course_code 和 owner 展示 [cite: 4, 6]
    list_filter = ['created', 'subject']
    search_fields = ['title', 'overview', 'course_code']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ModuleInline]
    filter_horizontal = ('co_instructors', 'blocked_students') # 加入了 blocked_students 方便管理员操作 [cite: 6]

@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ['course', 'student', 'rating', 'created']
    list_filter = ['rating', 'created']
    search_fields = ['course__title', 'student__username', 'comment']

# 注册多态内容
admin.site.register(Text)
admin.site.register(File)
admin.site.register(Image)
admin.site.register(Video)
admin.site.register(Content)
    