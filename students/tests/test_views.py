from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .factories import CourseFactory
from users.tests.factories import CustomUserFactory
from courses.models import CourseReview

class StudentAPIIntegrationTests(APITestCase):
    
    def setUp(self):
        """Initialize test users and courses."""
        self.student = CustomUserFactory(role='student')
        self.teacher = CustomUserFactory(role='teacher')
        self.course = CourseFactory(owner=self.teacher)
        
        # API Endpoints
        self.enroll_url = reverse('students:api_student_enroll')
        self.detail_url = reverse('students:api_student_course_detail', kwargs={'pk': self.course.id})
        self.review_url = reverse('students:api_student_course_review', kwargs={'pk': self.course.id})

    def test_enrollment_success(self):
        """Test that a valid student can enroll in a course."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.enroll_url, {'course_id': self.course.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.student, self.course.students.all())

    def test_enrollment_blocked_student(self):
        """Security: Test that a blocked student is strictly prevented from enrolling."""
        self.course.blocked_students.add(self.student) # Add to blocklist
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.enroll_url, {'course_id': self.course.id})
        
        # Expect a 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn(self.student, self.course.students.all())

    def test_course_detail_access_denied_if_not_enrolled(self):
        """Security: Prevent students from viewing courses they haven't paid for/enrolled in."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.detail_url)
        
        # Not enrolled yet, expect 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_duplicate_review_prevention(self):
        """Business Logic: Ensure a student cannot leave multiple reviews for the same course."""
        # 1. Enroll the student
        self.course.students.add(self.student)
        self.client.force_authenticate(user=self.student)
        
        # 2. Leave first review
        self.client.post(self.review_url, {'rating': 5, 'comment': 'First!'})
        
        # 3. Attempt second review
        response = self.client.post(self.review_url, {'rating': 1, 'comment': 'Second! Spam!'})
        
        # Expect rejection and ensure only 1 review exists in DB
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(CourseReview.objects.filter(student=self.student, course=self.course).count(), 1)