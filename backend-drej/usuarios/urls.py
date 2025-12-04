from django.urls import path
from . import views
from . import views_orientador

urlpatterns = [
    path('check-dni/<str:dni>/', views.check_dni, name='check-dni'),
    path('check-email/<str:email>/', views.check_email, name='check-email'),
    path('validate-domain/', views.validate_domain, name='validate-domain'),
    path('instituciones/', views.listar_instituciones, name='listar_instituciones'),
    path('reniec/consultar/<str:dni>/', views.consultar_reniec, name='consultar-reniec'),
    path('estudiante/dashboard/', views.obtener_dashboard_estudiante, name='dashboard-estudiante'),
    path('estudiante/cuestionarios/', views.listar_cuestionarios, name='listar-cuestionarios'),
    path('estudiante/cuestionarios/<int:cuestionario_id>/', views.obtener_cuestionario, name='obtener-cuestionario'),
    path('estudiante/cuestionarios/iniciar/', views.iniciar_cuestionario, name='iniciar-cuestionario'),
    path('estudiante/cuestionarios/guardar/', views.guardar_respuestas, name='guardar-respuestas'),
    path('estudiante/resultados/', views.obtener_resultados, name='obtener-resultados'),
    path('estudiante/resultados/<int:intento_id>/', views.obtener_resultado_detalle, name='obtener-resultado-detalle'),
    path('api/orientador/dashboard/', views_orientador.obtener_dashboard_orientador, name='dashboard-orientador'),
    path('api/orientador/cuestionarios/', views_orientador.listar_cuestionarios_orientador, name='listar-cuestionarios-orientador'),
    path('api/orientador/cuestionarios/crear/', views_orientador.crear_cuestionario, name='crear-cuestionario'),
    path('api/orientador/cuestionarios/<uuid:cuestionario_id>/actualizar/', views_orientador.actualizar_cuestionario, name='actualizar-cuestionario'),
    path('api/orientador/cuestionarios/<uuid:cuestionario_id>/eliminar/', views_orientador.eliminar_cuestionario, name='eliminar-cuestionario'),
    path('estudiante/cuestionarios/<int:cuestionario_id>/verificar-retomar/', views_orientador.verificar_puede_retomar, name='verificar-puede-retomar'),
    path('estudiante/cuestionarios/<int:cuestionario_id>/reiniciar/', views_orientador.reiniciar_cuestionario, name='reiniciar-cuestionario'),
]