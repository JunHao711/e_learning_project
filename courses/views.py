from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy, reverse
from django.views.generic.list import ListView
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.views.generic.detail import DetailView
from .models import Course, Content, Module, Subject
from .mixins import OwnerCourseMixin, OwnerEditMixin
from django.views.generic.base import TemplateResponseMixin, View
from .forms import ModuleFormSet
from django.forms.models import modelform_factory
from django.apps import apps
from django.db.models import Count
from students.forms import CourseEnrollForm
from django.http import HttpResponse
from django.contrib.auth import get_user_model

# Create your views here.
class ManageCourseListView(OwnerCourseMixin,ListView):
    '''
    List all courses created/managed by the current teacher
    '''
    model = Course
    template_name = 'courses/manage/course/list.html'
    context_object_name = 'courses'

class ModuleContentListView(TemplateResponseMixin, View):
    """
    View to display all content items within a module.
    """
    template_name = 'courses/manage/module/content_list.html'

    def get(self, request, module_id):
        module = get_object_or_404(Module, id=module_id, course__owner=request.user)
        return self.render_to_response({'module': module})

class CourseCreateView(OwnerCourseMixin,OwnerEditMixin,CreateView):
    """
    View to create a new course.
    """
    model = Course
    fields = ['subject', 'title', 'course_code', 'overview', 'co_instructors']
    template_name = 'courses/manage/course/form.html'
    success_url = reverse_lazy('manage_course_list')

class CourseUpdateView(OwnerCourseMixin, OwnerEditMixin, UpdateView):
    """
    View to edit an existing course.
    """
    model = Course
    fields = ['subject', 'title', 'course_code', 'overview', 'co_instructors']
    template_name = 'courses/manage/course/form.html'
    success_url = reverse_lazy('manage_course_list')

class CourseDeleteView(OwnerCourseMixin, DeleteView):
    """
    View to delete a course.
    """
    model = Course
    template_name = 'courses/manage/course/delete.html'
    success_url = reverse_lazy('manage_course_list')

class CourseModuleUpdateView(TemplateResponseMixin, View):
    """
    View to handle the formset for course modules.
    It allows adding/updating/deleting modules for a specific course.
    """
    template_name = 'courses/manage/module/formset.html'
    course = None

    def get_formset(self, data=None):
        """
        Helper method to instantiate the formset with the course instance.
        """
        return ModuleFormSet(instance=self.course, data=data)

    def dispatch(self, request, pk):
        """
        Override dispatch to retrieve the course object and check permissions.
        """
        self.course = get_object_or_404(Course, id=pk, owner=request.user)
        return super().dispatch(request, pk)

    def get(self, request, *args, **kwargs):
        """
        Render the formset with existing data.
        """
        formset = self.get_formset()
        return self.render_to_response({
            'course': self.course,
            'formset': formset
        })

    def post(self, request, *args, **kwargs):
        """
        Process the formset submission.
        """
        
        formset = self.get_formset(data=request.POST)
        if formset.is_valid():
            formset.save()
            return redirect('manage_course_list')
        return self.render_to_response({
            'course': self.course,
            'formset': formset
        })

class ContentCreateUpdateView(TemplateResponseMixin, View):
    """
    A generic view that handles creating and updating different types of content
    (Text, Video, Image, File) using a single class.
    """
    module = None
    model = None
    obj = None
    template_name = 'courses/manage/content/form.html'

    def get_model(self, model_name):
        """
        Dynamically retrieve the model class based on the model_name string.
        Validates that the model is one of the allowed types.
        """
        if model_name in ['text', 'video', 'image', 'file']:
            try:
                return apps.get_model(app_label='courses', model_name=model_name)
            except LookupError:
                print(f"ERROR: Model '{model_name}' not found in app 'courses'.")
                return None
        return None

    def get_form(self, model, *args, **kwargs):
        """
        Dynamically create a ModelForm for the specific model type.
        """
        # Exclude common fields that are handled automatically
        Form = modelform_factory(model, exclude=['owner', 'order', 'created', 'updated'])
        return Form(*args, **kwargs)

    def dispatch(self, request, module_id, model_name, id=None):
        """
        Url dispatcher. Handles finding the module, model, and content object (if editing).
        """
        self.module = get_object_or_404(Module, id=module_id, course__owner=request.user)
        self.model = self.get_model(model_name)
        
        if id:
            self.obj = get_object_or_404(self.model, id=id, owner=request.user)
            
        return super().dispatch(request, module_id, model_name, id)

    def get(self, request, module_id, model_name, id=None):
        form = self.get_form(self.model, instance=self.obj)
        return self.render_to_response({'form': form, 'object': self.obj})

    def post(self, request, module_id, model_name, id=None):

        form = self.get_form(self.model, instance=self.obj, data=request.POST, files=request.FILES)
        
        if form.is_valid():
            obj = form.save(commit=False)
            obj.owner = request.user
            obj.save()
            
            if not id:
                # If creating new content, link it to the Module via the Content model
                Content.objects.create(module=self.module, item=obj)
            
            response = HttpResponse(status=204)
            response['HX-Trigger'] = 'contentUpdated'
            return response # We will create this view later
            
        return self.render_to_response({'form': form, 'object': self.obj})

