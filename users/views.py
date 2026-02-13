from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import CreateView, TemplateView, ListView, DetailView,UpdateView
from django.views.generic.edit import FormMixin
from django.contrib.auth import login
from django.contrib import messages
from django.views import View
from .forms import StudentSignUpForm, TeacherSignUpForm, UserEditForm
from .models import CustomUser, ProfileStatus
from django import forms
from django.urls import reverse, reverse_lazy
from django.http import HttpResponseForbidden
from courses.models import Course, CourseReview
from django.db.models import Count
from courses.mixins import AdminRequiredMixin, LoginRequiredMixin
# CreateView - CREATE A NEW MODEL RECORD


# Create your views here.
class SignUpOptionView(TemplateView):
    template_name = 'registration/signup_option.html'

class StudentSignUpView(CreateView):
    model = CustomUser
    form_class = StudentSignUpForm
    template_name = 'registration/signup_form.html'

    def get_context_data(self, **kwargs):
        kwargs['user_type'] = 'student'
        return super().get_context_data(**kwargs)
    
    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('login')
    
class TeacherSignUpView(CreateView):
    model = CustomUser
    form_class = TeacherSignUpForm
    template_name = 'registration/signup_form.html'

    def get_context_data(self, **kwargs):
        kwargs['user_type'] = 'teacher'
        return super().get_context_data(**kwargs)

    def form_valid(self, form):
        user = form.save()
        login(self.request, user)
        return redirect('login')
    
class UserSearchView(ListView):
    model = CustomUser
    template_name='users/search_results.html'
    context_object_name='users'

    def get_queryset(self):
        query = self.request.GET.get('q')
        if query:
            return CustomUser.objects.filter(
                username__icontains=query
            ).exclude(pk=self.request.user.pk)
        
        return CustomUser.objects.none()

class StatusForm(forms.ModelForm):
    class Meta:
        model = ProfileStatus
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs ={
                'row':3,
                'class':'form-control',
                'placeholder': 'What is on your mind?'
            })
        }

class UserProfileView(DetailView,FormMixin):
    model = CustomUser
    template_name ='users/profile.html'
    context_object_name = 'profile_user'
    slug_field = 'username'
    slug_url_kwarg = 'username'
    form_class = StatusForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # get all user status
        context['statuses'] = self.object.statuses.all()

        if self.object.is_teacher:
            # if teacher, show their created courses
            context['courses'] = self.object.courses_created.all()
            context['course_label'] = "Teaching Courses"
        else:
            # if student, show their enrolled courses
            # use courses_joined because course model define courses_joined as related name
            context['courses'] = self.object.courses_joined.all()
            context['course_label'] = "Enrolled Courses"
        
        return context

    def post(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return HttpResponseForbidden()
        
        self.object = self.get_object()
        
        # Only owner can poststatuses
        if request.user != self.object:
             return redirect('user_profile', username=self.object.username)

        form = self.get_form()
        if form.is_valid():
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

    def form_valid(self, form):
        status = form.save(commit=False)
        status.user = self.request.user
        status.save()
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('user_profile', kwargs={'username': self.object.username})

class AdminDashboardView(AdminRequiredMixin, TemplateView):
    
    template_name = 'users/admin/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['total_students'] = CustomUser.objects.filter(is_student=True).count()
        context['total_teachers'] = CustomUser.objects.filter(is_teacher=True).count()
        context['total_courses'] = Course.objects.count()
        # 获取最近的 5 条评价进行监控
        context['recent_reviews'] = CourseReview.objects.all()[:5]
        return context

class AdminUserListView(AdminRequiredMixin,ListView):
    model = CustomUser
    template_name = 'users/admin/user_list.html'
    context_object_name = 'admin_users'
    paginate_by = 20

    def get_queryset(self):
        return CustomUser.objects.exclude(id=self.request.user.id).order_by('-date_joined')

class AdminCourseDeleteView(AdminRequiredMixin, View):
    """
    SOC: 专门处理管理员强制删除课程的核心逻辑。
    关注点：安全性（仅限 POST 请求，防止 CSRF 攻击）
    """
    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        course_title = course.title
        
        # 执行删除操作（Django 会级联删除相关的 Module 和 Content）
        course.delete()
        
        # 全局反馈
        messages.success(request, f"Course '{course_title}' has been forcefully deleted.")
        return redirect('site_admin_course_list')

class AdminCourseListView(AdminRequiredMixin, ListView):
    """
    SOC: 专门用于管理员后台的课程列表。
    关注点：高效的数据展示（使用 select_related 和 annotate 优化数据库查询）
    """
    model = Course
    template_name = 'users/admin/course_list.html'
    context_object_name = 'admin_courses'
    paginate_by = 20

    def get_queryset(self):
        # 优化查询：
        # 1. select_related: 提前连表查询 owner 和 subject，防止前端模板产生 N+1 查询
        # 2. annotate: 让数据库直接计算出每门课的报名人数 (student_count)
        return Course.objects.select_related('owner', 'subject') \
                             .annotate(student_count=Count('students')) \
                             .order_by('-created')
    
class UserToggleActiveView(AdminRequiredMixin, View):
    """
    SOC: 该视图专门处理管理员启用/禁用用户的核心逻辑。
    只接受 POST 请求以防止 CSRF 攻击和意外的 GET 触发。
    """
    def post(self, request, user_id):
        user_to_toggle = get_object_or_404(CustomUser, id=user_id)
        
        # 安全防御：防止管理员不小心把自己给禁用了
        if user_to_toggle == request.user:
            messages.error(request, "Security constraint: You cannot deactivate your own account.")
            return redirect('site_admin_user_list')
            
        # 切换状态
        user_to_toggle.is_active = not user_to_toggle.is_active
        user_to_toggle.save()
        
        # 反馈机制
        action = "activated" if user_to_toggle.is_active else "deactivated"
        messages.success(request, f"User '{user_to_toggle.username}' has been successfully {action}.")
        
        return redirect('site_admin_user_list')

class UserEditView(LoginRequiredMixin, UpdateView):
    model = CustomUser
    form_class = UserEditForm
    template_name = 'users/profile_edit.html'

    def get_object(self):
        # 强制获取当前登录的用户，防止越权修改
        return self.request.user

    def get_success_url(self):
        messages.success(self.request, "Your profile has been updated successfully!")
        return reverse_lazy('user_profile', kwargs={'username': self.request.user.username})

