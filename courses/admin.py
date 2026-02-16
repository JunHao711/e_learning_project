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
    list_display = ['title', 'course_code', 'subject', 'owner', 'created'] 
    list_filter = ['created', 'subject']
    search_fields = ['title', 'overview', 'course_code']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ModuleInline]
    filter_horizontal = ('co_instructors', 'blocked_students') 

@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ['course', 'student', 'rating', 'created']
    list_filter = ['rating', 'created']
    search_fields = ['course__title', 'student__username', 'comment']

@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ['module', 'content_type', 'object_id', 'item','order']

admin.site.register(Text)
admin.site.register(File)
admin.site.register(Image)
admin.site.register(Video)
    