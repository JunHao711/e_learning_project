from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

class TeacherRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    '''
    Mixin to ensure the user is logged in and is a teacher
    '''

    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_teacher
    
class OwnerEditMixin(object):
    '''
    Mixin to ensure only the owner or co-instructors can edit the course
    '''
    def form_valid(self,form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

class OwnerCourseMixin(TeacherRequiredMixin,UserPassesTestMixin):
    '''
    Filter the queryset so teachers can only see course they own
    '''
    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(
            Q(owner=self.request.user) | Q(co_instructors=self.request.user)
        ).distinct()

