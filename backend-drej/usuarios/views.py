from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, InstitucionSerializer
from .models import InstitucionEducativa
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_instituciones(request):
    """Listar todas las instituciones educativas"""
    provincia = request.GET.get('provincia', None)
    
    if provincia:
        instituciones = InstitucionEducativa.objects.filter(InstitucionProvincia=provincia)
    else:
        instituciones = InstitucionEducativa.objects.all()
    
    serializer = InstitucionSerializer(instituciones, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])  # Permitir acceso sin autenticación
def register(request):
    
    try:
        logger.info(f"[REGISTER] Nueva solicitud de registro: {request.data.get('rol', 'N/A')}")
        
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            result = serializer.save()
            
            logger.info(f"[REGISTER] Usuario registrado exitosamente: {result['user'].username} ({result['rol']})")
            
            response_data = {
                'success': True,
                'message': result['message'],
                'user': {
                    'id': result['user'].id,
                    'username': result['user'].username,
                    'email': result['user'].email,
                    'first_name': result['user'].first_name,
                    'last_name': result['user'].last_name,
                    'rol': result['rol']
                }
            }
            
            if result['rol'] == 'Orientador':
                response_data['info'] = 'Tu cuenta está pendiente de verificación. Te notificaremos por email cuando sea aprobada.'
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        else:
            logger.warning(f"[REGISTER] Errores de validación: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"[REGISTER] Error inesperado: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Error interno del servidor. Por favor, intenta nuevamente.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_dni(request, dni):
    """
    Verificar si un DNI ya está registrado
    
    GET /api/check-dni/<dni>/
    """
    from django.contrib.auth.models import User
    from .models import Estudiante
    
    exists = (
        User.objects.filter(username=dni).exists() or
        Estudiante.objects.filter(EstudDNI=dni).exists()
    )
    
    return Response({'exists': exists})


@api_view(['GET'])
@permission_classes([AllowAny])
def check_email(request, email):
    """
    Verificar si un email ya está registrado
    
    GET /api/check-email/<email>/
    """
    from django.contrib.auth.models import User
    
    exists = User.objects.filter(email=email).exists()
    
    return Response({'exists': exists})


@api_view(['GET'])
@permission_classes([AllowAny])
def validate_domain(request):
    """
    Validar si un dominio de email está permitido para orientadores
    
    GET /api/validate-domain/?email=ejemplo@universidad.edu.pe
    """
    from .models import DominioPermitido
    
    email = request.query_params.get('email', '')
    
    if not email or '@' not in email:
        return Response({
            'valid': False,
            'message': 'Email inválido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    dominio = email.split('@')[1].lower()
    
    # Buscar en base de datos
    dominio_obj = DominioPermitido.objects.filter(
        Activo=True
    ).filter(
        DominioEmail=dominio
    ).first()
    
    if dominio_obj:
        return Response({
            'valid': True,
            'institucion': dominio_obj.NombreInstitucion,
            'tipo': dominio_obj.TipoInstitucion
        })
    
    # Validación alternativa con dominios comunes
    dominios_permitidos = ['.edu', '.edu.pe', '.ac.pe']
    if any(dominio.endswith(d) for d in dominios_permitidos):
        return Response({
            'valid': True,
            'institucion': 'Institución Educativa',
            'tipo': 'Universidad'
        })
    
    return Response({
        'valid': False,
        'message': 'Dominio no permitido para orientadores'
    })