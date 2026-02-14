from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
# Create your models here.

class CustomUser(AbstractUser):
    '''
    CustomUser model extending django's abstractUser
    Inherits default fields like username, first_name, last_name, and password
    Adds custom fields for role-based access, email login, biography, and a profile photo.
    '''

    # define user role using tuple of tuples
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )

    # email as unique and mandatory
    email = models.EmailField(unique=True, blank=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    # bio description
    bio = models.TextField(blank=True, null=True)
    # profile image
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)

    @property
    def is_student(self):
        return self.role == 'student'
    
    @property
    def is_teacher(self):
        return self.role == 'teacher'

    @property
    def is_admin(self):
        return self.role == 'admin'
    
    def __str__(self):
        return self.username

class ProfileStatus(models.Model):
    '''
    used for status update or post created by a user on their profile
    '''
    # link to a specific user
    user = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE, related_name='statuses')
    # status content
    content = models.TextField()
    # time of created
    created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created']

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}"

class Notification(models.Model):
    '''
    used for system or user-generated notification sent to a specific user.
    '''
    # user of receive the notification
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    # notif title
    title = models.CharField(max_length=255)
    # notif message
    message = models.TextField()
    # check whether the user has read
    is_read = models.BooleanField(default=False)
    # time of created
    created_at = models.DateTimeField(auto_now_add=True)
    # used to to redirect the user when they click the notification
    link = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

