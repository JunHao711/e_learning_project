from django.db import models
from django.conf import settings
from courses.models import Content # used for track progress

# Create your models here.

class Enrollment(models.Model):
    '''
    used to represent a user's enrollment in a speicific course
    mapping table between users and courses
    '''
    # user who is enrolling
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,related_name='enrollments')
    # course the user is enrolled in.
    course = models.ForeignKey('courses.Course',on_delete=models.CASCADE,related_name='enrollments')
    # time of joined courses
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course') # ensure user only enroll a course once

    def __str__(self):
        return f"{self.user.username} -> {self.course.title}"

class UserContentProgress(models.Model):
    '''
    record a student's progress through individual pieces of course content
    '''
    # student interacting with the content.
    student = models.ForeignKey(settings.AUTH_USER_MODEL,related_name='content_progress',on_delete=models.CASCADE)
    # The specific content item the student has completed
    content = models.ForeignKey(Content,related_name='student_progress',on_delete=models.CASCADE)
    # time of completed this content
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'content']
        ordering = ['-created']

    def __str__(self):
        return f"{self.student.username} completed {self.content.id}"