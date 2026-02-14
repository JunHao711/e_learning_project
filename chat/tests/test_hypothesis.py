from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase
from chat.serializers import PrivateMessageSerializer
from users.tests.factories import CustomUserFactory

class ChatHypothesisTests(HypothesisTestCase):
    
    @classmethod
    def setUpTestData(cls):
        cls.sender = CustomUserFactory()
        cls.recipient = CustomUserFactory()

    @given(
        st.text(min_size=1, max_size=5000) 
    )
    @settings(deadline=None, max_examples=30)  
    def test_chat_message_fuzzing(self, rand_content):
        """
        Pummels the PrivateMessageSerializer with massive texts and weird unicode.
        Proves system robustness against exotic chat inputs.
        """
        data = {
            'content': rand_content
        }
        
        serializer = PrivateMessageSerializer(data=data)
        
        try:
            is_valid = serializer.is_valid()
            if is_valid:
                self.assertEqual(serializer.validated_data['content'], rand_content.strip())
                
        except Exception as e:
            self.fail(f"Server crashed (500 Error) under fuzzing load in Chat Serializer: {e}")