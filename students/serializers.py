from rest_framework import serializers
from courses.models import Course, CourseReview, Module, Content
from .models import Enrollment, UserContentProgress

class CourseReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for students to submit and view course reviews.
    """
    student_name = serializers.ReadOnlyField(source='student.username')

    class Meta:
        model = CourseReview
        fields = ['id', 'student_name', 'rating', 'comment', 'created', 'updated']
        read_only_fields = ['id', 'student_name', 'created', 'updated']
    
class StudentCourseListSerializer(serializers.ModelSerializer):
    """
    Serializer for the student dashboard
    """
    owner_name = serializers.ReadOnlyField(source='owner.username')
    subject_title = serializers.ReadOnlyField(source='subject.title')

    class Meta:
        model = Course
        fields = ['id', 'title', 'slug', 'course_code', 'subject_title', 'owner_name', 'overview']

class ModuleInlineSerializer(serializers.ModelSerializer):
    """
    serializer to display modules within a course detail.
    """
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order']

class StudentCourseDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for the student learning page.
    """
    owner_name = serializers.ReadOnlyField(source='owner.username')
    subject_title = serializers.ReadOnlyField(source='subject.title')
    
    modules = ModuleInlineSerializer(many=True, read_only=True)
    
    reviews = CourseReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'course_code', 'subject_title', 
            'owner_name', 'overview', 'created', 'modules', 'reviews'
        ]
