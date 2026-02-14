from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase
from students.serializers import CourseReviewSerializer

class ReviewHypothesisTests(HypothesisTestCase):
    
    @given(
        # Fuzz the rating with extreme integers (negative, zero, massive numbers)
        st.integers(min_value=-9999, max_value=9999),
        # Fuzz the comment with crazy unicode characters
        st.text(max_size=1000)
    )
    @settings(deadline=None, max_examples=50)  
    def test_review_serializer_boundary_fuzzing(self, rand_rating, rand_comment):
        """
        Pummels the review serializer with massive/negative integers and weird text.
        Proves that the system gracefully invalidates bad data without crashing (500 Error).
        """
        data = {
            'rating': rand_rating,
            'comment': rand_comment
        }
        serializer = CourseReviewSerializer(data=data)
        
        try:
            is_valid = serializer.is_valid()
            
            # If the serializer magically thinks the data is valid, 
            # we MUST ensure the rating is strictly between 1 and 5 (as defined in the model).
            if is_valid:
                self.assertIn(serializer.validated_data['rating'], [1, 2, 3, 4, 5])
                
        except Exception as e:
            self.fail(f"System crashed (Server Error) under fuzzing load: {e}")