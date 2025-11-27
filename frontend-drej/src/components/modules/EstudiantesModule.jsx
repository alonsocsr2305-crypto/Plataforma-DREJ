import React from 'react';
import { Users, Search } from 'lucide-react';
import './EstudiantesModule.css';

const EstudiantesModule = () => {
    return (
        <div className="estudiantes-module">
            <div className="module-placeholder">
                <div className="placeholder-icon">
                    <Users size={64} />
                </div>
                <h2>Módulo de Estudiantes</h2>
                <p>
                    Este módulo te permitirá gestionar y monitorear el progreso 
                    de tus estudiantes de forma individual.
                </p>
                <div className="coming-soon">
                    <span className="badge">Próximamente</span>
                </div>
                <div className="features-list">
                    <h3>Funcionalidades planeadas:</h3>
                    <ul>
                        <li>✓ Ver lista completa de estudiantes</li>
                        <li>✓ Monitorear progreso individual</li>
                        <li>✓ Ver historial de respuestas</li>
                        <li>✓ Generar reportes personalizados</li>
                        <li>✓ Enviar notificaciones</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EstudiantesModule;
