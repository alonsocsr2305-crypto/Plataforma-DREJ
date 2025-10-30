from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserCreationForm

User = get_user_model()

class RegistroForm(UserCreationForm):
    """
    Formulario de registro basado en UserCreationForm:
    - username
    - email (único)
    - password1, password2
    - rol (Group de Django)
    """
    email = forms.EmailField(
        required=True,
        label="Correo electrónico"
    )

    ROL_CHOICES = (
        ('Admin', 'Admin'),
        ('Estudiante', 'Estudiante'),
        ('Orientador', 'Orientador'),
    )
    rol = forms.ChoiceField(
        choices=ROL_CHOICES,
        label="Rol"
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2', 'rol')
        # Nota: si vas a usar autenticación por email, luego puedes personalizar AUTHENTICATION_BACKENDS.

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("Este correo ya está registrado.")
        return email

    def save(self, commit=True):
        """
        Deja que UserCreationForm maneje hashing.
        Guardamos email/username; el rol se asigna en la vista.
        """
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user
