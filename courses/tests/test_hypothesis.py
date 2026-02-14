from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase
from courses.serializers import TeacherCourseSerializer
from .factories import SubjectFactory

class CourseHypothesisTests(HypothesisTestCase):
    
    @classmethod
    def setUpTestData(cls):
        # Create a valid subject once for all fuzzing tests
        cls.subject = SubjectFactory()

    @given(
        st.text(min_size=1, max_size=500), # Fuzz massive/weird titles
        st.text(min_size=1, max_size=500), # Fuzz massive slugs
        st.text(min_size=1, max_size=5000) # Fuzz huge overview texts
    )
    @settings(deadline=None, max_examples=30)  
    def test_teacher_course_serializer_boundary_fuzzing(self, rand_title, rand_slug, rand_overview):
        """
        Pummels the TeacherCourseSerializer with huge text and weird unicode.
        Proves system robustness against unexpected input lengths.
        """
        data = {
            'subject': self.subject.id,
            'title': rand_title,
            'slug': rand_slug,
            'course_code': 'FUZZ101',
            'overview': rand_overview
        }
        serializer = TeacherCourseSerializer(data=data)
        
        try:
            is_valid = serializer.is_valid()
            
            # If it magically passes validation (meaning strings fit inside model MaxLength),
            # the validated data should accurately reflect the input.
            if is_valid:
                self.assertEqual(serializer.validated_data['title'], rand_title)
                
        except Exception as e:
            self.fail(f"Server crashed (500 Error) under fuzzing load in TeacherCourseSerializer: {e}")