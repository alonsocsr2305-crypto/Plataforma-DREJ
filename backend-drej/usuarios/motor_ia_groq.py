import logging
import os
import json
from collections import defaultdict
from typing import List, Dict
from django.db import connection
from datetime import datetime

from groq import Groq
GROQ_AVAILABLE = True

logger = logging.getLogger(__name__)

def limpiar_texto_unicode(texto: str) -> str:
    """Limpia caracteres Unicode problemáticos"""
    if not texto:
        return texto
    import re
    texto = texto.replace('\xa0', ' ').replace('\u00a0', ' ')
    reemplazos = {'\u2013': '-', '\u2014': '--', '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"', '\u2026': '...'}
    for u, r in reemplazos.items():
        texto = texto.replace(u, r)
    return re.sub(r'\s+', ' ', texto).strip()

# ====================================================
# CATÁLOGO DE CARRERAS
# ====================================================

CARRERAS_POR_CATEGORIA = {
    'Ciencias y Tecnología': [
        {
            'nombre': 'Ingeniería de Software',
            'descripcion_base': 'Diseño, desarrollo y mantenimiento de sistemas de software',
            'keywords': ['programación', 'algoritmos', 'desarrollo web', 'apps'],
        },
        {
            'nombre': 'Ingeniería de Sistemas',
            'descripcion_base': 'Integración de componentes tecnológicos para soluciones empresariales',
            'keywords': ['sistemas', 'redes', 'infraestructura'],
        },
        {
            'nombre': 'Ciencias de la Computación',
            'descripcion_base': 'Investigación y desarrollo de nuevas tecnologías',
            'keywords': ['IA', 'machine learning', 'algoritmos'],
        },
    ],
    'Ciencias Sociales': [
        {
            'nombre': 'Psicología',
            'descripcion_base': 'Estudio del comportamiento humano y procesos mentales',
            'keywords': ['comportamiento', 'mente', 'terapia'],
        },
        {
            'nombre': 'Trabajo Social',
            'descripcion_base': 'Intervención social para mejorar el bienestar comunitario',
            'keywords': ['comunidad', 'ayuda', 'sociedad'],
        },
    ],
    'Artes': [
        {
            'nombre': 'Diseño Gráfico',
            'descripcion_base': 'Comunicación visual mediante imágenes y tipografía',
            'keywords': ['diseño', 'visual', 'creatividad'],
        },
        {
            'nombre': 'Arquitectura',
            'descripcion_base': 'Diseño de espacios habitables y construcciones',
            'keywords': ['edificios', 'espacios', 'diseño'],
        },
    ],
    'Negocios': [
        {
            'nombre': 'Administración de Empresas',
            'descripcion_base': 'Gestión y dirección de organizaciones',
            'keywords': ['gestión', 'empresas', 'liderazgo'],
        },
        {
            'nombre': 'Marketing',
            'descripcion_base': 'Estrategias de mercado y comunicación comercial',
            'keywords': ['ventas', 'publicidad', 'marca'],
        },
    ],
    'Salud': [
        {
            'nombre': 'Medicina',
            'descripcion_base': 'Diagnóstico, tratamiento y prevención de enfermedades',
            'keywords': ['salud', 'pacientes', 'diagnóstico'],
        },
        {
            'nombre': 'Enfermería',
            'descripcion_base': 'Cuidado integral de pacientes',
            'keywords': ['cuidado', 'pacientes', 'hospital'],
        },
    ]
}

MAPEO_PREGUNTAS_CATEGORIAS = {
    1: 'Ciencias y Tecnología', 2: 'Ciencias y Tecnología', 
    3: 'Ciencias y Tecnología', 4: 'Ciencias y Tecnología',
    5: 'Ciencias Sociales', 6: 'Ciencias Sociales', 
    7: 'Ciencias Sociales', 8: 'Ciencias Sociales',
    9: 'Artes', 10: 'Artes', 11: 'Artes', 12: 'Artes',
    13: 'Negocios', 14: 'Negocios', 15: 'Negocios', 16: 'Negocios',
    17: 'Salud', 18: 'Salud', 19: 'Salud', 20: 'Salud',
}

# ====================================================
# MOTOR DE IA CON GROQ
# ====================================================

