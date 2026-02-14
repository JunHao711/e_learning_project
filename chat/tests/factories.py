import factory
from users.tests.factories import CustomUserFactory
from courses.tests.factories import CourseFactory
from chat.models import Message, PrivateMessage

class MessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Message
    
    sender = factory.SubFactory(CustomUserFactory, role='student')
    course = factory.SubFactory(CourseFactory)
    content = factory.Sequence(lambda n: f'Group chat message {n}')

class PrivateMessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PrivateMessage
    
    sender = factory.SubFactory(CustomUserFactory, role='student')
    recipient = factory.SubFactory(CustomUserFactory, role='teacher')
    content = factory.Sequence(lambda n: f'Private message {n}')