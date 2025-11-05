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

@api_view(['GET'])
@permission_classes([AllowAny])
def consultar_reniec(request, dni):
    """
    Consultar datos de una persona por DNI en RENIEC
    
    GET /api/reniec/consultar/<dni>/
    
    NOTA: Este es un ejemplo básico. Debes adaptar esto según tu método de consulta a RENIEC:
    
    Opciones de integración:
    1. API oficial de RENIEC (requiere autorización)
    2. Servicio de terceros (APIs.net.pe, APIS Perú, etc.)
    3. Base de datos local propia
    
    Respuesta esperada:
    {
        "success": true,
        "nombres": "JUAN CARLOS",
        "apellidoPaterno": "PEREZ",
        "apellidoMaterno": "GARCIA",
        "fechaNacimiento": "1995-05-15",  # Opcional
        "dni": "12345678"
    }
    """
    
    # Validar formato de DNI
    if not dni or len(dni) != 8 or not dni.isdigit():
        return Response({
            "success": False,
            "message": "DNI inválido"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # ================================================================
        # OPCIÓN 1: API DE TERCEROS (EJEMPLO CON APIS.NET.PE)
        # ================================================================
        # NOTA: Necesitas registrarte y obtener un token en https://apis.net.pe/
        
        """
        API_TOKEN = "tu_token_aqui"  # Obtenerlo de apis.net.pe
        
        response = requests.get(
            f"https://api.apis.net.pe/v1/dni?numero={dni}",
            headers={
                "Authorization": f"Bearer {API_TOKEN}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return Response({
                "success": True,
                "nombres": data.get("nombres", ""),
                "apellidoPaterno": data.get("apellidoPaterno", ""),
                "apellidoMaterno": data.get("apellidoMaterno", ""),
                "dni": dni
            })
        else:
            return Response({
                "success": False,
                "message": "No se encontró información para este DNI"
            }, status=status.HTTP_404_NOT_FOUND)
        """
        
        # ================================================================
        # OPCIÓN 2: API GRATUITA (EJEMPLO CON APIPERU.DEV)
        # ================================================================
        # NOTA: Esta API es de ejemplo y puede tener límites de uso
        
        """
        response = requests.get(
            f"https://apiperu.dev/api/dni/{dni}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                return Response({
                    "success": True,
                    "nombres": data.get("data", {}).get("nombres", ""),
                    "apellidoPaterno": data.get("data", {}).get("apellido_paterno", ""),
                    "apellidoMaterno": data.get("data", {}).get("apellido_materno", ""),
                    "dni": dni
                })
        
        return Response({
            "success": False,
            "message": "No se encontró información"
        }, status=status.HTTP_404_NOT_FOUND)
        """
        
        # ================================================================
        # OPCIÓN 3: SIMULACIÓN (PARA DESARROLLO/TESTING)
        # ================================================================
        # ⚠️ SOLO PARA PRUEBAS - ELIMINAR EN PRODUCCIÓN
        
        # DNIs de prueba
        test_data = {
            "12345678": {
                "nombres": "JUAN CARLOS",
                "apellidoPaterno": "PEREZ",
                "apellidoMaterno": "GARCIA",
                "fechaNacimiento": "1995-05-15"
            },
            "87654321": {
                "nombres": "MARIA ELENA",
                "apellidoPaterno": "RODRIGUEZ",
                "apellidoMaterno": "LOPEZ",
                "fechaNacimiento": "1998-08-20"
            }
        }
        
        if dni in test_data:
            person_data = test_data[dni]
            return Response({
                "success": True,
                "nombres": person_data["nombres"],
                "apellidoPaterno": person_data["apellidoPaterno"],
                "apellidoMaterno": person_data["apellidoMaterno"],
                "fechaNacimiento": person_data.get("fechaNacimiento", ""),
                "dni": dni
            })
        else:
            # Simular persona con datos genéricos
            return Response({
                "success": True,
                "nombres": "NOMBRE SIMULADO",
                "apellidoPaterno": "APELLIDO",
                "apellidoMaterno": "PATERNO",
                "fechaNacimiento": "",
                "dni": dni
            })
    
    except requests.Timeout:
        return Response({
            "success": False,
            "message": "Tiempo de espera agotado al consultar RENIEC"
        }, status=status.HTTP_408_REQUEST_TIMEOUT)
    
    except requests.RequestException as e:
        print(f"[RENIEC] Error en la consulta: {str(e)}")
        return Response({
            "success": False,
            "message": "Error al consultar el servicio de RENIEC"
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    except Exception as e:
        print(f"[RENIEC] Error inesperado: {str(e)}")
        return Response({
            "success": False,
            "message": "Error interno del servidor"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)