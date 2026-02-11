from django.shortcuts import render, redirect
from django.views.generic import CreateView, TemplateView, ListView, DetailView
from django.views.generic.edit import FormMixin
from django.contrib.auth import login
from .forms import StudentSignUpForm, TeacherSignUpForm
from .models import CustomUser, ProfileStatus
from django import forms
from django.urls import reverse
from django.http import HttpResponseForbidden


# CREATE VIEW - CREATE A NEW MODEL RECORD


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


