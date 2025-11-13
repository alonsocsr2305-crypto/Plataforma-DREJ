from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, IntegrityError
from django.utils import timezone
from .models import Estudiante, Orientador, EstadoVerificacion, Rol, InstitucionEducativa
import re
import logging
logger = logging.getLogger(__name__)


def to_title_case(text):
    """Convertir texto a Title Case (Primera letra mayúscula)"""
    if not text:
        return ""
    return text.strip().title()

class RegisterView(APIView):
    def post(self, request):
        data = request.data
        logger.debug("Datos recibidos del frontend: %s", data)

        required_common = ["email", "password", "passwordConfirm", "nombres", "apellidoPaterno", "apellidoMaterno", "dni", "telefono", "fechaNacimiento", "insti_id"]
        missing = [k for k in required_common if not data.get(k) or not str(data.get(k)).strip()]
        rol = data.get("rol", "").strip()   
        
        if rol == "Orientador":
            if not data.get("cargo") or not str(data.get("cargo")).strip():
                missing.append("cargo")
            if not data.get("areaEspecializacion") or not str(data.get("areaEspecializacion")).strip():
                missing.append("areaEspecializacion")

        if missing:
            return Response(
                {"detail": f"Faltan campos obligatorios: {', '.join(missing)}"}, 
                status=400
            )
        
        # Validación de contraseñas
        if data["password"] != data["passwordConfirm"]:
            return Response(
                {"passwordConfirm": ["Las contraseñas no coinciden"]}, 
                status=400
            )
        
        # Validación de longitud de contraseña
        if len(data["password"]) < 8:
            return Response(
                {"password": ["La contraseña debe tener al menos 8 caracteres"]},
                status=400
            )
        
        # Validación de email duplicado
        if User.objects.filter(email__iexact=data["email"]).exists():
            return Response(
                {"email": ["Este correo ya está registrado"]}, 
                status=400
            )
        
        # ✅ Validación de DNI
        dni = data.get("dni", "").strip()
        if not re.match(r'^\d{8}$', dni):
            return Response(
                {"dni": ["El DNI debe tener exactamente 8 dígitos"]},
                status=400
            )
        
        # Validación de DNI duplicado
        if Estudiante.objects.filter(EstudDNI=dni).exists() or Orientador.objects.filter(OrienDNI=dni).exists():
            return Response(
                {"dni": ["Este DNI ya está registrado"]},
                status=400
            )
        
        # ✅ Validación de teléfono
        telefono = data.get("telefono", "").strip()
        if not re.match(r'^9\d{8}$', telefono):
            return Response(
                {"telefono": ["El teléfono debe tener 9 dígitos y comenzar con 9"]},
                status=400
            )
        
        insti_id = data.get("insti_id")
        try:
            institucion = InstitucionEducativa.objects.get(InstiID=insti_id)
        except InstitucionEducativa.DoesNotExist:
            return Response(
                {"institucion": ["La institución seleccionada no existe"]},
                status=400
            )
        
        rol_name = data.get("rol", "Estudiante")
        
        try:
            with transaction.atomic():
                
                # 1) Crea usuario
                username = data["dni"]  # SimpleJWT usa 'username' por defecto
                user = User.objects.create_user(
                    username=username,
                    email=data["email"],
                    password=data["password"],
                    first_name=to_title_case(data.get("nombres", "")),
                    last_name=f"{to_title_case(data.get('apellidoPaterno', ''))} {to_title_case(data.get('apellidoMaterno', ''))}".strip(),
                )

                # 3) Si es Estudiante, crea fila en tblEstudiante
                if rol_name == "Estudiante":

                    rol_estudiante = Rol.objects.get(RolID=2)

                    Estudiante.objects.create(
                        EstudDNI= dni,
                        EstudNombres=to_title_case(data.get("nombres", "")),
                        EstudApellidoPaterno=to_title_case(data.get("apellidoPaterno")),
                        EstudApellidoMaterno=to_title_case(data.get("apellidoMaterno")),
                        EstudFechaNac=data.get("fechaNacimiento"),  # DRF lo pasa como string compatible; tu campo es DATE
                        EstudTelefono=telefono,   # opcional si lo envías
                        User_id=user.id,       # usa columna UserID -> auth_user.id
                        Insti_id=insti_id,
                        Rol_id=rol_estudiante.RolID
                    )
                    logger.info("Estudiante creado exitosamente: %s", dni)

                elif rol_name == "Orientador":
                    
                    rol_orientador = Rol.objects.get(RolID=3)

                    try:
                        estado_pendiente = EstadoVerificacion.objects.get(EstadoVerifID=1)
                    except EstadoVerificacion.DoesNotExist:
                        raise ValueError("Estado de verificación no encontrado")
                    
                    institucion_nombre = data.get("institucion", institucion.InstiNombre)
                    cargo = data.get("cargo", "").strip()
                    area_esp = data.get("areaEspecializacion", "").strip()
                    perfil = (data.get("perfilProfesional") or "").strip()
                    
                    logger.debug("Institución: %s", institucion)
                    logger.debug("InstiID: %s", insti_id)
                    logger.debug("Cargo: %s", cargo)
                    logger.debug("ÁreaDeEspecialización: %s", area_esp)
                    logger.debug("Teléfono: %s", telefono)
                  
                    orientador = Orientador.objects.create(
                        OrienDNI=dni,
                        OrienNombres=to_title_case(data.get("nombres")),
                        OrienApellidoPaterno=to_title_case(data.get("apellidoPaterno")),
                        OrienApellidoMaterno=to_title_case(data.get("apellidoMaterno")),
                        OrienFechaNacimiento=data.get("fechaNacimiento"),
                        OrienInstitucion=to_title_case(institucion_nombre),
                        OrienCargo=to_title_case(cargo),
                        OrienAreaEspecializacion=to_title_case(area_esp),
                        OrienEmailInstitucional=data["email"],
                        OrienTelefono=telefono,
                        OrienPerfilProfesional=perfil if perfil else None,
                        FechaRegistro=timezone.now(),
                        EstadoVerif_id=estado_pendiente.EstadoVerifID,
                        User_id=user.id,
                        Insti_id=insti_id,
                        Rol_id=rol_orientador.RolID
                    )
                    logger.info("Orientador creado exitosamente con ID: %s", orientador.OrienID)
                    logger.debug("FechaRegistro: %s", orientador.FechaRegistro)

        except Rol.DoesNotExist:
            return Response(
                {"detail": f"Rol '{rol_name}' no encontrado en el sistema"},
                status=500
            )
        
        except ValueError as e:  # ✅ AGREGAR ESTO
            return Response(
                {"detail": str(e)},
                status=400
            )

        except IntegrityError as e:
            error_msg = str(e)
            logger.error("IntegrityError: %s", error_msg)
            
            if "EstudDNI" in error_msg or "OrienDNI" in error_msg:
                return Response(
                    {"dni": ["Este DNI ya está registrado"]},
                    status=409
                )
            elif "email" in error_msg.lower():
                return Response(
                    {"correo": ["Este correo ya está registrado"]},
                    status=409
                )
            else:
                return Response(
                    {"detail": f"Error de integridad en la base de datos: {error_msg}"},
                    status=409
                )

        except Exception as e:
            logger.error("Excepción general: %s", str(e), exc_info=True)
            
            return Response(
                {"detail": f"Error al registrar: {str(e)}"},
                status=500
            )

        return Response(
            {
                "ok": True, 
                "message": "Registro exitoso",
                "rol": rol_name
            }, 
            status=201
        )

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user     
        rol_info = None
        
        try:
            # Buscar en Estudiante
            estudiante = Estudiante.objects.select_related('Rol').get(User_id=user.id)
            rol_info = {
                "rol_id": estudiante.Rol.RolID,
                "rol_nombre": estudiante.Rol.RolNombre,
                "tipo_usuario": "Estudiante"
            }
        except Estudiante.DoesNotExist:
            try:
                # Buscar en Orientador
                orientador = Orientador.objects.select_related('Rol', 'EstadoVerif').get(User_id=user.id)
                rol_info = {
                    "rol_id": orientador.Rol.RolID,
                    "rol_nombre": orientador.Rol.RolNombre,
                    "tipo_usuario": "Orientador",
                    "estado_verificacion": orientador.EstadoVerif.EstadoDescripcion
                }
            except Orientador.DoesNotExist:
                # Si no es estudiante ni orientador, puede ser admin
                rol_info = {
                    "rol_id": 1,
                    "rol_nombre": "Admin",
                    "tipo_usuario": "Admin"
                }
        
        return Response({
            "user": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "rol": rol_info
        })
