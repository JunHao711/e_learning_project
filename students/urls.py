from django.urls import path
from . import views

app_name = 'students'

urlpatterns = [
    # enroll a course
    path('enroll/', views.EnrollCourseAPIView.as_view(), name='api_student_enroll'),
    # course user enrolled in      
    path('my-courses/', views.StudentCourseListAPIView.as_view(), name='api_student_course_list'),         
    # course detail 
    path('course/<int:pk>/', views.StudentCourseDetailAPIView.as_view(),name='api_student_course_detail'),
    # post course review
    path('course/<int:pk>/review/', views.CourseReviewCreateAPIView.as_view(), name='api_student_course_review'),
    # edit course review
    path('course/<int:pk>/review/edit/',views.CourseReviewUpdateAPIView.as_view(), name='api_student_course_review_edit'),
    # toggle of complete the course
    path('content/toggle-complete/', views.ToggleContentCompleteAPIView.as_view(), name='api_toggle_content_complete'),

]  