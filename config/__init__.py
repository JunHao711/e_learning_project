from .celery import app as celery_app

# ensures Celery loads when Django starts.
__all__ = ('celery_app',)