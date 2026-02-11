from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import Subject, Course
from .serializers import SubjectSerializer, CourseSerializer, CourseDetailSerializer
from django_filters.rest_framework import DjangoFilterBackend

class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows subjects to be viewed.
    """
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Courses.
    include List, Create, Retrieve, Update, Delete
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] # 游客可看，登录可改(配合下面的逻辑)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'owner']
    search_fields = ['title', 'overview']
    ordering_fields = ['created', 'title']

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer
    
    def perform_create(self, serializer):
        # 创建课程时，自动将 owner 设置为当前用户
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """
        Custom Action: 允许学生通过 API 报名课程
        POST /api/courses/<id>/enroll/
        """
        course = self.get_object()
        
        if course.blocked_students.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You have been blocked from this course.'},
                status=403
            )
            
        # B. 检查是否已报名
        if course.students.filter(id=request.user.id).exists():
            return Response(
                {'status': 'already enrolled'},
                status=200
            )
            
        # C. 正常报名
        course.students.add(request.user)
        return Response({'status': 'enrolled', 'course': course.title})
    

