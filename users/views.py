from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import CustomUser, Notification
from courses.models import Course
from .api_permissions import IsSiteAdminAPI
from .serializers import ProfileStatusSerializer, UserProfileSerializer, UserRegistrationSerializer, UserEditSerializer,AdminUserSerializer,NotificationSerializer, ChangePasswordSerializer
from django.contrib.auth import get_user_model
from django.db.models import Count

User = get_user_model()

class UserSearchAPIView(generics.ListAPIView):
    """
    GET /api/users/search/?q=username
    Allows authenticated users to search for others.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        if query:
            return CustomUser.objects.filter(
                username__icontains=query
            ).exclude(pk=self.request.user.pk)
        return CustomUser.objects.none()

class UserRegistrationAPIView(generics.CreateAPIView):
    """
    POST /api/users/register/
    Handles both student and teacher registration
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class UserProfileAPIView(generics.RetrieveAPIView):
    """
    GET /api/users/profile/<username>/
    Fetch a user's profile details, including their statuses and courses.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = 'username'
    permission_classes = [permissions.IsAuthenticated]

class UserStatusCreateAPIView(generics.CreateAPIView):
    """
    POST /api/users/status/
    Allows a user to post a new status update to their profile.
    """
    serializer_class = ProfileStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 强制将状态归属于当前登录用户
        serializer.save(user=self.request.user)

class UserMeAPIView(generics.RetrieveUpdateAPIView):
    """
    GET, PUT, PATCH /api/users/me/
    Allows users to fetch and edit their own profile information.
    """
    serializer_class = UserEditSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # 强制获取当前登录的用户，完美防御 IDOR
        return self.request.user

class AdminDashboardAPIView(APIView):
    """
    GET /api/users/admin/dashboard/
    Provide high-level statistics for the administrator.
    """
    permission_classes = [IsSiteAdminAPI]

    def get(self, request):
        total_users = User.objects.count()
        total_courses = Course.objects.count()
        
        enrollments_data = Course.objects.aggregate(total=Count('students'))
        total_enrollments = enrollments_data['total'] or 0

        return Response({
            "total_users": total_users,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments
        }, status=status.HTTP_200_OK)

class AdminUserListAPIView(generics.ListAPIView):
    """
    GET /api/users/admin/users/
    List all users for the administrator to manage.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsSiteAdminAPI]

    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id).order_by('-date_joined')

class AdminUserToggleAPIView(APIView):
    """
    POST /api/users/admin/users/<id>/toggle-active/
    Handle the activation/deactivation of user accounts.
    """
    permission_classes = [IsSiteAdminAPI]

    def post(self, request, user_id):
        target_user = get_object_or_404(User, id=user_id)
        
        if target_user == request.user:
            return Response({"error": "You cannot ban yourself."}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user.is_active = not target_user.is_active
        target_user.save()
        
        action = "activated" if target_user.is_active else "banned"
        return Response({"message": f"User {target_user.username} has been {action}."}, status=status.HTTP_200_OK)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    user only can view their notif
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """ POST /api/notifications/mark_all_read/ """
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """ POST /api/notifications/{id}/mark_read/ """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

class ChangePasswordAPIView(generics.UpdateAPIView):
    """
    PUT /api/users/change-password/
    Secure endpoint strictly for changing user passwords.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # only can change own password
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # check if same with old password
            if not user.check_password(serializer.validated_data.get('old_password')):
                return Response(
                    {"old_password": ["Wrong password."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # set neew password 
            user.set_password(serializer.validated_data.get('new_password'))
            user.save()
            
            return Response(
                {"message": "Password updated successfully."}, 
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)