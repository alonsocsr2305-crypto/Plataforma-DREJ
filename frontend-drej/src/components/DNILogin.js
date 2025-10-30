import { dniAPI } from '../services/Api'; // ← Importar API

const verificarDNI = async () => {
    // ... validaciones ...
    
    setStep(2);
    setLoading(true);

    try {
        // Llamar a tu backend Django
        const response = await dniAPI.verificar(dniInput);

        if (response.success) {
            const data = response.data;
            
            // Autocompletar formulario
            setFormData({
                nombres: data.nombres || '',
                apellidoPaterno: data.apellidoPaterno || '',
                apellidoMaterno: data.apellidoMaterno || '',
                dni: dniInput,
                fechaNacimiento: data.fechaNacimiento || '',
                correo: '',
                password: '',
                passwordConfirm: ''
            });

            setStep(3);
        }

    } catch (err) {
        console.error('Error al verificar DNI:', err);
        setError('No se pudo verificar el DNI.');
        setStep(1);
    } finally {
        setLoading(false);
    }
};