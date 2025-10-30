# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models, connection
from .models import Estudiante, Orientador, DominioPermitido, Rol, InstitucionEducativa
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
    password_confirm = serializers.CharField(min_length=8, write_only=True)
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
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Las contraseñas no coinciden"})
        
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

# Importar Q para las consultas
from django.db import models