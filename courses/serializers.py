from rest_framework import serializers
from .models import Subject, Course, Module, Content, ItemBase, Text, File, Image, Video
from users.models import CustomUser

# just show basic info
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'is_teacher', 'is_student']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'title', 'slug']

class TextSerializer(serializers.ModelSerializer):
    class Meta:
        model = Text
        fields = ['content']

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['file']

class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['file']

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['url']

class ContentSerializer(serializers.ModelSerializer):
    item = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = ['id', 'order', 'content_type', 'object_id', 'item']

    def get_item(self, obj):
        """
        select correct serializer based on itembase
        """
        if isinstance(obj.item, Text):
            return TextSerializer(obj.item).data
        if isinstance(obj.item, Video):
            return VideoSerializer(obj.item).data
        if isinstance(obj.item, File):
            return FileSerializer(obj.item).data
        if isinstance(obj.item, Image):
            return ImageSerializer(obj.item).data
        return None
    
class ModuleSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'contents']

class CourseSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True) # 老师信息只读
    modules = ModuleSerializer(many=True, read_only=True) # 嵌套显示模块
    subject = serializers.StringRelatedField() # 显示 Subject 名字而不是 ID

    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'subject', 'title', 'slug', 'overview', 
                  'created', 'owner', 'modules', 'is_enrolled']
        
    def get_is_enrolled(self, obj):
        """
        check the current user was enrolled ?
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.students.all()
        return False

class CourseDetailSerializer(CourseSerializer):
    modules = ModuleSerializer(many=True, read_only=True)

