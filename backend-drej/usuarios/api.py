from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, IntegrityError
from django.utils import timezone
from .models import Estudiante, Orientador, EstadoVerificacion, Rol, InstitucionEducativa
import re


class RegisterView(APIView):
    def post(self, request):
        data = request.data
        print("[DEBUG] Datos recibidos del frontend:", data)

        required_common = ["correo", "password", "passwordConfirm", "nombres", "ApellidoP", "dni", "telefono", "institucion"]
        missing = [k for k in required_common if not data.get(k) or not str(data.get(k)).strip()]
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
        if User.objects.filter(email__iexact=data["correo"]).exists():
            return Response(
                {"correo": ["Este correo ya está registrado"]}, 
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
        
        # ✅ Validación de institución
        institucion = data.get("institucion", "").strip()
        if not institucion:
            return Response(
                {"institucion": ["La institución es obligatoria"]},
                status=400
            )
        
        rol_name = data.get("rol", "Estudiante")
        
        # ✅ Validaciones específicas para ORIENTADOR
        if rol_name == "Orientador":
            required_orientador = ["cargo", "areaEspecializacion"]
            missing_orientador = [k for k in required_orientador if not data.get(k) or not str(data.get(k)).strip()]
            
            if missing_orientador:
                errors = {}
                if "cargo" in missing_orientador:
                    errors["cargo"] = ["El cargo es obligatorio"]
                if "areaEspecializacion" in missing_orientador:
                    errors["areaEspecializacion"] = ["El área de especialización es obligatoria"]
                return Response(errors, status=400)
        
        try:
            with transaction.atomic():
                # 1) Crea usuario
                username = data["email"]  # SimpleJWT usa 'username' por defecto
                user = User.objects.create_user(
                    username=username,
                    email=data["correo"],
                    password=data["password"],
                    first_name=data.get("nombres", ""),
                    last_name=f"{data.get('apellidoPaterno', '')} {data.get('apellidoMaterno', '')}".strip(),
                )

                # 3) Si es Estudiante, crea fila en tblEstudiante
                if rol_name == "Estudiante":

                    rol_estudiante = Rol.objects.get(RolID=2)

                    Estudiante.objects.create(
                        EstudDNI= data.get("dni"),
                        EstudNombres=data.get("first_name", ""),
                        EstudApellidoPaterno=data.get("apellido_paterno", ""),
                        EstudApellidoMaterno=data.get("apellido_materno", ""),
                        EstudFechaNac=data.get("fecha_nacimiento"),  # DRF lo pasa como string compatible; tu campo es DATE
                        EstudTelefono=telefono,   # opcional si lo envías
                        User_id=user.id,       # usa columna UserID -> auth_user.id
                        Insti_id=data.get("insti_id"),
                        Rol_id=rol_estudiante.RolID
                    )
                    print(f"[DEBUG] Estudiante creado exitosamente: {dni}")

                elif rol_name == "Orientador":
                    
                    rol_orientador = Rol.objects.get(RolID=3)

                    try:
                        estado_pendiente = EstadoVerificacion.objects.get(EstadoVerifID=1)
                    except EstadoVerificacion.DoesNotExist:
                        return Response(
                            {"detail": "Estado de verificación no encontrado. Contacte al administrador."},
                            status=500
                        )
                    cargo = data.get("cargo", "").strip()
                    area_esp = data.get("areaEspecializacion", "").strip()
                    perfil = data.get("perfilProfesional", "").strip()
                    insti_id = data.get("insti_id"),
                    #fch_veri = data.get("fecha_verificacion")
                    
                    print(f"[DEBUG] Institución: '{institucion}'")
                    print(f"[DEBUG] InstiID: {insti_id}")
                    print(f"[DEBUG] Cargo: '{cargo}'")
                    print(f"[DEBUG] Área Especialización: '{area_esp}'")
                    print(f"[DEBUG] Teléfono: '{telefono}'")

                    if insti_id:
                        try:
                            InstitucionEducativa.objects.get(InstiID=insti_id)
                        except InstitucionEducativa.DoesNotExist:
                            return Response(
                                {"institucion": ["La institución seleccionada no existe"]},
                                status=400
                            )
                    
                    orientador = Orientador.objects.create(
                        OrienDNI=dni,
                        OrienNombres=data.get("nombres", ""),
                        OrienApellidoPaterno=data.get("apellidoPaterno", ""),
                        OrienApellidoMaterno=data.get("apellidoMaterno", ""),
                        OrienFechaNacimiento=data.get("fechaNacimiento"),
                        OrienInstitucion=institucion,
                        OrienCargo=cargo,
                        OrienAreaEspecializacion=area_esp,
                        OrienEmailInstitucional=data["correo"],
                        OrienTelefono=telefono,
                        OrienPerfilProfesional=perfil if perfil else None,
                        FechaRegistro=timezone.now(),
                        EstadoVerif_id=estado_pendiente.EstadoVerifID,
                        User_id=user.id,
                        Insti_id=insti_id,
                        Rol_id=rol_orientador.RolID  # ✅ Asignar rol
                    )
                    print(f"[DEBUG] Orientador creado exitosamente con ID: {orientador.OrienID}")
                    print(f"[DEBUG] FechaRegistro: {orientador.FechaRegistro}")

        except Rol.DoesNotExist:
            return Response(
                {"detail": f"Rol '{rol_name}' no encontrado en el sistema"},
                status=500
            )
        except IntegrityError as e:
            error_msg = str(e)
            print(f"[ERROR] IntegrityError: {error_msg}")
            
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
            print(f"[ERROR] Excepción general: {str(e)}")
            import traceback
            traceback.print_exc()
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
