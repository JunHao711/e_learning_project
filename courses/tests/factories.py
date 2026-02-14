import factory
from users.tests.factories import CustomUserFactory
from courses.models import Subject, Course, Module, Text, Video, Content

class SubjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subject
    
    title = factory.Sequence(lambda n: f'Subject {n}')
    slug = factory.Sequence(lambda n: f'subject-{n}')

class CourseFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Course

    owner = factory.SubFactory(CustomUserFactory, role='teacher')
    subject = factory.SubFactory(SubjectFactory)
    title = factory.Sequence(lambda n: f'Course {n}')
    slug = factory.Sequence(lambda n: f'course-{n}')
    course_code = factory.Sequence(lambda n: f'CODE{n}')
    overview = "Course overview test data."

class ModuleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Module

    course = factory.SubFactory(CourseFactory)
    title = factory.Sequence(lambda n: f'Module {n}')
    description = "Module description test data."

class TextFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Text
    
    owner = factory.SubFactory(CustomUserFactory, role='teacher')
    title = "Test Text Title"
    content = "This is a test paragraph for the text module."

class VideoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Video
    
    owner = factory.SubFactory(CustomUserFactory, role='teacher')
    title = "Test Video Title"
    url = "https://youtube.com/watch?v=test"

class ContentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Content
        
    module = factory.SubFactory(ModuleFactory)