from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.db import transaction
from .models import CustomUser, ProfileStatus

class StudentSignUpForm(UserCreationForm):
    '''Handles student registration and assigns the correct role. '''
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username','email')

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'student'
        if commit:
            user.save()
        return user

class TeacherSignUpForm(UserCreationForm):
    ''' Handles teacher registration and assigns the correct role '''
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username', 'email')

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'teacher'
        if commit:
            user.save()
        return user
    
class UserEditForm(forms.ModelForm):
    ''' Allows users to edit their profile details '''
    class Meta:
        model = CustomUser

        fields = ('username', 'email', 'bio', 'photo')
        widgets = {
            'bio': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Tell us about yourself...'}),
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'photo': forms.FileInput(attrs={'class': 'form-control'}),
        }

class StatusForm(forms.ModelForm):
    ''' Form for posting a new status update'''
    class Meta:
        model = ProfileStatus
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs ={
                'rows':3,
                'class':'form-control',
                'placeholder': 'What is on your mind?'
            })
        }