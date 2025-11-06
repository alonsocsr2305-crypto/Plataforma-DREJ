import requests
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

#@api_view(['GET'])
#@permission_classes([AllowAny])
#def consultar_reniec(request, dni):
    """
    Consultar datos de una persona por DNI usando Factiliza API
    """
    from django.conf import settings
    
    if not dni or len(dni) != 8 or not dni.isdigit():
        return Response({
            "success": False,
            "message": "DNI inválido. Debe tener 8 dígitos."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        api_token = settings.FACTILIZA_API_TOKEN
        
        if not api_token:
            logger.error("[FACTILIZA] Token de API no configurado")
            return Response({
                "success": False,
                "message": "Servicio de consulta no configurado"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        url = f"https://api.factiliza.com/v1/dni/info/{dni}"
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"[FACTILIZA] Consultando DNI: {dni}")
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[FACTILIZA] Consulta exitosa para DNI: {dni}")
            
            return Response({
                "success": True,
                "dni": dni,
                "nombres": data.get("nombres", data.get("name", "")),
                "apellidoPaterno": data.get("apellidoPaterno", data.get("paternal_surname", "")),
                "apellidoMaterno": data.get("apellidoMaterno", data.get("maternal_surname", "")),
                "fechaNacimiento": data.get("fechaNacimiento", data.get("birth_date", "")),
            }, status=status.HTTP_200_OK)
        
        elif response.status_code == 404:
            logger.warning(f"[FACTILIZA] DNI no encontrado: {dni}")
            return Response({
                "success": False,
                "message": "No se encontró información para este DNI"
            }, status=status.HTTP_404_NOT_FOUND)
        
        elif response.status_code == 401:
            logger.error("[FACTILIZA] Token inválido o expirado")
            return Response({
                "success": False,
                "message": "Error de autenticación con el servicio"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            logger.error(f"[FACTILIZA] Error de API: {response.status_code} - {response.text}")
            return Response({
                "success": False,
                "message": "Error al consultar el servicio de identificación"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except requests.exceptions.Timeout:
        logger.error(f"[FACTILIZA] Timeout al consultar DNI: {dni}")
        return Response({
            "success": False,
            "message": "El servicio tardó demasiado en responder. Intenta nuevamente."
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)
    
    except requests.exceptions.ConnectionError:
        logger.error(f"[FACTILIZA] Error de conexión al consultar DNI: {dni}")
        return Response({
            "success": False,
            "message": "No se pudo conectar con el servicio de identificación"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    except Exception as e:
        logger.error(f"[FACTILIZA] Error inesperado: {str(e)}", exc_info=True)
        return Response({
            "success": False,
            "message": "Error interno del servidor" 
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def consultar_reniec_mock(request, dni):
    """
    MOCK para pruebas - Consultar DNI desde tabla local sin consumir API
    
    GET /api/reniec/mock/<dni>/
    
    Usa esta ruta para pruebas y conserva tus 98 consultas de la API real.
    """
    
    # Base de datos de prueba con DNIs ficticios
    DNIS_PRUEBA = {
        '12345678': {
            'nombres': 'JUAN CARLOS',
            'apellidoPaterno': 'PEREZ',
            'apellidoMaterno': 'GARCIA',
            'fechaNacimiento': '1995-05-15'
        },
        '11111111': {
            'nombres': 'MARIA ELENA',
            'apellidoPaterno': 'RODRIGUEZ',
            'apellidoMaterno': 'TORRES',
            'fechaNacimiento': '1998-08-20'
        },
        '22222222': {
            'nombres': 'PEDRO JOSE',
            'apellidoPaterno': 'SANCHEZ',
            'apellidoMaterno': 'LOPEZ',
            'fechaNacimiento': '2000-01-10'
        },
        '33333333': {
            'nombres': 'ANA SOFIA',
            'apellidoPaterno': 'MARTINEZ',
            'apellidoMaterno': 'DIAZ',
            'fechaNacimiento': '1997-12-05'
        },
        '44444444': {
            'nombres': 'CARLOS ALBERTO',
            'apellidoPaterno': 'FERNANDEZ',
            'apellidoMaterno': 'QUISPE',
            'fechaNacimiento': '1999-03-25'
        }
    }
    
    # Validar formato de DNI
    if not dni or len(dni) != 8 or not dni.isdigit():
        return Response({
            "success": False,
            "message": "DNI inválido. Debe tener 8 dígitos."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Buscar en la base de datos de prueba
    if dni in DNIS_PRUEBA:
        data = DNIS_PRUEBA[dni]
        logger.info(f"[MOCK] DNI encontrado en base de prueba: {dni}")
        
        return Response({
            "success": True,
            "dni": dni,
            "nombres": data['nombres'],
            "apellidoPaterno": data['apellidoPaterno'],
            "apellidoMaterno": data['apellidoMaterno'],
            "fechaNacimiento": data['fechaNacimiento'],
        }, status=status.HTTP_200_OK)
    else:
        logger.warning(f"[MOCK] DNI no encontrado en base de prueba: {dni}")
        return Response({
            "success": False,
            "message": "DNI no encontrado en base de datos de prueba"
        }, status=status.HTTP_404_NOT_FOUND)