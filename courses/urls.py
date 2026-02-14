from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'courses'

router = DefaultRouter()
router.register(r'subjects', views.SubjectViewSet, basename='subject')

urlpatterns = [
    path('', include(router.urls)),
    # public course list endpoint
    path('', views.PublicCourseListAPIView.as_view(), name='api_public_course_list'),
    path('<int:pk>/', views.PublicCourseDetailAPIView.as_view(), name='api_public_course_detail'),
    # course CRUD
    path('teacher/mine/', views.TeacherCourseListCreateAPIView.as_view(), name='api_teacher_course_list_create'),
    path('teacher/<int:pk>/', views.TeacherCourseRetrieveUpdateDestroyAPIView.as_view(), name='api_teacher_course_rud'),
    # module CRUD
    path('teacher/<int:course_pk>/modules/', views.TeacherModuleListCreateAPIView.as_view(), name='api_teacher_module_list_create'),
    # create and delete course content
    path('teacher/modules/<int:module_id>/content/<str:model_name>/', views.TeacherContentCreateAPIView.as_view(), name='api_teacher_content_create'),
    path('teacher/content/<int:id>/', views.TeacherContentDeleteAPIView.as_view(), name='api_teacher_content_delete'),
    # teacher student management url
    path('teacher/<int:course_pk>/students/', views.TeacherStudentListAPIView.as_view(), name='api_teacher_student_list'),
    path('teacher/<int:course_id>/students/<int:student_id>/block/', views.TeacherStudentKickBlockAPIView.as_view(), name='api_teacher_student_block'),
    path('teacher/<int:course_id>/students/<int:student_id>/unblock/', views.TeacherStudentUnblockAPIView.as_view(), name='api_teacher_student_unblock'),
    # admin urls
    path('admin/all/', views.AdminCourseListAPIView.as_view(), name='api_admin_course_list'),
    path('admin/<int:course_id>/', views.AdminCourseDeleteAPIView.as_view(), name='api_admin_course_delete'),
]