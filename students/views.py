from django.shortcuts import render, redirect
from django.views.generic.edit import FormView
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic.list import ListView
from django.views.generic.detail import DetailView
from django.views.generic.edit import UpdateView
from .forms import CourseEnrollForm
from courses.models import Course, Content, CourseReview
from django.urls import reverse_lazy
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.shortcuts import get_object_or_404
from .models import UserContentProgress
from django.core.exceptions import PermissionDenied
from courses.forms import CourseReviewForm
# Create your views here.

class StudentEnrollCourseView(LoginRequiredMixin,FormView):
    '''
    Handles the enrollment logic
    when a student clicks 'enroll', this view adds them to the course
    '''
    course = None
    form_class = CourseEnrollForm

    def form_valid(self, form):
        self.course = form.cleaned_data['course']

        # check if the user have been blocked 
        if self.course.blocked_students.filter(id=self.request.user.id).exists():
            # if blocked, show error message and prohibited from enroll
            messages.error(self.request, "You have been blocked from this course. Contact the instructor.")
            return redirect('student_course_detail', self.course.id)

        self.course.students.add(self.request.user)
        return super().form_valid(form)
    
    def get_success_url(self):
        return reverse_lazy('student_course_detail', args=[self.course.id])
    
class StudentCourseListView(LoginRequiredMixin,ListView):
    '''
    Dashboard list only courses the student is enrolled in
    '''

    model = Course
    template_name = 'students/course/list.html'

    def get_queryset(self):
        qs = super().get_queryset()
        # Only show courses where the current user is in the 'students' list
        return qs.filter(students__in=[self.request.user])

class StudentCourseDetailView(LoginRequiredMixin,DetailView):
    '''
    Show the content of a specific course for enrolled students
    '''
    model = Course
    template_name = 'students/course/detail.html'
    
    def get_object(self, queryset=None):
        # check course object
        obj = super().get_object(queryset)
        
        # check if student or teacher
        is_student = self.request.user in obj.students.all()
        is_owner = self.request.user == obj.owner
        
        # if not student and owner, kick out
        if not is_student and not is_owner:
            raise PermissionDenied("You must enroll in this course to view it.")
            
        return obj
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # login to determine which module to display
        course = self.object

        # check if a specific module_id was passed in the URL
        if 'module_id' in self.kwargs:
            # if yes, get that specific module
            context['module'] = course.modules.get(id=self.kwargs['module_id'])
        else:
            # if no, default to the first module
            context['module'] = course.modules.first()

        # check if the user was reviewed this course   
        if self.request.user.is_authenticated:
            try:
                context['user_review'] = CourseReview.objects.get(course=course, student=self.request.user)
            except CourseReview.DoesNotExist:
                context['user_review'] = None

        return context

class StudentCourseReviewView(LoginRequiredMixin, View):
    '''
    View to handle course review submission
    '''
    def post(self, request, pk):
        course = get_object_or_404(Course, id=pk)
        
        # Is the user enrolled?
        if request.user not in course.students.all():
            messages.error(request, "You must be enrolled to leave a review.")
            return redirect('student_course_detail', pk)

        # Check if already reviewed to prevent duplicates
        already_reviewed = CourseReview.objects.filter(course=course, student=request.user).exists()
        if already_reviewed:
            messages.warning(request, "You have already reviewed this course.")
            return redirect('student_course_detail', pk)

        # Process the form
        form = CourseReviewForm(data=request.POST)
        if form.is_valid():
            review = form.save(commit=False)
            review.course = course
            review.student = request.user
            review.save()
            messages.success(request, "Thank you! Your review has been posted.")
        else:
            messages.error(request, "Error submitting review. Please check the form.")
            
        return redirect('student_course_detail', pk)

class StudentCourseReviewEditView(LoginRequiredMixin,UpdateView):
    model = CourseReview
    form_class = CourseReviewForm
    template_name = 'students/course/review_form.html'
    
    def get_object(self, queryset =None):
        course_pk = self.kwargs.get('pk')
        return get_object_or_404(CourseReview, course__id=course_pk, student=self.request.user)
    
    def get_success_url(self):
        # after edit, redirect course detail
        messages.success(self.request, "Review updated successfully!")
        return reverse_lazy('student_course_detail', args=[self.kwargs['pk']])

@login_required
@require_POST
def mark_content_complete(request):
    content_id = request.POST.get('content_id')

    if not content_id:
        return JsonResponse({'status': 'error', 'message': 'No content_id provided'})
    
    content = get_object_or_404(Content, id=content_id)

    progress, created = UserContentProgress.objects.get_or_create(
        student=request.user,
        content=content
    )

    if not created:
        # 如果已经存在，说明是“取消勾选”，我们删掉它
        progress.delete()
        return JsonResponse({'status': 'unmarked', 'content_id': content_id})
    else:
        # 如果是新创建的，说明是“打勾”
        return JsonResponse({'status': 'marked', 'content_id': content_id})