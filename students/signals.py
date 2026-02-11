# students/signals.py
from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from courses.models import Course
from users.models import Notification
from django.urls import reverse  # 确保引入了 reverse

# 调试 1：确认文件被加载了
print("---------------------------------------------------")
print("✅ DEBUG: students/signals.py has been LOADED!")
print("---------------------------------------------------")

@receiver(m2m_changed, sender=Course.students.through)
def student_enrollment_notification(sender, instance, action, reverse, model, pk_set, **kwargs):
    # 调试 2：确认信号被触发了
    print(f"🔍 DEBUG: Signal triggered! Action: {action}")
    
    if action == 'post_add':
        course = instance
        print(f"🎯 DEBUG: Action is post_add. Course: {course.title} (Owner: {course.owner})")
        
        try:
            students = model.objects.filter(pk__in=pk_set)
            
            # 🔥 关键修改：预先生成正确的链接
            # 你的 students/urls.py 里 name='student_course_detail'
            # 你的 config/urls.py 里 path('student/', ...)
            # 所以正确的 URL 绝对是 /student/course/{id}/
            correct_link = f"/student/course/{course.id}/"
            
            for student in students:
                print(f"👤 DEBUG: Processing student: {student.username}")
                
                # 创建通知
                Notification.objects.create(
                    recipient=course.owner,
                    title=f"New Enrollment: {course.title}",
                    message=f"Student {student.username} has joined your course.",
                    link=correct_link  # 🔥 这里使用修正后的链接
                )
                print(f"🚀 DEBUG: Notification created! Link: {correct_link}")
                
        except Exception as e:
            print(f"❌ DEBUG: Error inside signal: {e}")