class MotorRecomendacionesGroq:
    """
    Motor de IA mejorado que usa Groq para generar descripciones personalizadas
    """
    
    def __init__(self, intento_id: int):
        self.intento_id = intento_id
        self.respuestas = []
        self.scores_por_categoria = defaultdict(float)
        self.total_respuestas = 0
        self.groq_client = None
        
        # Inicializar cliente Groq
        if GROQ_AVAILABLE:
            api_key = os.environ.get("GROQ_API_KEY")
            if api_key:
                self.groq_client = Groq(api_key=api_key)
                logger.info("[MOTOR_IA_GROQ] Cliente Groq inicializado")
            else:
                logger.warning("[MOTOR_IA_GROQ] GROQ_API_KEY no encontrada en variables de entorno")
    
    def cargar_respuestas(self):
        """Cargar respuestas del intento"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT r.RespID, r.RespValor, r.RespFechaHora
                    FROM tblRespuesta r
                    WHERE r.IntentID = %s
                """, [self.intento_id])
                
                rows = cursor.fetchall()
                self.respuestas = [
                    {'resp_id': row[0], 'valor': int(row[1]), 'fecha': row[2]}
                    for row in rows
                ]
                
                self.total_respuestas = len(self.respuestas)
                logger.info(f"[MOTOR_IA_GROQ] Cargadas {self.total_respuestas} respuestas")
                return True
                
        except Exception as e:
            logger.error(f"[MOTOR_IA_GROQ] Error al cargar respuestas: {str(e)}")
            return False
    
    def calcular_scores(self):
        """Calcular scores por categoría"""
        try:
            with connection.cursor() as cursor:
                for i, resp in enumerate(self.respuestas, 1):
                    cursor.execute("""
                        SELECT o.OpcionValor, o.PregID
                        FROM tblOpcion o
                        WHERE o.OpcionID = %s
                    """, [resp['valor']])
                    
                    row = cursor.fetchone()
                    if row:
                        valor_opcion = row[0]
                        categoria = MAPEO_PREGUNTAS_CATEGORIAS.get(i)
                        
                        if categoria:
                            self.scores_por_categoria[categoria] += valor_opcion
            
            # Normalizar a porcentaje
            preguntas_por_categoria = 4
            max_score = preguntas_por_categoria * 5
            
            for categoria in self.scores_por_categoria:
                score_raw = self.scores_por_categoria[categoria]
                score_porcentaje = (score_raw / max_score) * 100
                self.scores_por_categoria[categoria] = round(score_porcentaje, 2)
            
            logger.info(f"[MOTOR_IA_GROQ] Scores: {dict(self.scores_por_categoria)}")
            return True
            
        except Exception as e:
            logger.error(f"[MOTOR_IA_GROQ] Error al calcular scores: {str(e)}")
            return False
    
    def generar_descripcion_con_groq(self, carrera: str, categoria: str, score: float) -> str:
        """
        Genera una descripción personalizada usando Groq
        """
        if not self.groq_client:
            logger.warning("[MOTOR_IA_GROQ] Cliente Groq no disponible")
            return None
        
        try:
            # Determinar nivel de afinidad
            if score >= 80:
                nivel = 'muy alto'
            elif score >= 65:
                nivel = 'alto'
            elif score >= 50:
                nivel = 'medio-alto'
            else:
                nivel = 'medio'
            
            # Crear prompt personalizado
            prompt = f"""Eres un orientador vocacional experto. Un estudiante completó un test vocacional y obtuvo un {score:.1f}% de afinidad con {carrera}.

Su perfil muestra un nivel de interés {nivel} en {categoria}.

Genera una descripción motivadora y personalizada de 2-3 oraciones que:
1. Explique por qué esta carrera encaja con su perfil
2. Destaque oportunidades específicas
3. Sea inspiradora pero realista

Responde SOLO con la descripción, sin introducción."""

            # Llamar a Groq
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Modelo rápido y bueno
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un orientador vocacional experto que escribe descripciones personalizadas, motivadoras y concisas."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.9,
                max_tokens=150,
                top_p=1.0
            )
            
            descripcion = response.choices[0].message.content.strip()
            descripcion = limpiar_texto_unicode(descripcion)
            logger.info(f"[MOTOR_IA_GROQ] ✨ Descripción generada para {carrera}")
            return descripcion
            
        except Exception as e:
            logger.error(f"[MOTOR_IA_GROQ] Error con Groq: {str(e)}")
            return None
    
    def generar_recomendaciones(self, top_n: int = 5, usar_ia: bool = True) -> List[Dict]:
        """
        Generar recomendaciones con descripciones mejoradas por IA
        """
        try:
            recomendaciones = []
            
            # Ordenar categorías por score
            categorias_ordenadas = sorted(
                self.scores_por_categoria.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            logger.info(f"[MOTOR_IA_GROQ] Top categorías: {categorias_ordenadas[:3]}")
            
            # Generar recomendaciones
            for categoria, score in categorias_ordenadas[:3]:
                if categoria in CARRERAS_POR_CATEGORIA:
                    carreras = CARRERAS_POR_CATEGORIA[categoria]
                    
                    for carrera in carreras[:2]:
                        score_final = score
                        
                        # Determinar nivel
                        if score_final >= 80:
                            nivel = 'Muy Alto'
                        elif score_final >= 65:
                            nivel = 'Alto'
                        elif score_final >= 50:
                            nivel = 'Medio-Alto'
                        elif score_final >= 35:
                            nivel = 'Medio'
                        else:
                            nivel = 'Medio-Bajo'
                        
                        # Intentar generar descripción con IA
                        descripcion = carrera['descripcion_base']
                        
                        if usar_ia and self.groq_client:
                            descripcion_ia = self.generar_descripcion_con_groq(
                                carrera['nombre'],
                                categoria,
                                score_final
                            )
                            if descripcion_ia:
                                descripcion = descripcion_ia
                        
                        recomendaciones.append({
                            'carrera': carrera['nombre'],
                            'descripcion': descripcion,
                            'score': score_final,
                            'nivel': nivel,
                            'categoria': categoria,
                            'generada_con_ia': descripcion != carrera['descripcion_base']
                        })
            
            # Ordenar y tomar top_n
            recomendaciones.sort(key=lambda x: x['score'], reverse=True)
            return recomendaciones[:top_n]
            
        except Exception as e:
            logger.error(f"[MOTOR_IA_GROQ] Error al generar recomendaciones: {str(e)}")
            return []
    
    def guardar_recomendaciones(self, recomendaciones: List[Dict]) -> bool:
        """Guardar recomendaciones en la BD"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM tblRecomendacion WHERE IntentID = %s
                """, [self.intento_id])
                
                for rec in recomendaciones:
                    cursor.execute("""
                        INSERT INTO tblRecomendacion 
                        (IntentID, Carrera, Descripcion, Score, Nivel, FechaHora)
                        VALUES (%s, %s, %s, %s, %s, GETDATE())
                    """, [
                        self.intento_id,
                        rec['carrera'],
                        rec['descripcion'],
                        rec['score'],
                        rec['nivel']
                    ])
                
                ia_count = sum(1 for r in recomendaciones if r.get('generada_con_ia'))
                logger.info(f"[MOTOR_IA_GROQ] ✅ {len(recomendaciones)} recomendaciones guardadas ({ia_count} con IA)")
                return True
                
        except Exception as e:
            logger.error(f"[MOTOR_IA_GROQ] Error al guardar: {str(e)}")
            return False
    
    def procesar(self, usar_ia: bool = True) -> Dict:
        """
        Proceso completo con IA de Groq
        """
        logger.info(f"[MOTOR_IA_GROQ] 🚀 Iniciando procesamiento (IA: {usar_ia})")
        
        if not self.cargar_respuestas():
            return {'success': False, 'error': 'Error al cargar respuestas'}
        
        if not self.calcular_scores():
            return {'success': False, 'error': 'Error al calcular scores'}
        
        recomendaciones = self.generar_recomendaciones(top_n=5, usar_ia=usar_ia)
        
        if not recomendaciones:
            return {'success': False, 'error': 'No se generaron recomendaciones'}
        
        if not self.guardar_recomendaciones(recomendaciones):
            return {'success': False, 'error': 'Error al guardar recomendaciones'}
        
        ia_count = sum(1 for r in recomendaciones if r.get('generada_con_ia'))
        
        return {
            'success': True,
            'recomendaciones': recomendaciones,
            'scores_por_categoria': dict(self.scores_por_categoria),
            'total_respuestas': self.total_respuestas,
            'generadas_con_ia': ia_count
        }


# ====================================================
# FUNCIÓN PRINCIPAL
# ====================================================

def procesar_recomendaciones_groq(intento_id: int, usar_ia: bool = True) -> Dict:
    """
    Función principal para procesar con Groq
    
    Args:
        intento_id: ID del intento
        usar_ia: Si True, usa Groq para descripciones. Si False, usa descripciones básicas
    
    Returns:
        Diccionario con resultado
    """
    motor = MotorRecomendacionesGroq(intento_id)
    return motor.procesar(usar_ia=usar_ia)
