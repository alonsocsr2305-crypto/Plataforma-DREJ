import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

const GoogleLoginButton = () => {
  const handleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
    },
    onError: (error) => {
      console.error("Error al iniciar sesión con Google", error);
    },
  });

  return (
    <button 
      type= "button" 
      onClick={handleLogin} 
      className="google-btn">
    <FcGoogle className="google-icon" />
    <span>Continuar con Google</span>
    </button>
  );
};

export default GoogleLoginButton;
