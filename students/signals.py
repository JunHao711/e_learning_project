from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from courses.models import Course
from users.models import Notification
import logging

# set a logger to current file
logger = logging.getLogger(__name__)

@receiver(m2m_changed, sender=Course.students.through)
def student_enrollment_notification(sender, instance, action, model, pk_set, **kwargs):
    '''
    Sends a notification to the course instructor upon new enrollment
    '''
    
    if action == 'post_add':
        course = instance
        logger.info(f"Signal 'post_add' triggered for Course: {course.title} (ID: {course.id})")
        
        try:
            students = model.objects.filter(pk__in=pk_set)
           
            frontend_course_link = f"/student/course/{course.id}/"

            notifications_to_create = []

            for student in students:
                logger.debug(f"Preparing notification for enrollment of student: {student.username}")
                
                notifications_to_create.append(
                    Notification(
                        recipient=course.owner,
                        title=f"New Enrollment: {course.title}",
                        message=f"Student {student.username} has joined your course.",
                        link=frontend_course_link
                    )
                )
            # use bulk_create to enhance database scalability
            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)
                logger.info(f'Successfully bulk created {len(notifications_to_create)} notifications ')

        except Exception as e:
            logger.error(f"Error in student_enrollment_notification signal: {e}", exc_info=True)