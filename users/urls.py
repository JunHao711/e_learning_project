from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.SignUpOptionView.as_view(),name='signup_option'),
    path('signup/student/', views.StudentSignUpView.as_view(), name='student_signup'),
    path('signup/teacher/', views.TeacherSignUpView.as_view(), name='teacher_signup'),
    path('search/', views.UserSearchView.as_view(), name='user_search'),
    path('profile/edit/', views.UserEditView.as_view(), name='user_profile_edit'),
    path('profile/<str:username>/', views.UserProfileView.as_view(), name='user_profile'),
    path('site-admin/dashboard/', views.AdminDashboardView.as_view(), name='site_admin_dashboard'),
    path('site-admin/users/', views.AdminUserListView.as_view(), name='site_admin_user_list'),
    path('site-admin/users/<int:user_id>/toggle-active/', views.UserToggleActiveView.as_view(), name='site_admin_user_toggle'),
    path('site-admin/courses/', views.AdminCourseListView.as_view(), name='site_admin_course_list'),
    path('site-admin/courses/<int:course_id>/delete/', views.AdminCourseDeleteView.as_view(), name='site_admin_course_delete'),
]

