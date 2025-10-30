# models.py
from django.conf import settings
from django.db import models

# ====================================================
# NUEVAS TABLAS - Estado de Verificación y Dominios
# ====================================================

class EstadoVerificacion(models.Model):
    EstadoVerifID = models.AutoField(primary_key=True)
    EstadoDescripcion = models.CharField(max_length=20)

    class Meta:
        db_table = 'tblEstadoVerificacion'
        managed = False

    def __str__(self):
        return self.EstadoDescripcion


class DominioPermitido(models.Model):
    DominioID = models.AutoField(primary_key=True)
    DominioEmail = models.CharField(max_length=100, unique=True)
    TipoInstitucion = models.CharField(max_length=50, null=True, blank=True)
    NombreInstitucion = models.CharField(max_length=150, null=True, blank=True)
    Activo = models.BooleanField(default=True)
    FechaCreacion = models.DateTimeField(auto_now_add=False)

    class Meta:
        db_table = 'tblDominioPermitido'
        managed = False

    def __str__(self):
        return self.DominioEmail


# ====================================================
# Tablas base (creadas en SQL; Django NO las gestiona)
# ====================================================

class NivelRiesgo(models.Model):
    NivelRiesgoID = models.AutoField(primary_key=True)
    NivelRiesgoDescripcion = models.CharField(max_length=20)

    class Meta:
        db_table = 'tblNivelRiesgo'
        managed = False


class EstadoIntento(models.Model):
    EstadoID = models.AutoField(primary_key=True)
    EstadoDescripcion = models.CharField(max_length=20)

    class Meta:
        db_table = 'tblEstadoIntento'
        managed = False

class Rol(models.Model):
    """
    Tabla de catálogo fijo para roles del sistema.
    IMPORTANTE: managed=False porque la tabla se crea manualmente en SQL Server.
    Django NO intentará crear/modificar esta tabla durante migrate.
    """
    RolID = models.IntegerField(primary_key=True)  # Sin AutoField - IDs fijos
    RolNombre = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'tblRol'
        managed = False  # ✅ CRÍTICO: Django no gestiona esta tabla

    def __str__(self):
        return self.RolNombre


# ====================================================
# Tablas principales
# ====================================================

class InstitucionEducativa(models.Model):
    InstiID = models.AutoField(primary_key=True)
    InstiNombre = models.CharField(max_length=150)
    InstiDireccion = models.CharField(max_length=150)
    InstiDistrito = models.CharField(max_length=100)
    InstiProvincia = models.CharField(max_length=100)
    InstiRegion = models.CharField(max_length=100)

    class Meta:
        db_table = 'tblInstitucionEducativa'
        managed = False
   
    def __str__(self):
        return self.InstitucionNombre


class Estudiante(models.Model):
    EstudID = models.AutoField(primary_key=True)
    EstudDNI = models.CharField(max_length=8, unique=True)
    EstudNombres = models.CharField(max_length=50)
    EstudApellidoPaterno = models.CharField(max_length=50)
    EstudApellidoMaterno = models.CharField(max_length=50)
    EstudFechaNac = models.DateField()
    EstudTelefono = models.CharField(max_length=15, null=True, blank=True)  # NUEVO

    # FK a usuario Django (auth_user.id) almacenada en columna UserID
    User = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='UserID'
    )

    Insti = models.ForeignKey(
        InstitucionEducativa,
        on_delete=models.PROTECT,
        db_column='InstiID',
        null=True,
        blank=True
    )

    Rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column='RolID',
        default=2  # Default: Estudiante
    )

    class Meta:
        db_table = 'tblEstudiante'
        managed = False

    def __str__(self):
        return f"{self.EstudNombres} {self.EstudApellidoPaterno}"


class Orientador(models.Model):
    OrienID = models.AutoField(primary_key=True)
    OrienDNI = models.CharField(max_length=8, unique=True)
    OrienNombres = models.CharField(max_length=50)
    OrienApellidoPaterno = models.CharField(max_length=50)
    OrienApellidoMaterno = models.CharField(max_length=50)
    OrienFechaNacimiento = models.DateField(db_column='OrienFechaNacimiento')
    OrienInstitucion = models.CharField(max_length=100)
    OrienCargo = models.CharField(max_length=100)
    OrienAreaEspecializacion = models.CharField(max_length=150)
    OrienEmailInstitucional = models.CharField(max_length=100)
    OrienTelefono = models.CharField(max_length=15)
    OrienPerfilProfesional = models.CharField(max_length=255, null=True, blank=True)
    FechaRegistro = models.DateTimeField()
    FechaVerificacion = models.DateTimeField(null=True, blank=True)
    VerificadoPor = models.IntegerField(null=True, blank=True)
    MotivoRechazo = models.CharField(max_length=500, null=True, blank=True)

    # FK a Estado de Verificación
    EstadoVerif = models.ForeignKey(
        EstadoVerificacion,
        on_delete=models.PROTECT,
        db_column='EstadoVerifID',
        default=1  # PENDIENTE por defecto
    )
    
    # FK a usuario Django (auth_user.id) almacenada en columna UserID
    User = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        db_column='UserID'
    )

    Insti = models.ForeignKey(
        InstitucionEducativa,
        on_delete=models.PROTECT,
        db_column='InstiID'
    )

    Rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column='RolID',
        default=3  # Default: Orientador
    )

    class Meta:
        db_table = 'tblOrientador'
        managed = False

    def __str__(self):
        return f"{self.OrienNombres} {self.OrienApellidoPaterno} - {self.EstadoVerif.EstadoDescripcion}"


