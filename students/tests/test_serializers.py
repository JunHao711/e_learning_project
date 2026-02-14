from django.test import TestCase
from students.serializers import CourseReviewSerializer

class CourseReviewSerializerTests(TestCase):
    
    def test_review_serializer_validation(self):
        """
        Test that the serializer accepts valid data and correctly 
        ignores attempts to maliciously inject read-only fields like 'student_name'.
        """
        data = {
            'rating': 4,
            'comment': 'Very informative.',
            'student_name': 'hacker_trying_to_impersonate' # This should be ignored
        }
        
        serializer = CourseReviewSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Verify that 'student_name' is not in the validated data 
        # because it is a read-only field assigned by the View.
        self.assertNotIn('student_name', serializer.validated_data)
        self.assertEqual(serializer.validated_data['rating'], 4)