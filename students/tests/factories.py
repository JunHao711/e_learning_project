import factory
from users.tests.factories import CustomUserFactory
from courses.models import Course, Subject, CourseReview

class SubjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subject
    
    title = factory.Sequence(lambda n: f'Subject {n}')
    slug = factory.Sequence(lambda n: f'subject-{n}')

class CourseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Course

    # Assign a teacher (using the CustomUserFactory from the users app)
    owner = factory.SubFactory(CustomUserFactory, role='teacher')
    subject = factory.SubFactory(SubjectFactory)
    title = factory.Sequence(lambda n: f'Test Course {n}')
    course_code = factory.Sequence(lambda n: f'CODE{n}')
    overview = "This is a test course overview."
    
class CourseReviewFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CourseReview
        
    course = factory.SubFactory(CourseFactory)
    student = factory.SubFactory(CustomUserFactory, role='student')
    rating = 5
    comment = "Excellent course!"