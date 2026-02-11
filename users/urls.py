from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.SignUpOptionView.as_view(),name='signup_option'),
    path('signup/student/', views.StudentSignUpView.as_view(), name='student_signup'),
    path('signup/teacher/', views.TeacherSignUpView.as_view(), name='teacher_signup'),
    path('search/', views.UserSearchView.as_view(), name='user_search'),
    path('profile/<str:username>/', views.UserProfileView.as_view(), name='user_profile'),
]

