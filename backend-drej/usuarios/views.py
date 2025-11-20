import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, InstitucionSerializer
from .models import InstitucionEducativa

from .models import (
    Cuestionario, Pregunta, Opcion, Intento, Respuesta, 
    Recomendacion, Estudiante, EstadoIntento
)

from .serializers import (
    CuestionarioSerializer, CuestionarioDetalleSerializer,
    IntentoSerializer, CrearIntentoSerializer, GuardarRespuestasSerializer,
    RecomendacionSerializer
)

import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_instituciones(request):
    """Listar todas las instituciones educativas"""
    provincia = request.GET.get('provincia', None)
    
    if provincia:
        instituciones = InstitucionEducativa.objects.filter(InstiProvincia=provincia)
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
    
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_dashboard_estudiante(request):
    """
    Obtener datos del dashboard del estudiante
    
    GET /api/estudiante/dashboard/
    
    Returns:
        - cuestionarios_disponibles: int
        - cuestionarios_completados: int
        - ultima_evaluacion: str
        - fecha_ultima_evaluacion: str
        - recomendaciones_activas: int
        - progreso: int (porcentaje)
    """
    try:
        # Obtener estudiante
        estudiante = Estudiante.objects.get(User=request.user)
        
        # Cuestionarios disponibles (activos)
        cuestionarios_disponibles = Cuestionario.objects.filter(CuestActivo=True).count()
        
        # Cuestionarios completados por el estudiante
        intentos_completados = Intento.objects.filter(
            Estud=estudiante,
            Confirmado=True,
            Estado__EstadoID=2  # Asumiendo 2 = Completado
        ).values('Cuest').distinct().count()
        
        # Última evaluación
        ultimo_intento = Intento.objects.filter(
            Estud=estudiante,
            Confirmado=True
        ).select_related('Cuest').order_by('-Creado').first()
        
        ultima_evaluacion = None
        fecha_ultima_evaluacion = None
        if ultimo_intento:
            ultima_evaluacion = ultimo_intento.Cuest.CuestNombre
            fecha_ultima_evaluacion = ultimo_intento.Creado.strftime('%Y-%m-%d')
        
        # Recomendaciones activas
        recomendaciones_activas = Recomendacion.objects.filter(
            Intent__Estud=estudiante
        ).count()
        
        # Calcular progreso (porcentaje de cuestionarios completados)
        if cuestionarios_disponibles > 0:
            progreso = int((intentos_completados / cuestionarios_disponibles) * 100)
        else:
            progreso = 0
        
        return Response({
            'cuestionariosDisponibles': cuestionarios_disponibles,
            'cuestionariosCompletados': intentos_completados,
            'ultimaEvaluacion': ultima_evaluacion,
            'fechaUltimaEvaluacion': fecha_ultima_evaluacion,
            'recomendacionesActivas': recomendaciones_activas,
            'progreso': progreso
        }, status=status.HTTP_200_OK)
        
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error en dashboard: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al obtener datos del dashboard'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_cuestionarios(request):
    """
    Listar todos los cuestionarios activos con estado de completitud
    
    GET /api/estudiante/cuestionarios/
    
    Returns:
        Lista de cuestionarios con:
        - id
        - titulo
        - descripcion
        - duracion
        - preguntas
        - estado (completado/disponible)
        - intento_id (si existe)
    """
    try:
        estudiante = Estudiante.objects.get(User=request.user)
        
        # Obtener todos los cuestionarios activos
        cuestionarios = Cuestionario.objects.filter(CuestActivo=True)
        
        # Obtener intentos del estudiante
        intentos_estudiante = Intento.objects.filter(
            Estud=estudiante,
            Confirmado=True
        ).values_list('Cuest__CuestID', 'IntentID')
        
        intentos_dict = dict(intentos_estudiante)
        
        resultado = []
        for cuest in cuestionarios:
            # Contar preguntas
            total_preguntas = Pregunta.objects.filter(
                Cuest=cuest,
                PregActiva=True
            ).count()
            
            # Calcular duración estimada (30 segundos por pregunta)
            duracion_min = (total_preguntas * 30) // 60
            
            # Verificar si está completado
            intento_id = intentos_dict.get(cuest.CuestID)
            completado = intento_id is not None
            
            resultado.append({
                'id': cuest.CuestID,
                'titulo': cuest.CuestNombre,
                'descripcion': f'Evaluación de {cuest.CuestNombre.lower()}',
                'duracion': f'{duracion_min}-{duracion_min + 5} min',
                'preguntas': total_preguntas,
                'estado': 'completado' if completado else 'disponible',
                'completado': completado,
                'intento_id': intento_id
            })
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error al listar cuestionarios: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al obtener cuestionarios'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_cuestionario(request, cuestionario_id):
    """
    Obtener un cuestionario completo con sus preguntas y opciones
    
    GET /api/estudiante/cuestionarios/<id>/
    
    Returns:
        Cuestionario completo con preguntas y opciones
    """
    try:
        cuestionario = Cuestionario.objects.get(
            CuestID=cuestionario_id,
            CuestActivo=True
        )
        
        # Obtener preguntas con opciones
        preguntas = Pregunta.objects.filter(
            Cuest=cuestionario,
            PregActiva=True
        ).prefetch_related('opciones').order_by('PregOrden')
        
        resultado = {
            'id': cuestionario.CuestID,
            'nombre': cuestionario.CuestNombre,
            'version': cuestionario.CuestVersion,
            'preguntas': []
        }
        
        for pregunta in preguntas:
            opciones = Opcion.objects.filter(Preg=pregunta).order_by('OpcionOrden')
            
            resultado['preguntas'].append({
                'id': pregunta.PregID,
                'texto': pregunta.PregTexto,
                'orden': pregunta.PregOrden,
                'tipo': pregunta.PregTipo,
                'categoria': pregunta.PregCategoria,
                'opciones': [
                    {
                        'id': opcion.OpcionID,
                        'texto': opcion.OpcionTexto,
                        'valor': opcion.OpcionValor,
                        'orden': opcion.OpcionOrden
                    }
                    for opcion in opciones
                ]
            })
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Cuestionario.DoesNotExist:
        return Response({
            'error': 'Cuestionario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error al obtener cuestionario: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al obtener cuestionario'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def iniciar_cuestionario(request):
    """
    Iniciar un nuevo intento de cuestionario
    
    POST /api/estudiante/cuestionarios/iniciar/
    Body: { "cuestionario_id": 1 }
    
    Returns:
        { "intento_id": 123, "cuestionario": {...} }
    """
    try:
        estudiante = Estudiante.objects.get(User=request.user)
        cuestionario_id = request.data.get('cuestionario_id')
        
        if not cuestionario_id:
            return Response({
                'error': 'cuestionario_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el cuestionario existe y está activo
        cuestionario = Cuestionario.objects.get(
            CuestID=cuestionario_id,
            CuestActivo=True
        )
        
        # Verificar si ya existe un intento en progreso
        intento_existente = Intento.objects.filter(
            Estud=estudiante,
            Cuest=cuestionario,
            Confirmado=False
        ).first()
        
        if intento_existente:
            return Response({
                'intento_id': intento_existente.IntentID,
                'mensaje': 'Ya tienes un intento en progreso'
            }, status=status.HTTP_200_OK)
        
        # Crear nuevo intento
        estado_en_progreso = EstadoIntento.objects.get(EstadoID=1)  # 1 = En Progreso
        
        intento = Intento.objects.create(
            Estud=estudiante,
            Cuest=cuestionario,
            Estado=estado_en_progreso,
            Confirmado=False,
            Creado=datetime.now(),
            UltimoAutosave=None
        )
        
        return Response({
            'intento_id': intento.IntentID,
            'cuestionario_id': cuestionario.CuestID,
            'mensaje': 'Intento creado exitosamente'
        }, status=status.HTTP_201_CREATED)
        
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Cuestionario.DoesNotExist:
        return Response({
            'error': 'Cuestionario no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error al iniciar cuestionario: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al iniciar cuestionario'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def guardar_respuestas(request):
    """
    Guardar respuestas del cuestionario (autosave o confirmación final)
    
    POST /api/estudiante/cuestionarios/guardar/
    Body: {
        "intento_id": 123,
        "respuestas": [
            {"pregunta_id": 1, "opcion_id": 3},
            {"pregunta_id": 2, "opcion_id": 7},
            ...
        ],
        "confirmar": false  // true para finalizar
    }
    """
    try:
        from django.db import transaction
        
        estudiante = Estudiante.objects.get(User=request.user)
        intento_id = request.data.get('intento_id')
        respuestas_data = request.data.get('respuestas', [])
        confirmar = request.data.get('confirmar', False)
        
        if not intento_id:
            return Response({
                'error': 'intento_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar que el intento existe y pertenece al estudiante
        intento = Intento.objects.get(IntentID=intento_id, Estud=estudiante)
        
        with transaction.atomic():
            # Eliminar respuestas anteriores
            Respuesta.objects.filter(Intent=intento).delete()
            
            # Crear nuevas respuestas
            for resp_data in respuestas_data:
                pregunta_id = resp_data.get('pregunta_id')
                opcion_id = resp_data.get('opcion_id')
                
                if pregunta_id and opcion_id:
                    # Verificar que la opción pertenece a la pregunta
                    opcion = Opcion.objects.get(
                        OpcionID=opcion_id,
                        Preg__PregID=pregunta_id
                    )
                    
                    Respuesta.objects.create(
                        Intent=intento,
                        RespValor=str(opcion_id),
                        RespFechaHora=datetime.now()
                    )
            
            # Actualizar autosave
            intento.UltimoAutosave = datetime.now()
            
            # Si se confirma, cambiar estado y procesar resultados
            if confirmar:
                estado_completado = EstadoIntento.objects.get(EstadoID=2)  # 2 = Completado
                intento.Estado = estado_completado
                intento.Confirmado = True
                
                # TODO: Aquí se puede agregar lógica para calcular recomendaciones
                # procesar_recomendaciones(intento)
            
            intento.save()
        
        return Response({
            'mensaje': 'Respuestas guardadas exitosamente',
            'confirmado': confirmar
        }, status=status.HTTP_200_OK)
        
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Intento.DoesNotExist:
        return Response({
            'error': 'Intento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Opcion.DoesNotExist:
        return Response({
            'error': 'Opción inválida'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error al guardar respuestas: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al guardar respuestas'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_resultados(request):
    """
    Obtener todos los resultados de cuestionarios completados
    
    GET /api/estudiante/resultados/
    
    Returns:
        Lista de intentos completados con recomendaciones
    """
    try:
        estudiante = Estudiante.objects.get(User=request.user)
        
        # Obtener intentos completados
        intentos = Intento.objects.filter(
            Estud=estudiante,
            Confirmado=True,
            Estado__EstadoID=2
        ).select_related('Cuest').order_by('-Creado')
        
        resultados = []
        for intento in intentos:
            # Obtener recomendaciones del intento
            recomendaciones = Recomendacion.objects.filter(
                Intent=intento
            ).order_by('-Score')[:5]  # Top 5 recomendaciones
            
            # Calcular score promedio
            score_promedio = 0
            if recomendaciones:
                scores = [r.Score for r in recomendaciones if r.Score]
                if scores:
                    score_promedio = sum(scores) / len(scores)
            
            resultados.append({
                'id': intento.IntentID,
                'test': intento.Cuest.CuestNombre,
                'fecha': intento.Creado.strftime('%Y-%m-%d'),
                'score': int(score_promedio),
                'recomendaciones': [
                    {
                        'carrera': rec.Carrera,
                        'descripcion': rec.Descripcion,
                        'score': rec.Score,
                        'nivel': rec.Nivel
                    }
                    for rec in recomendaciones
                ]
            })
        
        return Response(resultados, status=status.HTTP_200_OK)
        
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error al obtener resultados: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al obtener resultados'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_resultado_detalle(request, intento_id):
    """
    Obtener detalle de un resultado específico
    
    GET /api/estudiante/resultados/<intento_id>/
    
    Returns:
        Detalle completo del intento con respuestas y recomendaciones
    """
    try:
        estudiante = Estudiante.objects.get(User=request.user)
        
        # Obtener el intento
        intento = Intento.objects.get(
            IntentID=intento_id,
            Estud=estudiante,
            Confirmado=True
        )
        
        # Obtener respuestas
        respuestas = Respuesta.objects.filter(Intent=intento)
        
        # Obtener recomendaciones
        recomendaciones = Recomendacion.objects.filter(
            Intent=intento
        ).order_by('-Score')
        
        resultado = {
            'intento_id': intento.IntentID,
            'cuestionario': intento.Cuest.CuestNombre,
            'fecha': intento.Creado.strftime('%Y-%m-%d %H:%M'),
            'total_respuestas': respuestas.count(),
            'recomendaciones': [
                {
                    'id': rec.RecomendacionID,
                    'carrera': rec.Carrera,
                    'descripcion': rec.Descripcion,
                    'score': rec.Score,
                    'nivel': rec.Nivel
                }
                for rec in recomendaciones
            ]
        }
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Estudiante.DoesNotExist:
        return Response({
            'error': 'Estudiante no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Intento.DoesNotExist:
        return Response({
            'error': 'Resultado no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error al obtener detalle: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al obtener detalle del resultado'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


