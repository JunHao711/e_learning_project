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
    represents a category for courses
    like computer science, business, mathematics
    '''
    title = models.CharField(max_length=200)
    # url short label for the subject
    slug = models.SlugField(max_length=200, unique=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title
    
class Course(models.Model):
    '''
    represent a single course offering
    for example, a computer science subject contain
    advance web development, Machine learning
    '''

    # the owner of the course
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,related_name='courses_created',on_delete=models.CASCADE)
    # secondary instructors for the course
    co_instructors = models.ManyToManyField(settings.AUTH_USER_MODEL,related_name='courses_lecturer',blank=True)
    # student enrolled in the course
    students = models.ManyToManyField(settings.AUTH_USER_MODEL,through='students.Enrollment',related_name='courses_joined',blank=True)
    # students who have been banned
    blocked_students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='blocked_courses', blank=True)
    # the subject cateogry this couorse belongs to 
    subject = models.ForeignKey(Subject,related_name='courses',on_delete=models.CASCADE)
    # unique identifier
    course_code = models.CharField(max_length=20,unique=True,default='TEMP001')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    image = models.ImageField(upload_to='course_images/', blank=True, null=True)
    overview = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def save(self,*args, **kwargs):
        '''
        automatically generate a unique slug based on the
        course title if doesn't already exist
        '''
        if not self.slug:
            self.slug = slugify(self.title)
            original_slug = self.slug
            counter = 1
            # check for collisions and append a number until the slug is unique
            while Course.objects.filter(slug=self.slug).exists():
                self.slug = f'{original_slug}-{counter}'
                counter +=1
        
        super().save(*args, **kwargs)
    
    def average_rating(self):
        '''
        Calculates and returns the average star rating for all related CourseReview
        0 means there are not review yet 
        '''
        reviews = self.reviews.all()
        if reviews.exists():
            total = sum([r.rating for r in reviews])
            return round(total /reviews.count(), 1)
        return 0

    def __str__(self):
        return self.title
    
class Module(models.Model):
    '''
    represent a section or chapter within a course
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
    '''
    links a specific Module to varying types of content 
    (Text, Video, Image, File)
    '''
    module = models.ForeignKey(Module,related_name='contents',on_delete=models.CASCADE)
    # act as a pointer to the speicfic database table
    # limit_choices_to restricts this to only our specific content models
    content_type = models.ForeignKey(ContentType,on_delete=models.CASCADE,
                                     limit_choices_to={
                                         'model__in':('text','video','image','file')
                                     })
    object_id = models.PositiveIntegerField()
    # binds the content_type and object_id together to let us access the actual object directly
    item = GenericForeignKey('content_type','object_id')

    order = models.PositiveIntegerField(default=0)

    # track who complete this content
    completed_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='completed_contents', blank=True)
    class Meta:
        ordering = ['order']

class ItemBase(models.Model):
    '''
    provides common fields for all specific content types
    
    '''
    owner = models.ForeignKey(settings.AUTH_USER_MODEL,
                              related_name='%(class)s_related',
                              on_delete=models.CASCADE)
    title = models.CharField(max_length=250)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True # set true to avoid create a database for this model itself

    def __str__(self):
        return self.title

class CourseReview(models.Model):
    '''
    store course reviews and ratings from students
    '''
    course = models.ForeignKey(Course, related_name='reviews', on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews_written', on_delete=models.CASCADE)
    # restricts the rating to integer values between 1 and 5
    rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)], default=5)
    comment = models.TextField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        # a student can only review a course once
        unique_together = ['course', 'student'] 
        ordering = ['-created'] # Show newest reviews first

    def __str__(self):
        return f"{self.rating} stars - {self.course.title}"

class Text(ItemBase):
    ''' Stores text-based learning materials '''
    content = models.TextField()

class File(ItemBase):
    ''' Stores downloadable files. Restricted to PDFs and ZIP files '''
    file = models.FileField(
        upload_to='files',
        validators=[FileExtensionValidator(allowed_extensions=['pdf','zip'])]
    )

class Image(ItemBase):
    ''' Stores image-based learning materials '''
    file = models.FileField(upload_to='images')

class Video(ItemBase):
    ''' Stores links/URLs to video content '''
    url = models.URLField()
