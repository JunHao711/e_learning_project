from hypothesis import given, settings, strategies as st
from hypothesis.extra.django import TestCase as HypothesisTestCase
from users.serializers import UserRegistrationSerializer

class UserHypothesisTests(HypothesisTestCase):
    
    @given(
        st.text(min_size=3, max_size=20, alphabet=st.characters(whitelist_categories=('L', 'N'))),
        st.emails(), 
        st.text(min_size=8, max_size=50) 
    )
    # deadline=None prevents timeout failures caused by Django's slow password hashing
    # max_examples=20 keeps the test suite fast while still providing valuable fuzzing
    @settings(deadline=None, max_examples=20)  
    def test_serializer_handles_random_valid_data(self, rand_username, rand_email, rand_password):
        """
        Generates random strings to ensure the registration serializer does not 
        throw 500 Server Errors when handling unexpected unicode characters.
        """
        data = {
            'username': rand_username,
            'email': rand_email,
            'password': rand_password,
            'role': 'student'
        }
        serializer = UserRegistrationSerializer(data=data)
        
        try:
            is_valid = serializer.is_valid()
            if is_valid:
                user = serializer.save()
                # Use user.pk to verify creation rather than string matching, 
                # bypassing Django's internal unicode normalization of usernames.
                self.assertIsNotNone(user.pk)
                self.assertEqual(user.role, 'student')
        except Exception as e:
            self.fail(f"Serializer crashed with valid-looking random data: {e}")