from django.contrib import admin
from .models import Subject, Course, Module
from .models import Text, File, Image, Video, Content
# superuser
# testing 11234

# Register your models here.
@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['title','slug']
    prepopulated_fields = {'slug':('title',)}

class ModuleInline(admin.StackedInline): 
    model = Module
    extra = 1

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'created']
    list_filter = ['created', 'subject']
    search_fields = ['title', 'overview','course_code']
    prepopulated_fields = {'slug': ('title',)}

    inlines = [ModuleInline]

    filter_horizontal = ('co_instructors',)

admin.site.register(Text)
admin.site.register(File)
admin.site.register(Image)
admin.site.register(Video)
admin.site.register(Content)

    