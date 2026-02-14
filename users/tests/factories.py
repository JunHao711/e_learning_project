import factory
from django.contrib.auth.hashers import make_password
from users.models import CustomUser

class CustomUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser

    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    # Pre-hash the password to speed up test creation
    password = factory.LazyFunction(lambda: make_password('testpass123'))
    role = 'student'
    is_active = True

class AdminUserFactory(CustomUserFactory):
    username = factory.Sequence(lambda n: f'admin{n}')
    role = 'admin'
    is_staff = True
    is_superuser = True