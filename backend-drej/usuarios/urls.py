from django.urls import path
from . import views

urlpatterns = [
    # Registro y validaciones
    path('check-dni/<str:dni>/', views.check_dni, name='check-dni'),
    path('check-email/<str:email>/', views.check_email, name='check-email'),
    path('validate-domain/', views.validate_domain, name='validate-domain'),
    path('instituciones/', views.listar_instituciones, name='listar_instituciones'),
]