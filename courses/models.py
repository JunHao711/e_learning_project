from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
from .fields import OrderField

# Create your models here.
class Subject(models.Model):
    '''
    Like computer science, business ...
    '''
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title
    
class Course(models.Model):
    '''
    like advance web development, IoT ...
    '''

    #
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,related_name='courses_created',on_delete=models.CASCADE)
    co_instructors = models.ManyToManyField(settings.AUTH_USER_MODEL,related_name='courses_lecturer',blank=True)
    students = models.ManyToManyField(settings.AUTH_USER_MODEL,
                                      through='students.Enrollment',
                                      related_name='courses_joined',
                                      blank=True)
    # 
    blocked_students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='blocked_courses', blank=True)
    subject = models.ForeignKey(Subject,related_name='courses',on_delete=models.CASCADE)
    course_code = models.CharField(max_length=20,unique=True,default='TEMP001')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    overview = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def save(self,*args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            original_slug = self.slug
            counter = 1

            while Course.objects.filter(slug=self.slug).exists():
                self.slug = f'{original_slug}-{counter}'
                counter +=1
        
        super().save(*args, **kwargs)
    
    def average_rating(self):
        reviews = self.reviews.all()
        if reviews.exists():
            total = sum([r.rating for r in reviews])
            return round(total /reviews.count(), 1)
        return 0

    def __str__(self):
        return self.title
    
class Module(models.Model):
    '''
    Course section
    '''
    course = models.ForeignKey(Course,related_name='modules',on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.order}. {self.title}'

class Content(models.Model):
    module = models.ForeignKey(Module,related_name='contents',on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType,on_delete=models.CASCADE,
                                     limit_choices_to={
                                         'model__in':('text','video','image','file')
                                     })
    object_id = models.PositiveIntegerField()
    item = GenericForeignKey('content_type','object_id')

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

class ItemBase(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,
                              related_name='%(class)s_related',
                              on_delete=models.CASCADE)
    title = models.CharField(max_length=250)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.title

class CourseReview(models.Model):
    '''
    store course reviews and ratings from students
    '''
    course = models.ForeignKey(Course, related_name='reviews', on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews_written', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)], default=5)
    comment = models.TextField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        # Constraint: A student can only review a course once
        unique_together = ['course', 'student'] 
        ordering = ['-created'] # Show newest reviews first

    def __str__(self):
        return f"{self.rating} stars - {self.course.title}"

class Text(ItemBase):
    content = models.TextField()

class File(ItemBase):
    file = models.FileField(
        upload_to='files',
        validators=[FileExtensionValidator(allowed_extensions=['pdf','zip'])]
    )

class Image(ItemBase):
    file = models.FileField(upload_to='images')

class Video(ItemBase):
    url = models.URLField()