class ContentDeleteView(View):
    """
    View to delete a content object.
    """
    def post(self, request, id):
        content = get_object_or_404(Content, id=id, module__course__owner=request.user)
        module = content.module
        content.item.delete() # Delete the actual Text/Video object
        content.delete()      # Delete the generic link
        return redirect('module_content_list', module.id)
    
class CourseListView(TemplateResponseMixin,View):
    '''
    view to list all available courses, supports filtering by subject
    '''
    model = Course
    template_name = 'courses/course/list.html'

    def get(self,request, subject=None):
        # annotate courses with total modules to show 5 modules in the UI
        subjects = Subject.objects.annotate(total_courses=Count('courses'))
        courses = Course.objects.annotate(total_modules=Count('modules'))

        if subject:
            subject = get_object_or_404(Subject,slug=subject)
            courses = courses.filter(subject=subject)
        
        return self.render_to_response({
            'subjects': subjects,
            'subject': subject,
            'courses': courses
        })

class CourseDetailView(DetailView):
    '''
    Public overview of a course (before enrollment).
    Shows description and an 'Enroll' button.
    '''
    model = Course
    template_name = 'courses/course/detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # check if the current user is already enrolled
        # allow us to hide the enroll button if they are already in
        if self.request.user.is_authenticated:
            context['is_enrolled'] = self.object.students.filter(id=self.request.user.id).exists()
            context['is_blocked'] = self.object.blocked_students.filter(id=self.request.user.id).exists()

            if not context['is_enrolled'] and not context['is_blocked']:
                context['enroll_form'] = CourseEnrollForm(initial={'course': self.object})
        else:
            context['is_enrolled'] = False
            context['is_blocked'] = False

        return context

class CourseStudentsListView(OwnerCourseMixin,DetailView):
    '''
    show a list of students enrolled on specific course

    '''
    model = Course
    template_name = 'courses/manage/course/students.html'
    context_object_name = 'course'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        course = self.object
        # get all students
        students_queryset = course.students.all()
        # used for filter teacher and students
        filter_type = self.request.GET.get('filter')

        if filter_type == 'teacher':
            students_queryset = students_queryset.filter(is_teacher=True)
            context['current_filter'] = 'Teachers'
        elif filter_type == 'student':
            students_queryset = students_queryset.filter(is_teacher=False)
            context['current_filter'] = 'Students'
        elif filter_type == 'blocked':
            students_queryset = course.blocked_students.all()
            context['current_filter'] = 'Blocked Users'
        else:
            context['current_filter'] = 'All'
        
        context['students_list'] = students_queryset

        return context

class StudentDeleteFromCourseView(OwnerCourseMixin,View):
    '''
    Kick a student out of a specific course.
    '''

    def post(self, request, course_id, student_id):
        User = get_user_model()
        # Get the course (OwnerCourseMixin ensures only the owner can do this)
        course = get_object_or_404(Course, id=course_id, owner=request.user)
        
        # Get the student object
        student = get_object_or_404(User, id=student_id)
        
        # Remove the student from the ManyToMany relationship
        course.students.remove(student)
        course.blocked_students.add(student)
        
        # Redirect back to the student list
        return redirect('course_students_list', course_id)

class StudentUnblockCourseView(OwnerCourseMixin, View):
    def post(self, request, course_id, student_id):
        User = get_user_model()
        course = get_object_or_404(Course, id=course_id, owner=request.user)
        student = get_object_or_404(User, id=student_id)
        
        # remove from blacklist
        course.blocked_students.remove(student)
        
        # 注意：解封后是否要自动加回 students 列表？
        # 通常不需要，解封后让学生自己重新 Enroll 即可。
        
        # 重定向回黑名单列表
        return redirect(f"{reverse('course_students_list', args=[course_id])}?filter=blocked")

