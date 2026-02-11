import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('elearning')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()