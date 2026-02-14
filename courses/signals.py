from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Content
from users.models import Notification
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Content)
def content_created_notification(sender, instance, created, **kwargs):
    """
    Triggered whenever a new Content object is saved.
    If it's newly created, sends a notification to all enrolled students.
    """
    if created:
        content = instance
        module = content.module
        course = module.course
        students = course.students.all()

        logger.info(f"Signal triggered: New content added to Course '{course.title}' (Module: {module.title})")
        try:
            students = course.students.all()

            if not students.exists():
                logger.debug("No students enrolled yet. Skipping notifications.")
                return
            frontend_link = f"/courses/{course/id}"


            notifications = []
            for student in students:
                notifications.append(
                    Notification(
                        recipient=student,
                        title=f"New Content in {course.title}",
                        message=f"New material '{content.item}' added to module '{module.title}'.",
                        link= frontend_link
                    )
                )
            if notifications:
                Notification.objects.bulk_create(notifications)
                logger.info(f'Sucessfully send {len(notifications)} notifications for new content.')
        
        except Exception as e:
            logger.error(f"Failed to send content notifications: {e}", exc_info=True)        # 
