"""
🧪 TEST MOTOR DE IA - PARA DJANGO SHELL
Ejecutar desde Django shell

USO:
    python manage.py shell
    >>> exec(open('test_motor_simple.py').read())
"""

print("=" * 80)
print("🧪 PRUEBA DEL MOTOR DE IA")
print("=" * 80)
print()

# Importar módulos necesarios
try:
    from usuarios.motor_ia_groq import procesar_recomendaciones_groq
    from django.db import connection
    print("✅ Módulos importados correctamente")
except ImportError as e:
    print(f"❌ Error al importar: {e}")
    print("   Asegúrate de estar en Django shell:")
    print("   python manage.py shell")
    exit()

print()

# Verificar GROQ_API_KEY
import os
groq_key = os.environ.get("GROQ_API_KEY")
if groq_key:
    print(f"✅ GROQ_API_KEY: {groq_key[:10]}...{groq_key[-4:]}")
else:
    print("❌ GROQ_API_KEY no configurada")
    print()
    print("   Configúrala antes de continuar:")
    print("   Windows: set GROQ_API_KEY=tu_clave")
    print("   Linux/Mac: export GROQ_API_KEY='tu_clave'")
    exit()

print()

# Buscar intentos disponibles
print("📋 Buscando intentos disponibles...")
print("-" * 80)

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT TOP 5 
            i.IntentID,
            i.EstudID,
            (SELECT COUNT(*) FROM tblRespuesta WHERE IntentID = i.IntentID) as Respuestas,
            (SELECT COUNT(*) FROM tblRecomendacion WHERE IntentID = i.IntentID) as Recomendaciones,
            i.Creado
        FROM tblIntento i
        WHERE i.Confirmado = 1
        ORDER BY i.Creado DESC
    """)
    
    intentos = cursor.fetchall()

if not intentos:
    print("❌ No hay intentos confirmados")
    print("   Completa un cuestionario primero")
    exit()

print(f"✅ Encontrados {len(intentos)} intentos:")
print()

for idx, (intent_id, estud_id, resp, rec, fecha) in enumerate(intentos, 1):
    print(f"{idx}. IntentID: {intent_id}")
    print(f"   Respuestas: {resp}, Recomendaciones: {rec}")
    if rec == 0:
        print(f"   ⚠️  SIN RECOMENDACIONES")
    print()

# Seleccionar el primero sin recomendaciones
intento_id = None
for intent_id, estud_id, resp, rec, fecha in intentos:
    if rec == 0 and resp > 0:
        intento_id = intent_id
        break

if not intento_id:
    intento_id = intentos[0][0]

print("=" * 80)
print(f"🚀 PROBANDO CON INTENTO {intento_id}")
print("=" * 80)
print()

# Ejecutar motor de IA
try:
    print("⏳ Procesando...")
    resultado = procesar_recomendaciones_groq(intento_id, usar_ia=True)
    
    print()
    print("=" * 80)
    
    if resultado['success']:
        print("✅ ¡ÉXITO!")
        print("=" * 80)
        print()
        print(f"Total respuestas: {resultado['total_respuestas']}")
        print(f"Recomendaciones: {len(resultado['recomendaciones'])}")
        print(f"Generadas con IA: {resultado['generadas_con_ia']}")
        print()
        
        print("🎯 SCORES:")
        print("-" * 80)
        for cat, score in sorted(resultado['scores_por_categoria'].items(), 
                                key=lambda x: x[1], reverse=True):
            print(f"{cat:30} {score:6.1f}%")
        
        print()
        print("💼 RECOMENDACIONES:")
        print("-" * 80)
        for i, rec in enumerate(resultado['recomendaciones'], 1):
            print(f"\n{i}. {rec['carrera']} ({rec['score']:.1f}% - {rec['nivel']})")
            print(f"   {rec['descripcion'][:100]}...")
        
        print()
        print("=" * 80)
        print("✅ Las recomendaciones fueron guardadas en la BD")
        print()
        
    else:
        print("❌ ERROR")
        print("=" * 80)
        print(f"Error: {resultado.get('error')}")
        print()
        print("🔍 Verifica:")
        print("   1. GROQ_API_KEY correcta")
        print("   2. Modelo actualizado a llama-3.3-70b-versatile")
        print("   3. Conexión a internet")
        print()
        
except Exception as e:
    print("=" * 80)
    print("❌ ERROR INESPERADO")
    print("=" * 80)
    print(f"Tipo: {type(e).__name__}")
    print(f"Mensaje: {str(e)}")
    print()
    import traceback
    traceback.print_exc()

print("=" * 80)