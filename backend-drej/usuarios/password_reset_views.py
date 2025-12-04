# usuarios/password_reset_views.py
# Crear este archivo nuevo

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Q
from .models import PasswordResetToken
from .tasks import enviar_email_recuperacion_password, enviar_confirmacion_cambio_password
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def solicitar_recuperacion_password(request):
    """
    Solicitar recuperación de contraseña
    
    POST /api/auth/password-reset/request/
    
    Body:
    {
        "identifier": "email@example.com" o "12345678" (DNI)
    }
    
    Returns:
        200: Email enviado (siempre, por seguridad)
    """
    identifier = request.data.get('identifier', '').strip()
    
    if not identifier:
        return Response({
            'success': False,
            'message': 'Debes proporcionar tu email o DNI'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buscar usuario por email o DNI (username)
        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()
        
        if user:
            # Crear token de recuperación
            reset_token = PasswordResetToken.create_token(user)
            
            # Obtener nombre del usuario
            user_name = user.get_full_name() or user.username
            
            # Enviar email de forma asíncrona con Celery
            enviar_email_recuperacion_password.delay(
                user_email=user.email,
                user_name=user_name,
                reset_token=str(reset_token.token)
            )
            
            logger.info(f"[PASSWORD_RESET] Solicitud de recuperación para: {user.username}")
        else:
            # Por seguridad, no revelar si el usuario existe o no
            logger.warning(f"[PASSWORD_RESET] Intento con identificador no existente: {identifier}")
        
        # Siempre devolver el mismo mensaje (seguridad)
        return Response({
            'success': True,
            'message': 'Si el email o DNI existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[PASSWORD_RESET] Error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Error al procesar la solicitud. Intenta nuevamente.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def validar_token_reset(request):
    """
    Validar si un token de recuperación es válido
    
    GET /api/auth/password-reset/validate-token/?token=uuid-token-here
    
    Returns:
        200: Token válido
        400: Token inválido o expirado
    """
    # Obtener token de query params en lugar de body
    token_str = request.GET.get('token', '').strip()
    
    if not token_str:
        return Response({
            'valid': False,
            'message': 'Token no proporcionado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buscar token
        reset_token = PasswordResetToken.objects.select_related('User').filter(
            token=token_str
        ).first()
        
        if not reset_token:
            return Response({
                'valid': False,
                'message': 'Token no válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el token es válido
        if not reset_token.is_valid():
            return Response({
                'valid': False,
                'message': 'El token ha expirado o ya fue utilizado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'valid': True,
            'message': 'Token válido',
            'user_email': reset_token.User.email
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[PASSWORD_RESET] Error validando token: {str(e)}")
        return Response({
            'valid': False,
            'message': 'Error al validar el token'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def resetear_password(request):
    """
    Resetear contraseña usando token válido
    
    POST /api/auth/password-reset/confirm/
    
    Body:
    {
        "token": "uuid-token-here",
        "new_password": "nueva_contraseña",
        "confirm_password": "nueva_contraseña"
    }
    
    Returns:
        200: Contraseña actualizada
        400: Error en validación
    """
    token_str = request.data.get('token', '').strip()
    new_password = request.data.get('new_password', '').strip()
    confirm_password = request.data.get('confirm_password', '').strip()
    
    # Validaciones
    if not token_str:
        return Response({
            'success': False,
            'message': 'Token no proporcionado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_password or not confirm_password:
        return Response({
            'success': False,
            'message': 'Debes proporcionar ambas contraseñas'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'success': False,
            'message': 'Las contraseñas no coinciden'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 8:
        return Response({
            'success': False,
            'message': 'La contraseña debe tener al menos 8 caracteres'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buscar token
        reset_token = PasswordResetToken.objects.select_related('User').filter(
            token=token_str
        ).first()
        
        if not reset_token:
            return Response({
                'success': False,
                'message': 'Token no válido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el token es válido
        if not reset_token.is_valid():
            return Response({
                'success': False,
                'message': 'El token ha expirado o ya fue utilizado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar contraseña
        user = reset_token.User
        user.set_password(new_password)
        user.save()
        
        # Marcar token como usado
        reset_token.mark_as_used()
        
        # Enviar email de confirmación (asíncrono)
        user_name = user.get_full_name() or user.username
        enviar_confirmacion_cambio_password.delay(
            user_email=user.email,
            user_name=user_name
        )
        
        logger.info(f"[PASSWORD_RESET] Contraseña actualizada para: {user.username}")
        
        return Response({
            'success': True,
            'message': 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[PASSWORD_RESET] Error al resetear contraseña: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Error al actualizar la contraseña. Intenta nuevamente.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)