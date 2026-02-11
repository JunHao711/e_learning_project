from django import forms
from courses.models import Course

class CourseEnrollForm(forms.Form):
    '''
    hidden form to handle course enrollment
    '''
    course = forms.ModelChoiceField(queryset=Course.objects.all(),
                                    widget = forms.HiddenInput)
    
