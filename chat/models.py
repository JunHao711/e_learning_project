from django.db import models
from django.conf import settings
from courses.models import Course

# Create your models here.
class Message(models.Model):
    '''
    used as a public chat message within a specific courses
    like discussion board
    '''

    # the course where this message was posted
    course = models.ForeignKey(Course, related_name='chat_messages', on_delete=models.CASCADE)
    # user who sent the message
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='chat_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='chat_files/', blank=True, null=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.sender.username}: {self.content[:20]}'   
    
class PrivateMessage(models.Model):
    '''
    used as a direct, one to one private message between two users.
    '''
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_priv_msgs', on_delete=models.CASCADE)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_priv_msgs', on_delete=models.CASCADE)
    content = models.TextField(blank=True, null=True)
    
    file = models.FileField(upload_to='chat_files/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"From {self.sender} to {self.recipient}"