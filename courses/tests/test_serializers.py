from django.test import TestCase
from courses.serializers import ContentSerializer
from .factories import ModuleFactory, TextFactory, VideoFactory, ContentFactory

class PolymorphicSerializerTests(TestCase):
    
    def test_text_content_serialization(self):
        """
        Test that ContentSerializer correctly detects a Text model 
        and injects the 'type': 'text' key for React frontend.
        """
        text_item = TextFactory()
        content_link = ContentFactory(item=text_item)
        
        serializer = ContentSerializer(content_link)
        data = serializer.data
        
        # Verify polymorphic behavior
        self.assertIn('item', data)
        self.assertEqual(data['item']['type'], 'text')
        self.assertEqual(data['item']['content'], text_item.content)
        self.assertEqual(data['item']['title'], text_item.title)

    def test_video_content_serialization(self):
        """
        Test that ContentSerializer correctly detects a Video model.
        """
        video_item = VideoFactory()
        content_link = ContentFactory(item=video_item)
        
        serializer = ContentSerializer(content_link)
        data = serializer.data
        
        self.assertEqual(data['item']['type'], 'video')
        self.assertEqual(data['item']['url'], video_item.url)