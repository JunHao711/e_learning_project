from django.shortcuts import get_object_or_404
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from courses.models import Course, Content, CourseReview
from .models import UserContentProgress
from .serializers import StudentCourseListSerializer, StudentCourseDetailSerializer, CourseReviewSerializer
# Create your views here.
class EnrollCourseAPIView(APIView):
    """
    POST /api/students/enroll/
    Handles the enrollment logic. Expects {'course_id': <id>} in payload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({"error": "course_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        course = get_object_or_404(Course, id=course_id)

        # check if user have been blocked
        if course.blocked_students.filter(id=request.user.id).exists():
            return Response(
                {"error": "You have been blocked from this course. Contact the instructor."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # enroll
        course.students.add(request.user)
        return Response(
            {"message": f"Successfully enrolled in '{course.title}'."}, 
            status=status.HTTP_200_OK
        )

class StudentCourseListAPIView(generics.ListAPIView):
    """
    GET /api/students/my-courses/
    only courses the student is enrolled in.
    """
    serializer_class = StudentCourseListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(students__in=[self.request.user]).prefetch_related('modules')

class StudentCourseDetailAPIView(generics.RetrieveAPIView):
    """
    GET /api/students/courses/<pk>/
    Show the content of a specific course. Ensures the user is enrolled.
    """
    queryset = Course.objects.all()
    serializer_class = StudentCourseDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        course = super().get_object()
        
        is_student = self.request.user in course.students.all()
        is_owner = self.request.user == course.owner
        
        # if not students or teacher, denied
        if not is_student and not is_owner:
            raise PermissionDenied("You must enroll in this course to view it.")
            
        return course

class CourseReviewCreateAPIView(generics.CreateAPIView):
    """
    POST /api/students/courses/<pk>/review/
    View to handle course review submission.
    """
    serializer_class = CourseReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        course_id = self.kwargs.get('pk')
        course = get_object_or_404(Course, id=course_id)

        # check if enrolled
        if self.request.user not in course.students.all():
            raise PermissionDenied("You must be enrolled to leave a review.")

        # check if reviewed 
        if CourseReview.objects.filter(course=course, student=self.request.user).exists():
            raise PermissionDenied("You have already reviewed this course.")

        # save review with current user and course
        serializer.save(course=course, student=self.request.user)

class CourseReviewUpdateAPIView(generics.UpdateAPIView):
    """
    PUT/PATCH /api/students/courses/<course_pk>/review/edit/
    Allows students to edit their existing review.
    """
    serializer_class = CourseReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        course_pk = self.kwargs.get('pk')
        # only get course review of current user review
        return get_object_or_404(CourseReview, course__id=course_pk, student=self.request.user)

class ToggleContentCompleteAPIView(APIView):
    """
    POST /api/students/content/toggle-complete/
    Marks or unmarks a content piece as completed.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        content_id = request.data.get('content_id')
        if not content_id:
            return Response({'error': 'No content_id provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        content = get_object_or_404(Content, id=content_id)

        # use get_or_create to handle tick/untick 
        progress, created = UserContentProgress.objects.get_or_create(
            student=request.user,
            content=content
        )

        if not created:
            # if exist untick
            progress.delete()
            return Response({'status': 'unmarked', 'content_id': content_id}, status=status.HTTP_200_OK)
        else:
            return Response({'status': 'marked', 'content_id': content_id}, status=status.HTTP_201_CREATED)