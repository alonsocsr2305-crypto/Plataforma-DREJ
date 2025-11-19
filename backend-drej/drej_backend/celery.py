# drej_backend/celery.py
# Crear este archivo en la carpeta del proyecto (donde está settings.py)

import os
from celery import Celery
from celery.schedules import crontab

# Establecer el módulo de configuración de Django por defecto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drej_backend.settings')

# Crear instancia de Celery
app = Celery('drej_backend')

# Cargar configuración desde Django settings con namespace 'CELERY'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodescubrir tareas en todas las apps instaladas
# Buscará archivos tasks.py en cada app
app.autodiscover_tasks()

# Tarea de prueba para verificar que Celery funciona
@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

# Configuración de tareas periódicas (opcional)
# Descomentar si quieres tareas programadas
"""
app.conf.beat_schedule = {
    'limpiar-tokens-expirados': {
        'task': 'usuarios.tasks.limpiar_tokens_expirados',
        'schedule': crontab(hour=2, minute=0),  # Todos los días a las 2 AM
    },
}
"""