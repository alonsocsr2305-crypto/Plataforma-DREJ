"""
Backend Django - Views para Dashboard de Orientadores
Archivo: backend-drej/usuarios/views_orientador.py
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    Estudiante, 
    Orientador,
    Cuestionario, 
    Pregunta, 
    Opcion,
    Intento,
    Respuesta, 
    Recomendacion,
    EstadoIntento
)


# ========================================
# DASHBOARD ORIENTADOR
# ========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_dashboard_orientador(request):
    """
    Obtiene estadísticas generales para el dashboard del orientador
    """
    try:
        user = request.user
        
        # Verificar que sea orientador (según tu lógica de roles)
        # Asumiendo que guardas 'Orientador' en algún campo del User
        # Ajusta según cómo guardes el rol
        
        # Obtener el registro de Orientador
        try:
            orientador = Orientador.objects.get(User=user)
        except Orientador.DoesNotExist:
            return Response(
                {'error': 'Solo los orientadores pueden acceder a este dashboard'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener institución del orientador
        institucion = orientador.Insti
        
        # Contar estudiantes de la misma institución
        total_estudiantes = Estudiante.objects.filter(
            Insti=institucion
        ).count()
        
        # Contar cuestionarios activos
        cuestionarios_activos = Cuestionario.objects.filter(
            CuestActivo=True
        ).count()
        
        # Respuestas de hoy
        hoy = timezone.now().date()
        respuestas_hoy = Respuesta.objects.filter(
            RespFechaHora__date=hoy
        ).count()
        
        # Promedio de completitud (intentos completados vs total estudiantes)
        # Estado 2 = Completado (ajusta según tu tabla EstadoIntento)
        try:
            estado_completado = EstadoIntento.objects.get(EstadoID=2)
            intentos_completados = Intento.objects.filter(
                Estud__Insti=institucion,
                Estado=estado_completado,
                Confirmado=True
            ).values('Estud').distinct().count()
        except:
            intentos_completados = 0
        
        promedio_completitud = 0
        if total_estudiantes > 0:
            promedio_completitud = round(
                (intentos_completados / total_estudiantes) * 100, 
                2
            )
        
        # Cuestionarios recientes con estadísticas
        cuestionarios = Cuestionario.objects.all().order_by('-CuestID')[:5]
        cuestionarios_data = []
        
        for cuest in cuestionarios:
            # Contar intentos únicos por estudiante
            total_intentos = Intento.objects.filter(
                Cuest=cuest,
                Estud__Insti=institucion
            ).values('Estud').distinct().count()
            
            cuestionarios_data.append({
                'id': cuest.CuestID,
                'titulo': cuest.CuestNombre,
                'version': cuest.CuestVersion,
                'activo': cuest.CuestActivo,
                'respuestas_totales': total_intentos
            })
        
        # Actividad reciente (últimos 7 días)
        hace_7_dias = timezone.now() - timedelta(days=7)
        
        # Obtener intentos completados recientes
        try:
            estado_completado = EstadoIntento.objects.get(EstadoID=2)
            actividad_reciente = Intento.objects.filter(
                Estud__Insti=institucion,
                Estado=estado_completado,
                Confirmado=True,
                Creado__gte=hace_7_dias
            ).select_related('Estud', 'Cuest').order_by('-Creado')[:10]
        except:
            actividad_reciente = []
        
        actividad_data = []
        for intento in actividad_reciente:
            # Contar recomendaciones para este intento
            num_recomendaciones = Recomendacion.objects.filter(
                Intent=intento
            ).count()
            
            actividad_data.append({
                'estudiante': f"{intento.Estud.EstudNombres} {intento.Estud.EstudApellidoPaterno}",
                'cuestionario': intento.Cuest.CuestNombre,
                'fecha': intento.Creado,
                'recomendaciones': num_recomendaciones
            })
        
        data = {
            'estadisticas': {
                'total_estudiantes': total_estudiantes,
                'cuestionarios_activos': cuestionarios_activos,
                'respuestas_hoy': respuestas_hoy,
                'promedio_completitud': promedio_completitud
            },
            'cuestionarios_recientes': cuestionarios_data,
            'actividad_reciente': actividad_data,
            'nombre': f"{orientador.OrienNombres} {orientador.OrienApellidoPaterno}",
            'institucion': institucion.InstiNombre if institucion else 'N/A'
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error en obtener_dashboard_orientador: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': 'Error al cargar el dashboard'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========================================
# GESTIÓN DE CUESTIONARIOS
# ========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_cuestionarios_orientador(request):
    """
    Lista todos los cuestionarios con estadísticas detalladas
    """
    try:
        user = request.user
        
        # Verificar que sea orientador
        try:
            orientador = Orientador.objects.get(User=user)
        except Orientador.DoesNotExist:
            return Response(
                {'error': 'Acceso denegado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cuestionarios = Cuestionario.objects.all().order_by('-CuestID')
        
        data = []
        for cuest in cuestionarios:
            # Contar intentos únicos
            total_intentos = Intento.objects.filter(
                Cuest=cuest
            ).values('Estud').distinct().count()
            
            # Contar intentos completados
            try:
                estado_completado = EstadoIntento.objects.get(EstadoID=2)
                intentos_completados = Intento.objects.filter(
                    Cuest=cuest,
                    Estado=estado_completado,
                    Confirmado=True
                ).count()
            except:
                intentos_completados = 0
            
            # Contar número de preguntas
            num_preguntas = Pregunta.objects.filter(
                Cuest=cuest,
                PregActiva=True
            ).count()
            
            data.append({
                'id': cuest.CuestID,
                'titulo': cuest.CuestNombre,
                'version': cuest.CuestVersion,
                'num_preguntas': num_preguntas,
                'activo': cuest.CuestActivo,
                'respuestas_totales': total_intentos,
                'resultados_completados': intentos_completados
            })
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error en listar_cuestionarios_orientador: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': 'Error al cargar cuestionarios'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_cuestionario(request):
    """
    Crea un nuevo cuestionario con sus preguntas y opciones de escala Likert fijas
    """
    try:
        user = request.user
        
        # Verificar que sea orientador
        try:
            orientador = Orientador.objects.get(User=user)
        except Orientador.DoesNotExist:
            return Response(
                {'error': 'Solo los orientadores pueden crear cuestionarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        
        # Validaciones
        if not data.get('titulo'):
            return Response(
                {'error': 'El título es obligatorio'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not data.get('preguntas') or len(data['preguntas']) == 0:
            return Response(
                {'error': 'Debe incluir al menos una pregunta'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ OPCIONES FIJAS DE ESCALA LIKERT (5 puntos)
        OPCIONES_LIKERT = [
            {'texto': 'Totalmente en desacuerdo', 'valor': 1, 'orden': 1},
            {'texto': 'En desacuerdo', 'valor': 2, 'orden': 2},
            {'texto': 'Neutral', 'valor': 3, 'orden': 3},
            {'texto': 'De acuerdo', 'valor': 4, 'orden': 4},
            {'texto': 'Totalmente de acuerdo', 'valor': 5, 'orden': 5}
        ]
        
        # Crear el cuestionario
        cuestionario = Cuestionario.objects.create(
            CuestNombre=data['titulo'],
            CuestVersion=data.get('version', '1.0'),
            CuestActivo=data.get('activo', True)
        )
        
        print(f"✅ Cuestionario creado: {cuestionario.CuestID}")
        
        preguntas_creadas = []
        opciones_creadas_total = 0
        
        for pregunta_data in data['preguntas']:
            # Crear la pregunta
            pregunta = Pregunta.objects.create(
                Cuest=cuestionario,
                PregTexto=pregunta_data['texto'],
                PregOrden=pregunta_data.get('orden', 1),
                PregTipo='multiple_choice',
                PregCategoria=pregunta_data.get('categoria', 'General'),
                PregActiva=True
            )
            
            print(f"✅ Pregunta creada: {pregunta.PregID} - {pregunta.PregTexto[:50]}")
            
            # ✅ CREAR LAS 5 OPCIONES FIJAS PARA CADA PREGUNTA
            opciones_creadas = []
            for opcion_likert in OPCIONES_LIKERT:
                opcion = Opcion.objects.create(
                    Preg=pregunta,
                    OpcionTexto=opcion_likert['texto'],
                    OpcionValor=opcion_likert['valor'],
                    OpcionOrden=opcion_likert['orden']
                )
                opciones_creadas.append({
                    'id': opcion.OpcionID,
                    'texto': opcion.OpcionTexto,
                    'valor': opcion.OpcionValor
                })
                opciones_creadas_total += 1
            
            print(f"   ✅ {len(opciones_creadas)} opciones creadas para pregunta {pregunta.PregID}")
            
            preguntas_creadas.append({
                'id': pregunta.PregID,
                'orden': pregunta.PregOrden,
                'texto': pregunta.PregTexto,
                'categoria': pregunta.PregCategoria,
                'opciones': opciones_creadas
            })
        
        print(f"✅ Total opciones creadas: {opciones_creadas_total}")
        
        return Response({
            'mensaje': 'Cuestionario creado exitosamente',
            'cuestionario': {
                'id': cuestionario.CuestID,
                'titulo': cuestionario.CuestNombre,
                'version': cuestionario.CuestVersion,
                'num_preguntas': len(preguntas_creadas),
                'num_opciones_total': opciones_creadas_total,
                'activo': cuestionario.CuestActivo
            },
            'preguntas': preguntas_creadas
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error en crear_cuestionario: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Error al crear el cuestionario: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_cuestionario(request, cuestionario_id):
    """
    Actualiza un cuestionario existente
    """
    try:
        user = request.user
        
        # Verificar que sea orientador
        try:
            orientador = Orientador.objects.get(User=user)
        except Orientador.DoesNotExist:
            return Response(
                {'error': 'Acceso denegado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cuestionario = Cuestionario.objects.get(CuestID=cuestionario_id)
        data = request.data
        
        # Actualizar campos
        if 'titulo' in data:
            cuestionario.CuestNombre = data['titulo']
        if 'version' in data:
            cuestionario.CuestVersion = data['version']
        if 'activo' in data:
            cuestionario.CuestActivo = data['activo']
        
        cuestionario.save()
        
        return Response({
            'mensaje': 'Cuestionario actualizado exitosamente',
            'cuestionario': {
                'id': cuestionario.CuestID,
                'titulo': cuestionario.CuestNombre,
                'version': cuestionario.CuestVersion,
                'activo': cuestionario.CuestActivo
            }
        }, status=status.HTTP_200_OK)
        
    except Cuestionario.DoesNotExist:
        return Response(
            {'error': 'Cuestionario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error en actualizar_cuestionario: {str(e)}")
        return Response(
            {'error': 'Error al actualizar el cuestionario'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_cuestionario(request, cuestionario_id):
    """
    Elimina un cuestionario (solo si no tiene intentos)
    """
    try:
        user = request.user
        
        # Verificar que sea orientador
        try:
            orientador = Orientador.objects.get(User=user)
        except Orientador.DoesNotExist:
            return Response(
                {'error': 'Acceso denegado'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cuestionario = Cuestionario.objects.get(CuestID=cuestionario_id)
        
        # Verificar si tiene intentos
        tiene_intentos = Intento.objects.filter(Cuest=cuestionario).exists()
        
        if tiene_intentos:
            return Response(
                {'error': 'No se puede eliminar un cuestionario con intentos registrados. Considere desactivarlo en su lugar.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cuestionario.delete()
        
        return Response(
            {'mensaje': 'Cuestionario eliminado exitosamente'},
            status=status.HTTP_200_OK
        )
        
    except Cuestionario.DoesNotExist:
        return Response(
            {'error': 'Cuestionario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error en eliminar_cuestionario: {str(e)}")
        return Response(
            {'error': 'Error al eliminar el cuestionario'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ========================================
# VOLVER A DAR CUESTIONARIO (ESTUDIANTES)
# ========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reiniciar_cuestionario(request, cuestionario_id):
    """
    Permite al estudiante volver a dar un cuestionario
    Marca el intento anterior como no confirmado
    """
    try:
        user = request.user
        
        # Verificar que sea estudiante
        try:
            estudiante = Estudiante.objects.get(User=user)
        except Estudiante.DoesNotExist:
            return Response(
                {'error': 'Solo los estudiantes pueden reiniciar cuestionarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cuestionario = Cuestionario.objects.get(CuestID=cuestionario_id)
        
        # Verificar que el estudiante haya completado este cuestionario antes
        try:
            estado_completado = EstadoIntento.objects.get(EstadoID=2)
            intento_anterior = Intento.objects.filter(
                Estud=estudiante,
                Cuest=cuestionario,
                Estado=estado_completado,
                Confirmado=True
            ).first()
        except:
            intento_anterior = None
        
        if not intento_anterior:
            return Response(
                {'error': 'No has completado este cuestionario anteriormente'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Guardar razón si se proporciona
        razon = request.data.get('razon', '')
        
        # Marcar intento anterior como no confirmado (mantener historial)
        intento_anterior.Confirmado = False
        intento_anterior.save()
        
        # Nota: Las respuestas y recomendaciones se mantienen por el historial
        # Solo permitimos que vuelva a responder
        
        return Response({
            'mensaje': 'Cuestionario reiniciado exitosamente',
            'cuestionario_id': cuestionario_id,
            'puede_responder': True
        }, status=status.HTTP_200_OK)
        
    except Cuestionario.DoesNotExist:
        return Response(
            {'error': 'Cuestionario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error en reiniciar_cuestionario: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': 'Error al reiniciar el cuestionario'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verificar_puede_retomar(request, cuestionario_id):
    """
    Verifica si el estudiante puede volver a dar un cuestionario
    y devuelve información del intento anterior
    """
    try:
        user = request.user
        
        # Verificar que sea estudiante
        try:
            estudiante = Estudiante.objects.get(User=user)
        except Estudiante.DoesNotExist:
            return Response(
                {'error': 'Solo los estudiantes pueden verificar'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        cuestionario = Cuestionario.objects.get(CuestID=cuestionario_id)
        
        # Buscar intento anterior completado
        try:
            estado_completado = EstadoIntento.objects.get(EstadoID=2)
            intento_anterior = Intento.objects.filter(
                Estud=estudiante,
                Cuest=cuestionario,
                Estado=estado_completado,
                Confirmado=True
            ).first()
        except:
            intento_anterior = None
        
        if not intento_anterior:
            return Response({
                'puede_retomar': False,
                'mensaje': 'No has completado este cuestionario anteriormente'
            }, status=status.HTTP_200_OK)
        
        # Contar recomendaciones
        recomendaciones_count = Recomendacion.objects.filter(
            Intent=intento_anterior
        ).count()
        
        return Response({
            'puede_retomar': True,
            'resultado_anterior': {
                'id': intento_anterior.IntentID,
                'fecha_completado': intento_anterior.Creado,
                'recomendaciones_count': recomendaciones_count
            }
        }, status=status.HTTP_200_OK)
        
    except Cuestionario.DoesNotExist:
        return Response(
            {'error': 'Cuestionario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error en verificar_puede_retomar: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'error': 'Error al verificar el estado del cuestionario'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )