from django.test import TestCase
from chat.serializers import ChatUserSnippetSerializer, PrivateMessageSerializer
from users.tests.factories import CustomUserFactory
from .factories import PrivateMessageFactory

class ChatSerializerSecurityTests(TestCase):
    
    def test_user_snippet_data_minimization(self):
        """
        Security: Ensure the chat payload NEVER leaks the user's email, password, or role.
        """
        user = CustomUserFactory(username='chatuser', email='secret@test.com', role='student')
        serializer = ChatUserSnippetSerializer(user)
        data = serializer.data
        
        self.assertIn('username', data)
        self.assertEqual(data['username'], 'chatuser')
        self.assertNotIn('email', data)
        self.assertNotIn('password', data)
        self.assertNotIn('role', data)

    def test_private_message_serialization(self):
        """Test nested serialization and timestamp formatting."""
        msg = PrivateMessageFactory()
        serializer = PrivateMessageSerializer(msg)
        data = serializer.data
        
        self.assertIn('sender_info', data)
        self.assertEqual(data['sender_info']['username'], msg.sender.username)
        self.assertIn('formatted_timestamp', data)