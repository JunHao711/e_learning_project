from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .factories import CustomUserFactory, AdminUserFactory
from users.models import CustomUser

class UserAPIIntegrationTests(APITestCase):
    
    def setUp(self):
        """Initialize test data and URLs."""
        self.student = CustomUserFactory(role='student')
        self.admin_user = AdminUserFactory()
        self.register_url = reverse('users:api_user_register')
        self.dashboard_url = reverse('users:api_admin_dashboard')

    def test_user_registration_api_success(self):
        """Test the registration endpoint successfully creates a user in the database."""
        payload = {
            'username': 'apistudent',
            'email': 'api@test.com',
            'password': 'strongpassword',
            'role': 'student'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(username='apistudent').exists())

    def test_admin_dashboard_access_denied_for_students(self):
        """Security: Ensure students receive a 403 Forbidden when accessing the admin dashboard."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_dashboard_access_granted_for_admins(self):
        """Security: Ensure admins can successfully access the dashboard and retrieve stats."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)