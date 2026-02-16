from rest_framework import serializers
from .models import CustomUser, ProfileStatus, Notification

class ProfileStatusSerializer(serializers.ModelSerializer):
    """Serializer for user status updates."""
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ProfileStatus
        fields = ['id', 'user', 'content', 'created']
        read_only_fields = ['id', 'created']

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing a user's public profile.
    """
    statuses = ProfileStatusSerializer(many=True, read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'bio', 'photo', 'date_joined', 'statuses']
        read_only_fields = ['id', 'username', 'email', 'role', 'date_joined']

class UserEditSerializer(serializers.ModelSerializer):
    """
    Serializer for users to edit their own profile.
    """
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'bio', 'photo','role']
        read_only_fields = ['id','role']

    def get_role(self, obj):
        if obj.is_superuser or obj.is_staff:
            return 'admin'
        return obj.role

class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    SOC: Separated from profile edits for security reasons.
    """
    old_password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate_new_password(self, value):
        # password length at least 8 
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for handling new student or teacher signups.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'role']

    def validate_role(self, value):
        """
        Prevent malicious users from registering as 'admin' via the public API.
        """
        if value not in ['student', 'teacher']:
            raise serializers.ValidationError("Role must be either 'student' or 'teacher'.")
        return value

    def create(self, validated_data):
        """
        ensure the password is encrypted before saving to the database.
        """
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for the admin dashboard user list.
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']

class NotificationSerializer(serializers.ModelSerializer):
    '''serializer for user notification'''
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at', 'link']