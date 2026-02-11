from django import forms
from django.forms.models import inlineformset_factory
from .models import Course, Module, CourseReview

# For editing modules belonging to a course
# It allows us to edit, delete, and add multiple modules at once.

ModuleFormSet = inlineformset_factory(
    parent_model=Course,
    model=Module,
    fields=['title','description'],
    extra=2,
    can_delete=True
)

class CourseReviewForm(forms.ModelForm):
    '''
    Form for students to submit a review
    '''
    class Meta:
        model = CourseReview
        fields =['rating','comment']
        widgets = {
            'rating': forms.Select(attrs={'class':'form-select'}),
            'comment': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Write your feedback here...'}),
        }