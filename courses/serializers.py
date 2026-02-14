from rest_framework import serializers
from .models import Subject, Course, Module, Content, Text, File, Image, Video
from django.contrib.auth import get_user_model

User = get_user_model()

# just show basic info
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'title', 'slug']

# Content Item Serializers
class TextSerializer(serializers.ModelSerializer):
    class Meta:
        model = Text
        fields = ['id', 'title', 'content']

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'title', 'file']

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['id', 'title', 'file']

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'title', 'url']

class ContentSerializer(serializers.ModelSerializer):
    """
    dynamically detects the underlying item type
    (Text, Video, Image, File) and serializes it.
    """
    item = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = ['id', 'order', 'content_type', 'object_id', 'item']

    def get_item(self, obj):
        """
        Dynamically serialize the generic item.
        """
        if isinstance(obj.item, Text):
            return {"type": "text", **TextSerializer(obj.item).data}
        if isinstance(obj.item, Video):
            return {"type": "video", **VideoSerializer(obj.item).data}
        if isinstance(obj.item, File):
            return {"type": "file", **FileSerializer(obj.item).data}
        if isinstance(obj.item, Image):
            return {"type": "image", **ImageSerializer(obj.item).data}
        return None
    
class ModuleSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'contents']

class CourseOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'bio', 'photo']

class CourseListSerializer(serializers.ModelSerializer):
    owner = CourseOwnerSerializer(read_only=True)
    subject = serializers.StringRelatedField()
    total_modules = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'subject', 'title', 'slug', 'course_code', 'overview', 'created', 'owner', 'total_modules']

class CourseDetailSerializer(serializers.ModelSerializer):
    """
    serializer for public course detail page.
    """
    owner = CourseOwnerSerializer(read_only=True)
    subject = serializers.StringRelatedField()
    modules = ModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'subject', 'title', 'slug', 'course_code', 'overview', 
                  'created', 'owner', 'modules', 'is_enrolled']
        
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.students.all()
        return False

class TeacherCourseSerializer(serializers.ModelSerializer):
    """
    Serializer used by teachers to Create/Update/Delete their courses.
    """
    class Meta:
        model = Course
        fields = ['id', 'subject', 'title', 'slug', 'course_code', 'overview', 'co_instructors']

class CourseStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for teachers to view students enrolled in their course.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']

class AdminCourseSerializer(serializers.ModelSerializer):
    """
    Serializer for the site admin dashboard to monitor all courses.
    """
    owner_name = serializers.ReadOnlyField(source='owner.username')
    subject_name = serializers.ReadOnlyField(source='subject.title')
    student_count = serializers.IntegerField(read_only=True) 
    class Meta:
        model = Course
        fields = ['id', 'course_code', 'title', 'subject_name', 'owner_name', 'student_count', 'created']