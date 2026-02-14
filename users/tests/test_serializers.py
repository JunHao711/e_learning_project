from django.test import TestCase
from users.serializers import UserRegistrationSerializer

class UserRegistrationSerializerTests(TestCase):
    
    def test_valid_student_registration(self):
        """Test that valid student data passes serialization."""
        data = {
            'username': 'newstudent',
            'email': 'student@test.com',
            'password': 'securepassword123',
            'role': 'student'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_registration_serializer_rejects_admin_role(self):
        """Test that the serializer strictly blocks 'admin' role creation."""
        data = {
            'username': 'hacker',
            'email': 'hacker@test.com',
            'password': 'hacktheplanet',
            'role': 'admin'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('role', serializer.errors)
        self.assertEqual(serializer.errors['role'][0], "Role must be either 'student' or 'teacher'.")