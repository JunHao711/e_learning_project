from django.urls import path
from . import views

urlpatterns = [
    path('enroll-course/', views.StudentEnrollCourseView.as_view(), name='student_enroll_course'),
         
    path('courses/', views.StudentCourseListView.as_view(), name='student_course_list'),
         
    path('course/<int:pk>/', views.StudentCourseDetailView.as_view(),name='student_course_detail'),
    
    path('course/<int:pk>/review/', views.StudentCourseReviewView.as_view(), name='student_course_review'),

    path('course/<int:pk>/<module_id>/',views.StudentCourseDetailView.as_view(), name='student_course_detail_module'),
    
    path('content/complete/', views.mark_content_complete, name='mark_content_complete'),

    path('course/<int:pk>/review/edit/',views.StudentCourseReviewEditView.as_view(), name='student_course_review_edit')
]