from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.apps import apps
from django.contrib.auth import get_user_model
from users.api_permissions import IsSiteAdminAPI
from .models import Course, Module, Content, Subject
from .serializers import SubjectSerializer, CourseListSerializer, CourseDetailSerializer, TeacherCourseSerializer, ModuleSerializer, CourseStudentSerializer, AdminCourseSerializer
from django_filters.rest_framework import DjangoFilterBackend

User = get_user_model()

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/courses/subjects/
    API endpoint that allows subjects (categories) to be viewed.
    Merged from the old api_views.py.
    """
    queryset = Subject.objects.annotate(total_courses=Count('courses'))
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]

class PublicCourseListAPIView(generics.ListAPIView):
    """
    GET /api/courses/
    List all available courses. Supports filtering by subject via query param (?subject=slug).
    """
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'owner']
    search_fields = ['title', 'overview', 'course_code']
    ordering_fields = ['created', 'title']

    def get_queryset(self):
        queryset = Course.objects.annotate(total_modules=Count('modules')).order_by('-created')
        subject_slug = self.request.query_params.get('subject')
        if subject_slug:
            queryset = queryset.filter(subject__slug=subject_slug)
        return queryset

class PublicCourseDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/courses/<pk>/
    Public overview of a course (before enrollment).
    """
    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]

class TeacherCourseListCreateAPIView(generics.ListCreateAPIView):
    """
    GET /api/courses/teacher/mine/
    POST /api/courses/teacher/mine/
    List courses created by the teacher, or create a new course.
    """
    serializer_class = TeacherCourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # 强制将课程的创建者设为当前登录的老师
        serializer.save(owner=self.request.user)

class TeacherCourseRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PUT, PATCH, DELETE /api/courses/teacher/<pk>/
    Edit or delete a specific course owned by the teacher.
    """
    serializer_class = TeacherCourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # just can edit your own course
        return Course.objects.filter(owner=self.request.user)

class TeacherModuleListCreateAPIView(generics.ListCreateAPIView):
    """
    GET, POST /api/courses/teacher/<course_pk>/modules/
    """
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course = get_object_or_404(Course, id=self.kwargs['course_pk'], owner=self.request.user)
        return Module.objects.filter(course=course)

    def perform_create(self, serializer):
        course = get_object_or_404(Course, id=self.kwargs['course_pk'], owner=self.request.user)
        serializer.save(course=course)

class TeacherContentCreateAPIView(APIView):
    """
    POST /api/courses/teacher/modules/<module_id>/content/<model_name>/
    Dynamically creates Text/Video/Image/File.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, module_id, model_name):
        module = get_object_or_404(Module, id=module_id, course__owner=request.user)
        
        # check type
        if model_name not in ['text', 'video', 'image', 'file']:
            return Response({"error": "Invalid content type."}, status=status.HTTP_400_BAD_REQUEST)
        
        model_class = apps.get_model(app_label='courses', model_name=model_name)
        
        item_data = {'title': request.data.get('title'), 'owner': request.user}
        if model_name == 'text':
            item_data['content'] = request.data.get('content')
        elif model_name == 'video':
            item_data['url'] = request.data.get('url')
        elif model_name in ['image', 'file']:
            item_data['file'] = request.FILES.get('file')
            
        item_instance = model_class.objects.create(**item_data)
        Content.objects.create(module=module, item=item_instance)
        
        return Response({"message": f"{model_name.capitalize()} content added successfully."}, status=status.HTTP_201_CREATED)

class TeacherContentDeleteAPIView(APIView):
    """
    DELETE /api/courses/teacher/content/<id>/
    Deletes theg eneric content and its associated Text/Video/etc object.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, id):
        content = get_object_or_404(Content, id=id, module__course__owner=request.user)
        content.item.delete()
        content.delete()
        return Response({"message": "Content deleted."}, status=status.HTTP_204_NO_CONTENT)

class TeacherStudentListAPIView(generics.ListAPIView):
    """
    GET /api/courses/teacher/<course_pk>/students/?filter=blocked
    List students enrolled or blocked.
    """
    serializer_class = CourseStudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course = get_object_or_404(Course, id=self.kwargs['course_pk'], owner=self.request.user)
        filter_type = self.request.query_params.get('filter')
        
        if filter_type == 'blocked':
            return course.blocked_students.all()
        elif filter_type == 'teacher':
            return course.students.filter(role='teacher')  # 使用我们修改后的 role 字段
        return course.students.all()

class TeacherStudentKickBlockAPIView(APIView):
    """
    POST /api/courses/teacher/<course_id>/students/<student_id>/block/
    Kicks a student out and blocks them.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id, student_id):
        course = get_object_or_404(Course, id=course_id, owner=request.user)
        student = get_object_or_404(User, id=student_id)
        
        course.students.remove(student)
        course.blocked_students.add(student)
        return Response({"message": f"{student.username} has been blocked and removed from the course."}, status=status.HTTP_200_OK)

class TeacherStudentUnblockAPIView(APIView):
    """
    POST /api/courses/teacher/<course_id>/students/<student_id>/unblock/
    Removes a student from the blocklist.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id, student_id):
        course = get_object_or_404(Course, id=course_id, owner=request.user)
        student = get_object_or_404(User, id=student_id)
        
        course.blocked_students.remove(student)
        return Response({"message": f"{student.username} has been unblocked."}, status=status.HTTP_200_OK)

class AdminCourseListAPIView(generics.ListAPIView):
    """
    GET /api/courses/admin/all/
    Admin endpoint to view all courses with extra statistics.
    """
    serializer_class = AdminCourseSerializer
    permission_classes = [IsSiteAdminAPI]

    def get_queryset(self):
        return Course.objects.select_related('owner', 'subject').annotate(student_count=Count('students')).order_by('-created')

class AdminCourseDeleteAPIView(APIView):
    """
    DELETE /api/courses/admin/<course_id>/delete/
    Forcefully deletes a course by the site admin.
    """
    permission_classes = [IsSiteAdminAPI]

    def delete(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        title = course.title
        course.delete()
        return Response({"message": f"Course '{title}' forcefully deleted by Admin."}, status=status.HTTP_204_NO_CONTENT)