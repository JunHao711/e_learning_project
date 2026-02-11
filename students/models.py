from django.db import models
from django.conf import settings
from courses.models import Content

# Create your models here.

class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='enrollments')
    course = models.ForeignKey('courses.Course',on_delete=models.CASCADE,related_name='enrollments')
    date_joined = models.DateTimeField(auto_now_add=True)
    
    is_blocked = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'course') 

    def __str__(self):
        return f"{self.user.username} -> {self.course.title}"

class UserContentProgress(models.Model):
    '''
    record student progress
    '''
    student = models.ForeignKey(settings.AUTH_USER_MODEL,
                                related_name='content_progress',
                                on_delete=models.CASCADE)
    content = models.ForeignKey(Content,
                                related_name='student_progress',
                                on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'content']
        ordering = ['-created']

    def __str__(self):
        return f"{self.student.username} completed {self.content.id}"