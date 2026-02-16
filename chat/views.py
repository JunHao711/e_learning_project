from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from courses.models import Course
from .models import PrivateMessage
from .serializers import ChatMessageSerializer, PrivateMessageSerializer

User = get_user_model()

class CourseChatHistoryAPIView(generics.ListAPIView):
    """
    GET /api/chat/courses/<course_id>/history/
    Retrieve the latest 50 messages for a course chat room.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course = get_object_or_404(Course, id=self.kwargs['course_id'])
        
        # only enrolled students or course teacher can see the course chat
        if self.request.user not in course.students.all() and self.request.user.id != course.owner.id:
            raise PermissionDenied("You do not have access to this course's chat.")
            
        return course.chat_messages.all().order_by('-timestamp')[:50]

class PrivateChatHistoryAPIView(generics.ListAPIView):
    """
    GET /api/chat/private/<target_user_id>/history/
    Retrieve the latest 50 messages between the current user and a target user.
    """
    serializer_class = PrivateMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        target_user = get_object_or_404(User, id=self.kwargs['target_user_id'])
        
        if self.request.user == target_user:
            raise PermissionDenied("You cannot chat with yourself.")

        # retrieve sender and recipient message
        return PrivateMessage.objects.filter(
            Q(sender=self.request.user, recipient=target_user) | 
            Q(sender=target_user, recipient=self.request.user)
        ).order_by('-timestamp')[:50]

    def list(self, request, *args, **kwargs):
        """
        override list method to return chat list and room name for web socket
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        target_user_id = self.kwargs['target_user_id']
        user1_id = min(request.user.id, int(target_user_id))
        user2_id = max(request.user.id, int(target_user_id))
        room_name = f"private_{user1_id}_{user2_id}"

        serializer = self.get_serializer(queryset[::-1], many=True)
        return Response({
            "room_name": room_name,
            "messages": serializer.data
        })

class ChatFileUploadAPIView(APIView):
    """
    POST /api/chat/upload/
    Handles file/image uploads for the chat system.
    Strictly accepts multipart/form-data.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        file_name = f"chat_files/{request.user.id}_{uploaded_file.name}"
        path = default_storage.save(file_name, ContentFile(uploaded_file.read()))
        file_url = default_storage.url(path)

        return Response({
            "status": "ok", 
            "url": file_url, 
            "name": uploaded_file.name
        }, status=status.HTTP_201_CREATED)

class RecentConversationsAPIView(APIView):
    """
    GET /api/chat/conversations/
    Retrieves a list of recent distinct conversations for the inbox sidebar.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        messages = PrivateMessage.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('-timestamp')

        partners = set()
        conversations = []

        for msg in messages:
            partner = msg.recipient if msg.sender == user else msg.sender
            if partner not in partners:
                partners.add(partner)
                
                photo_url = "/static/images/default_avatar.png"
                if hasattr(partner, 'photo') and partner.photo:
                    photo_url = partner.photo.url
                
                conversations.append({
                    'partner_id': partner.id,
                    'username': partner.username,
                    'photo_url': photo_url,
                    'last_message': msg.content[:30] + '...' if msg.content else '[File]',
                    'timestamp': msg.timestamp.strftime('%H:%M %d/%m')
                })

        return Response({'conversations': conversations}, status=status.HTTP_200_OK)