class DocumentoRespaldo(models.Model):
    DocumentoID = models.AutoField(primary_key=True)
    TipoDocumento = models.CharField(max_length=50)
    NombreArchivo = models.CharField(max_length=255)
    RutaArchivo = models.CharField(max_length=500)
    FechaSubida = models.DateTimeField(auto_now_add=False)

    Orien = models.ForeignKey(
        Orientador,
        on_delete=models.PROTECT,
        db_column='OrienID'
    )

    class Meta:
        db_table = 'tblDocumentoRespaldo'
        managed = False


class LogVerificacion(models.Model):
    LogID = models.AutoField(primary_key=True)
    AccionRealizada = models.CharField(max_length=50)
    AdminUserID = models.IntegerField(null=True, blank=True)
    Comentarios = models.CharField(max_length=500, null=True, blank=True)
    FechaAccion = models.DateTimeField(auto_now_add=False)

    Orien = models.ForeignKey(
        Orientador,
        on_delete=models.PROTECT,
        db_column='OrienID'
    )

    class Meta:
        db_table = 'tblLogVerificacion'
        managed = False


# ====================================================
# Resto de modelos (sin cambios)
# ====================================================

class Cuestionario(models.Model):
    CuestID = models.AutoField(primary_key=True)
    CuestNombre = models.CharField(max_length=100)
    CuestVersion = models.CharField(max_length=20, null=True, blank=True)
    CuestActivo = models.BooleanField(default=True)

    class Meta:
        db_table = 'tblCuestionario'
        managed = False


class Intento(models.Model):
    IntentID = models.AutoField(primary_key=True)

    Estud = models.ForeignKey(
        Estudiante,
        on_delete=models.PROTECT,
        db_column='EstudID'
    )
    Cuest = models.ForeignKey(
        Cuestionario,
        on_delete=models.PROTECT,
        db_column='CuestID'
    )
    Estado = models.ForeignKey(
        EstadoIntento,
        on_delete=models.PROTECT,
        db_column='EstadoID'
    )

    Confirmado = models.BooleanField(default=False)
    Creado = models.DateTimeField(auto_now_add=False)
    UltimoAutosave = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tblIntento'
        managed = False


class Respuesta(models.Model):
    RespID = models.AutoField(primary_key=True)
    Intent = models.ForeignKey(
        Intento,
        on_delete=models.PROTECT,
        db_column='IntentID'
    )
    RespValor = models.CharField(max_length=255, null=True, blank=True)
    RespFechaHora = models.DateTimeField(auto_now_add=False)

    class Meta:
        db_table = 'tblRespuesta'
        managed = False


class Recomendacion(models.Model):
    RecomendacionID = models.AutoField(primary_key=True)
    Intent = models.ForeignKey(
        Intento,
        on_delete=models.PROTECT,
        db_column='IntentID'
    )
    Carrera = models.CharField(max_length=100)
    Descripcion = models.CharField(max_length=200, null=True, blank=True)
    Score = models.FloatField(null=True, blank=True)
    Nivel = models.CharField(max_length=50, null=True, blank=True)
    FechaHora = models.DateTimeField(auto_now_add=False)

    class Meta:
        db_table = 'tblRecomendacion'
        managed = False


class Filtro(models.Model):
    FiltroID = models.AutoField(primary_key=True)
    Orien = models.ForeignKey(
        Orientador,
        on_delete=models.PROTECT,
        db_column='OrienID'
    )
    Edad = models.CharField(max_length=10, null=True, blank=True)
    Genero = models.CharField(max_length=10, null=True, blank=True)
    Institucion = models.CharField(max_length=100, null=True, blank=True)
    Ubicacion = models.CharField(max_length=100, null=True, blank=True)
    NivelRiesgo = models.ForeignKey(
        NivelRiesgo,
        on_delete=models.PROTECT,
        db_column='NivelRiesgoID',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'tblFiltro'
        managed = False


class Dashboard(models.Model):
    DashboardID = models.AutoField(primary_key=True)
    Orien = models.ForeignKey(
        Orientador,
        on_delete=models.PROTECT,
        db_column='OrienID'
    )
    DashboardNombre = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'tblDashboard'
        managed = False


class HistorialIntentos(models.Model):
    HistorialID = models.AutoField(primary_key=True)
    Estud = models.ForeignKey(
        Estudiante,
        on_delete=models.PROTECT,
        db_column='EstudID'
    )
    Dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.PROTECT,
        db_column='DashboardID'
    )
    FechaConsulta = models.DateTimeField(auto_now_add=False)

    class Meta:
        db_table = 'tblHistorialIntentos'
        managed = False


class FiltroRecomendacion(models.Model):
    Filtro = models.ForeignKey(
        Filtro,
        on_delete=models.PROTECT,
        db_column='FiltroID'
    )
    Recomendacion = models.ForeignKey(
        Recomendacion,
        on_delete=models.PROTECT,
        db_column='RecomendacionID'
    )

    class Meta:
        db_table = 'tblFiltroRecomendacion'
        managed = False
        unique_together = (('Filtro', 'Recomendacion'),)