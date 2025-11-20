from django.urls import path
from . import views

urlpatterns = [
    # Registro y validaciones
    path('check-dni/<str:dni>/', views.check_dni, name='check-dni'),
    path('check-email/<str:email>/', views.check_email, name='check-email'),
    path('validate-domain/', views.validate_domain, name='validate-domain'),
    path('instituciones/', views.listar_instituciones, name='listar_instituciones'),
    #path('reniec/consultar/<str:dni>/', views.consultar_reniec, name='consultar-reniec'),
    path('reniec/mock/<str:dni>/', views.consultar_reniec_mock, name='consultar-reniec-mock'),
    path('estudiante/dashboard/', views.obtener_dashboard_estudiante, name='dashboard-estudiante'),
    path('estudiante/cuestionarios/', views.listar_cuestionarios, name='listar-cuestionarios'),
    path('estudiante/cuestionarios/<int:cuestionario_id>/', views.obtener_cuestionario, name='obtener-cuestionario'),
    path('estudiante/cuestionarios/iniciar/', views.iniciar_cuestionario, name='iniciar-cuestionario'),
    path('estudiante/cuestionarios/guardar/', views.guardar_respuestas, name='guardar-respuestas'),
    path('estudiante/resultados/', views.obtener_resultados, name='obtener-resultados'),
    path('estudiante/resultados/<int:intento_id>/', views.obtener_resultado_detalle, name='obtener-resultado-detalle'),
]