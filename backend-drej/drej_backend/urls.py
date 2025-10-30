from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from usuarios.api import RegisterView, MeView
from django.contrib import admin

def home_view(request):
    return JsonResponse({
        'message': 'Bienvenido a la API de VocaRed',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/auth/',
            'usuarios': '/api/',
        }
    })

urlpatterns = [
    # Rutas de autenticación
    path("api/auth/register/", RegisterView.as_view()),
    path("api/auth/token/", TokenObtainPairView.as_view()),
    path("api/auth/token/refresh/", TokenRefreshView.as_view()),
    path("api/auth/me/", MeView.as_view()),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # Rutas de usuarios (registro, validaciones)
    path('api/', include('usuarios.urls')),  # ← CAMBIAR A usuarios.urls
    
    # Home
    path('', home_view, name='home'),
]