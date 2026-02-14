from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from users.tests.factories import CustomUserFactory
from courses.tests.factories import CourseFactory
from .factories import PrivateMessageFactory

class ChatAPIIntegrationTests(APITestCase):
    
    def setUp(self):
        self.student = CustomUserFactory(role='student')
        self.hacker = CustomUserFactory(role='student') # Not enrolled
        self.teacher = CustomUserFactory(role='teacher')
        self.course = CourseFactory(owner=self.teacher)
        
        # Enroll the legitimate student
        self.course.students.add(self.student)

    def test_course_chat_history_access_denied(self):
        """Security: Prevent non-enrolled students from reading course chat."""
        self.client.force_authenticate(user=self.hacker)
        url = reverse('chat:api_course_chat_history', kwargs={'course_id': self.course.id})
        
        response = self.client.get(url)
        # Should be strictly forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_course_chat_history_access_granted(self):
        """Ensure enrolled students can read the chat."""
        self.client.force_authenticate(user=self.student)
        url = reverse('chat:api_course_chat_history', kwargs={'course_id': self.course.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_private_chat_self_loop_prevented(self):
        """Business Logic: A user cannot initiate a private chat with themselves."""
        self.client.force_authenticate(user=self.student)
        url = reverse('chat:api_private_chat_history', kwargs={'target_user_id': self.student.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_chat_file_upload(self):
        """Test the multi-part file upload endpoint."""
        self.client.force_authenticate(user=self.student)
        url = reverse('chat:api_chat_file_upload')
        
        # Create a mock image file
        mock_image = SimpleUploadedFile("test_image.jpg", b"file_content", content_type="image/jpeg")
        
        response = self.client.post(url, {'file': mock_image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('url', response.data)
        self.assertEqual(response.data['name'], 'test_image.jpg')