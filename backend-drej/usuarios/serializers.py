# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models, connection
from .models import Estudiante, Orientador, DominioPermitido, Rol, InstitucionEducativa
from .models import Cuestionario, Pregunta, Opcion, Intento, Respuesta, Recomendacion, EstadoIntento
from datetime import datetime


class RegisterSerializer(serializers.Serializer):
    # Campos comunes
    dni = serializers.CharField(max_length=8, min_length=8)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=100)
    apellido_paterno = serializers.CharField(max_length=50)
    apellido_materno = serializers.CharField(max_length=50)
    telefono = serializers.CharField(max_length=15)
    fecha_nacimiento = serializers.DateField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    passwordConfirm = serializers.CharField(min_length=8, write_only=True)
    rol = serializers.ChoiceField(choices=['Estudiante', 'Orientador'])
    insti_id = serializers.IntegerField(required=True)
    
    # Campos específicos para Orientador (opcionales por defecto)
    institucion = serializers.CharField(max_length=150, required=False, allow_blank=True)
    cargo = serializers.CharField(max_length=100, required=False, allow_blank=True)
    area_especializacion = serializers.CharField(max_length=150, required=False, allow_blank=True)
    perfil_profesional = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)

    def validate_dni(self, value):
        """Validar que el DNI sea numérico y único"""
        if not value.isdigit():
            raise serializers.ValidationError("El DNI debe contener solo números")
        
        # Verificar si ya existe en auth_user
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este DNI ya está registrado")
        
        # Verificar si ya existe en tblEstudiante o tblOrientador
        if Estudiante.objects.filter(EstudDNI=value).exists():
            raise serializers.ValidationError("Este DNI ya está registrado")
        
        if Orientador.objects.filter(OrienDNI=value).exists():
            raise serializers.ValidationError("Este DNI ya está registrado")
            
        return value

    def validate_email(self, value):
        """Validar que el email sea único"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value

    def validate_telefono(self, value):
        """Validar formato de teléfono peruano (opcional)"""
        if value and value.strip():
            if not value.isdigit():
                raise serializers.ValidationError("El teléfono debe contener solo números")
            if not value.startswith('9') or len(value) != 9:
                raise serializers.ValidationError("El teléfono debe empezar con 9 y tener 9 dígitos")
        return value

    def validate_fecha_nacimiento(self, value):
        """Validar que el usuario tenga al menos 13 años"""
        today = datetime.now().date()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        
        if age < 13:
            raise serializers.ValidationError("Debes tener al menos 13 años para registrarte")
        
        return value
    
    def validate_insti_id(self, value):
        """Validar que la institución exista"""
        if not InstitucionEducativa.objects.filter(InstiID=value).exists():
            raise serializers.ValidationError("La institución seleccionada no existe")
        return value

    def validate(self, data):
        """Validaciones generales"""
        # Verificar que las contraseñas coincidan
        if data['password'] != data['passwordConfirm']:
            raise serializers.ValidationError({"passwordConfirm": "Las contraseñas no coinciden"})
        
        # Validaciones específicas para Orientador
        if data['rol'] == 'Orientador':
            # Validar email institucional
            email = data['email']
            dominio = email.split('@')[1].lower() if '@' in email else ''
            
            # Verificar en la base de datos de dominios permitidos
            dominio_valido = DominioPermitido.objects.filter(
                Activo=True
            ).filter(
                models.Q(DominioEmail=dominio) |
                models.Q(DominioEmail__endswith=dominio)
            ).exists()
            
            if not dominio_valido:
                # Validación alternativa con los dominios comunes
                dominios_permitidos = ['.edu', '.edu.pe', '.ac.pe']
                if not any(dominio.endswith(d) for d in dominios_permitidos):
                    raise serializers.ValidationError({
                        "email": "Debe usar un email institucional (.edu, .edu.pe, .ac.pe, etc.)"
                    })
            
            # Campos obligatorios para orientadores
            if not data.get('institucion'):
                raise serializers.ValidationError({"institucion": "La institución es obligatoria para orientadores"})
            if not data.get('cargo'):
                raise serializers.ValidationError({"cargo": "El cargo es obligatorio para orientadores"})
            if not data.get('area_especializacion'):
                raise serializers.ValidationError({"area_especializacion": "El área de especialización es obligatoria"})
        
        return data

    def create(self, validated_data):
        """Crear usuario y registro correspondiente (Estudiante u Orientador)"""
        # Extraer datos
        rol = validated_data['rol']
        telefono = validated_data.get('telefono')
        insti_id = validated_data['insti_id']
        
        # Crear usuario en auth_user
        user = User.objects.create_user(
            username=validated_data['dni'],
            email=validated_data['correo'],
            password=validated_data['password'],
            first_name=validated_data['nombres'],
            last_name=validated_data['apellidoP']
        )
        
        try:
            if rol == 'Estudiante':
                # Crear registro en tblEstudiante usando SQL directo
                rol_estudiante = Rol.objects.get(RolID=2)

                with connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO tblEstudiante 
                        (EstudDNI, EstudNombres, EstudApellidoPaterno, EstudApellidoMaterno, 
                         EstudFechaNac, EstudTelefono, UserID, InstiID, RolID)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, [
                        validated_data['dni'],
                        validated_data['first_name'],
                        validated_data['apellido_paterno'],
                        validated_data['apellido_materno'],
                        validated_data['fecha_nacimiento'],
                        telefono,
                        user.id,
                        insti_id,
                        rol_estudiante.RolID
                    ])
                
                return {
                    'user': user,
                    'rol': 'Estudiante',
                    'message': 'Estudiante registrado exitosamente'
                }
            
            else:  # Orientador

                rol_orientador = Rol.objects.get(RolID=3)
                
                perfil = validated_data.get('perfil_profesional', None)
                if perfil == '':
                    perfil = None
                
                # Crear registro en tblOrientador usando SQL directo
                with connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO tblOrientador 
                        (OrienDNI, OrienNombres, OrienApellidoPaterno, OrienApellidoMaterno, 
                         OrienFechaNacimiento, OrienInstitucion, OrienCargo, OrienAreaEspecializacion,
                         OrienEmailInstitucional, OrienTelefono, OrienPerfilProfesional, 
                         FechaRegistro, EstadoVerifID, UserID, InstiID, RolID)
                        VALUES (%s, %s, %s, %s, 
                                %s, %s, %s, %s,
                                %s, %s, %s, GETDATE(), 
                                %s, %s, %s, %s)
                    """, [
                        validated_data['dni'],
                        validated_data['first_name'],
                        validated_data['apellido_paterno'],
                        validated_data['apellido_materno'],
                        validated_data['fecha_nacimiento'],
                        validated_data['institucion'],
                        validated_data['cargo'],
                        validated_data['area_especializacion'],
                        validated_data['email'],
                        perfil,
                        1,  # EstadoVerifID = 1 (PENDIENTE)
                        user.id,
                        insti_id,
                        rol_orientador.RolID
                    ])
                
                # TODO: Enviar email al administrador para aprobar
                # send_mail_to_admin(user, validated_data)
                
                return {
                    'user': user,
                    'rol': 'Orientador',
                    'message': 'Solicitud de orientador enviada. Será revisada por un administrador.'
                }
        
        except Rol.DoesNotExist:
            # Si algo falla, eliminar el usuario creado
            user.delete()
            raise serializers.ValidationError(f"Error: Rol no encontrado en el sistema")
        except Exception as e:
            # Si algo falla, eliminar el usuario creado
            user.delete()
            raise serializers.ValidationError(f"Error al crear el registro: {str(e)}")

class InstitucionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitucionEducativa
        fields = ['InstiID', 'InstiNombre', 'InstiDireccion', 'InstiDistrito',
                  'InstiProvincia', 'InstiRegion']
        
class OpcionSerializer(serializers.ModelSerializer):
    """Serializer para las opciones de respuesta"""
    class Meta:
        model = Opcion
        fields = ['OpcionID', 'OpcionTexto', 'OpcionValor', 'OpcionOrden']


class PreguntaSerializer(serializers.ModelSerializer):
    """Serializer para preguntas con sus opciones"""
    opciones = OpcionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pregunta
        fields = [
            'PregID', 
            'PregTexto', 
            'PregOrden', 
            'PregTipo', 
            'PregCategoria',
            'opciones'
        ]


class CuestionarioSerializer(serializers.ModelSerializer):
    """Serializer básico para cuestionarios"""
    total_preguntas = serializers.SerializerMethodField()
    duracion_estimada = serializers.SerializerMethodField()
    
    class Meta:
        model = Cuestionario
        fields = [
            'CuestID', 
            'CuestNombre', 
            'CuestVersion', 
            'CuestActivo',
            'total_preguntas',
            'duracion_estimada'
        ]
    
    def get_total_preguntas(self, obj):
        """Contar preguntas activas del cuestionario"""
        return Pregunta.objects.filter(Cuest=obj, PregActiva=True).count()
    
    def get_duracion_estimada(self, obj):
        """Estimar duración basado en número de preguntas (30 seg por pregunta)"""
        total = self.get_total_preguntas(obj)
        minutos = (total * 30) // 60  # 30 segundos por pregunta
        return f"{minutos}-{minutos + 5} min"


class CuestionarioDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo con preguntas y opciones"""
    preguntas = PreguntaSerializer(many=True, read_only=True, source='pregunta_set')
    
    class Meta:
        model = Cuestionario
        fields = [
            'CuestID', 
            'CuestNombre', 
            'CuestVersion', 
            'preguntas'
        ]


class IntentoSerializer(serializers.ModelSerializer):
    """Serializer para intentos de cuestionarios"""
    cuestionario_nombre = serializers.CharField(source='Cuest.CuestNombre', read_only=True)
    estado_descripcion = serializers.CharField(source='Estado.EstadoDescripcion', read_only=True)
    
    class Meta:
        model = Intento
        fields = [
            'IntentID',
            'cuestionario_nombre',
            'estado_descripcion',
            'Confirmado',
            'Creado',
            'UltimoAutosave'
        ]


class RespuestaSerializer(serializers.ModelSerializer):
    """Serializer para respuestas individuales"""
    class Meta:
        model = Respuesta
        fields = ['RespID', 'Intent', 'RespValor', 'RespFechaHora']


class RecomendacionSerializer(serializers.ModelSerializer):
    """Serializer para recomendaciones de carreras"""
    class Meta:
        model = Recomendacion
        fields = [
            'RecomendacionID',
            'Carrera',
            'Descripcion',
            'Score',
            'Nivel',
            'FechaHora'
        ]


class CrearIntentoSerializer(serializers.Serializer):
    """Serializer para crear un nuevo intento"""
    cuestionario_id = serializers.IntegerField()
    
    def validate_cuestionario_id(self, value):
        """Validar que el cuestionario exista y esté activo"""
        try:
            cuestionario = Cuestionario.objects.get(CuestID=value, CuestActivo=True)
        except Cuestionario.DoesNotExist:
            raise serializers.ValidationError("Cuestionario no encontrado o inactivo")
        return value
    
    def create(self, validated_data):
        """Crear un nuevo intento para el estudiante"""
        user = self.context['request'].user
        
        # Obtener el estudiante
        try:
            estudiante = Estudiante.objects.get(User=user)
        except Estudiante.DoesNotExist:
            raise serializers.ValidationError("Usuario no es un estudiante")
        
        # Obtener el cuestionario y estado
        cuestionario = Cuestionario.objects.get(CuestID=validated_data['cuestionario_id'])
        estado_en_progreso = EstadoIntento.objects.get(EstadoID=1)  # Asumiendo 1 = "En Progreso"
        
        # Crear el intento
        intento = Intento.objects.create(
            Estud=estudiante,
            Cuest=cuestionario,
            Estado=estado_en_progreso,
            Confirmado=False,
            Creado=datetime.now(),
            UltimoAutosave=None
        )
        
        return intento


class GuardarRespuestasSerializer(serializers.Serializer):
    """Serializer para guardar respuestas del cuestionario"""
    intento_id = serializers.IntegerField()
    respuestas = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    confirmar = serializers.BooleanField(default=False)
    
    def validate_intento_id(self, value):
        """Validar que el intento exista"""
        try:
            intento = Intento.objects.get(IntentID=value)
            # Verificar que el intento pertenezca al usuario actual
            user = self.context['request'].user
            estudiante = Estudiante.objects.get(User=user)
            if intento.Estud.EstudID != estudiante.EstudID:
                raise serializers.ValidationError("No tienes permiso para este intento")
        except Intento.DoesNotExist:
            raise serializers.ValidationError("Intento no encontrado")
        return value
    
    def save(self):
        """Guardar las respuestas"""
        from django.db import transaction
        
        intento = Intento.objects.get(IntentID=self.validated_data['intento_id'])
        respuestas_data = self.validated_data['respuestas']
        confirmar = self.validated_data['confirmar']
        
        with transaction.atomic():
            # Eliminar respuestas anteriores si existen
            Respuesta.objects.filter(Intent=intento).delete()
            
            # Crear nuevas respuestas
            for resp_data in respuestas_data:
                Respuesta.objects.create(
                    Intent=intento,
                    RespValor=resp_data.get('valor'),
                    RespFechaHora=datetime.now()
                )
            
            # Actualizar autosave
            intento.UltimoAutosave = datetime.now()
            
            # Si se confirma, cambiar estado
            if confirmar:
                estado_completado = EstadoIntento.objects.get(EstadoID=2)  # Asumiendo 2 = "Completado"
                intento.Estado = estado_completado
                intento.Confirmado = True
            
            intento.save()
        
        return intento

# Importar Q para las consultas
from django.db import models