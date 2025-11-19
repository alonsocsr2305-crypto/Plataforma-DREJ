# drej_backend/__init__.py
# Modificar o crear este archivo

# Esto asegura que Celery se cargue cuando Django inicia
from .celery import app as celery_app

__all__ = ('celery_app',)