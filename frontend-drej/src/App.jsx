import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/Login.jsx';
import Dashboard from './components/dashboard.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Cuestionario from './components/Cuestionario.jsx';
import ResultadoCuestionario from './components/ResultadoCuestionario.jsx';
import EstudianteDashboard from './components/EstudianteDashboard.jsx';
import OrientadorDashboard from './pages/OrientadorDashboard';

import './Css/variables.css';
import './Css/styles.css';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/estudiante/dashboard" element={<EstudianteDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/estudiante/cuestionario/:id" element={<Cuestionario />} />
        <Route path="/estudiante/resultado/:intentoId" element={<ResultadoCuestionario />} /> 
        <Route path="/estudiante/dashboard" element={<EstudianteDashboard />} />
        <Route path="/orientador/dashboard" element={<OrientadorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
