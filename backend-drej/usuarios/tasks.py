# usuarios/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)


@shared_task(name='enviar_email_recuperacion_password', bind=True, max_retries=3)
def enviar_email_recuperacion_password(self, user_email, user_name, reset_token):
    """
    Envía email con link de recuperación de contraseña
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
        reset_token (str): Token UUID para recuperación
    
    Returns:
        dict: Resultado del envío
    """
    try:
        # Construir URL de recuperación
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        
        # Contexto para el template
        context = {
            'user_name': user_name,
            'reset_url': reset_url,
            'expiration_hours': settings.PASSWORD_RESET_TIMEOUT // 3600,
        }
        
        # Mensaje HTML (opcional - puedes crear un template HTML más bonito)
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recuperación de Contraseña - VocaRed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">VocaRed</h1>
                </div>
                
                <h2 style="color: #333;">Recuperación de Contraseña</h2>
                
                <p>Hola <strong>{user_name}</strong>,</p>
                
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en VocaRed.</p>
                
                <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #2563eb; 
                              color: white; 
                              padding: 12px 30px; 
                              text-decoration: none; 
                              border-radius: 5px; 
                              display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 3px;">
                    {reset_url}
                </p>
                
                <p><strong>Este enlace expirará en {context['expiration_hours']} hora(s).</strong></p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #666; font-size: 14px;">
                    <strong>¿No solicitaste este cambio?</strong><br>
                    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    Este es un correo automático, por favor no respondas a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Mensaje de texto plano (fallback)
        text_message = f"""
        Hola {user_name},

        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en VocaRed.

        Para crear una nueva contraseña, copia y pega el siguiente enlace en tu navegador:
        {reset_url}

        Este enlace expirará en {context['expiration_hours']} hora(s).

        ¿No solicitaste este cambio?
        Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.

        ---
        VocaRed - Sistema de Orientación Vocacional
        """
        
        # Enviar email
        result = send_mail(
            subject='Recuperación de Contraseña - VocaRed',
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"[CELERY] Email de recuperación enviado a {user_email}")
        
        return {
            'success': True,
            'email': user_email,
            'message': 'Email enviado exitosamente'
        }
    
    except Exception as exc:
        logger.error(f"[CELERY] Error al enviar email a {user_email}: {str(exc)}")
        
        # Reintentar después de 60 segundos
        raise self.retry(exc=exc, countdown=60)


@shared_task(name='enviar_confirmacion_cambio_password')
def enviar_confirmacion_cambio_password(user_email, user_name):
    """
    Envía email de confirmación después de cambiar la contraseña
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
    """
    try:
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Contraseña Actualizada - VocaRed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">VocaRed</h1>
                </div>
                
                <h2 style="color: #10b981;">✓ Contraseña Actualizada</h2>
                
                <p>Hola <strong>{user_name}</strong>,</p>
                
                <p>Tu contraseña ha sido actualizada exitosamente.</p>
                
                <p>Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px;">
                    Este es un correo automático, por favor no respondas a este mensaje.
                </p>
            </div>
        </body>
        </html>
        """
        
        text_message = f"""
        Hola {user_name},

        Tu contraseña ha sido actualizada exitosamente.

        Si no realizaste este cambio, por favor contacta inmediatamente a nuestro equipo de soporte.

        ---
        VocaRed - Sistema de Orientación Vocacional
        """
        
        send_mail(
            subject='Contraseña Actualizada - VocaRed',
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"[CELERY] Email de confirmación enviado a {user_email}")
        
        return {'success': True, 'email': user_email}
    
    except Exception as e:
        logger.error(f"[CELERY] Error al enviar confirmación a {user_email}: {str(e)}")
        return {'success': False, 'error': str(e)}
    

    # Agregar al archivo usuarios/tasks.py

@shared_task(name='limpiar_tokens_expirados')
def limpiar_tokens_expirados():
    """
    Tarea periódica para limpiar tokens de recuperación expirados
    Puede ejecutarse con Celery Beat (programador)
    
    Para ejecutar manualmente:
    from usuarios.tasks import limpiar_tokens_expirados
    limpiar_tokens_expirados.delay()
    """
    from datetime import timedelta
    from django.utils import timezone
    from .models import PasswordResetToken
    
    try:
        # Eliminar tokens creados hace más de 24 horas
        fecha_limite = timezone.now() - timedelta(hours=24)
        
        tokens_eliminados = PasswordResetToken.objects.filter(
            created_at__lt=fecha_limite
        ).delete()
        
        logger.info(f"[CELERY] Tokens expirados eliminados: {tokens_eliminados[0]}")
        
        return {
            'success': True,
            'tokens_eliminados': tokens_eliminados[0],
            'message': f'Se eliminaron {tokens_eliminados[0]} tokens expirados'
        }
    
    except Exception as e:
        logger.error(f"[CELERY] Error al limpiar tokens: {str(e)}")
        return {'success': False, 'error': str(e)}