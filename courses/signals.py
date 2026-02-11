from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Content
from users.models import Notification


@receiver(post_save, sender=Content)
def content_created_notification(sender, instance, created, **kwargs):
    if created:
        content = instance
        module = content.module
        course = module.course
        students = course.students.all()

        # 
        notifications = []
        for student in students:
            notifications.append(
                Notification(
                    recipient=student,
                    title=f"New Content in {course.title}",
                    message=f"New material '{content.item}' added to module '{module.title}'.",
                    link=f"student/course/{course.id}/"
                )
            )
        
        # 
        Notification.objects.bulk_create(notifications)