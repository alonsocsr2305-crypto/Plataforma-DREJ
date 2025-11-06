# usuarios/backends.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailOrDNIBackend(ModelBackend):
    """
    Backend de autenticación personalizado que permite login con:
    - DNI (username)
    - Email
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Autenticar usuario por DNI o email
        Args:
            username: Puede ser el DNI o el email del usuario
            password: Contraseña del usuario
        Returns:
            User object si la autenticación es exitosa, None en caso contrario
        """
        if username is None or password is None:
            return None
        
        try:
            # Buscar usuario por username (DNI) o email
            user = User.objects.get(
                Q(username__iexact=username) | Q(email__iexact=username)
            )
            
            # Verificar la contraseña
            if user.check_password(password):
                return user
                
        except User.DoesNotExist:
            # Si no encuentra el usuario, retornar None
            return None
        except User.MultipleObjectsReturned:
            # Si hay múltiples usuarios (no debería pasar), retornar None
            return None
            
        return None
    
    def get_user(self, user_id):
        """
        Obtener usuario por ID
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None