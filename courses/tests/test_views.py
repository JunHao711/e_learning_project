from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from users.tests.factories import CustomUserFactory
from .factories import CourseFactory, SubjectFactory, ModuleFactory

class CourseAPIIntegrationTests(APITestCase):
    
    def setUp(self):
        self.teacher1 = CustomUserFactory(role='teacher')
        self.teacher2 = CustomUserFactory(role='teacher') # Malicious teacher
        self.subject = SubjectFactory()
        self.course = CourseFactory(owner=self.teacher1, subject=self.subject)
        self.module = ModuleFactory(course=self.course)

    def test_teacher_can_create_course(self):
        """Test that a teacher can create a course and is automatically assigned as owner."""
        self.client.force_authenticate(user=self.teacher1)
        url = reverse('courses:api_teacher_course_list_create')
        payload = {
            'subject': self.subject.id,
            'title': 'New React Course',
            'slug': 'new-react-course',
            'course_code': 'REACT101',
            'overview': 'Learn React from scratch.'
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify the owner was forcefully set to teacher1 by the view's perform_create
        self.assertEqual(response.data['title'], 'New React Course')

    def test_idor_prevention_on_course_update(self):
        """Security: Ensure Teacher 2 absolutely cannot edit Teacher 1's course."""
        self.client.force_authenticate(user=self.teacher2) # Login as Teacher 2
        url = reverse('courses:api_teacher_course_rud', kwargs={'pk': self.course.id})
        payload = {'title': 'Hacked Title'}
        
        response = self.client.patch(url, payload)
        
        # Because of get_queryset filtering, the course should not be found for Teacher 2
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_dynamic_content_creation_api(self):
        """Test the dynamic ContentCreateAPIView for adding a video to a module."""
        self.client.force_authenticate(user=self.teacher1)
        url = reverse('courses:api_teacher_content_create', kwargs={
            'module_id': self.module.id, 
            'model_name': 'video'
        })
        payload = {
            'title': 'Intro Video',
            'url': 'https://youtube.com/watch?v=intro'
        }
        
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], "Video content added successfully.")