// src/paginas/PaginaLogin/PaginaLogin.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import "./PaginaLogin.css";

// Icono ojo abierto
const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// Icono ojo tachado
const EyeOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.16 3.19M1 1l22 22"/>
  </svg>
);

const PaginaLogin = () => {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Mostrar alerta temporal
  const mostrarAlerta = (mensaje, tipo = "error") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => {
      setAlerta({ mensaje: "", tipo: "" });
    }, 4000);
  };

  // Manejo del submit del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !contrasena.trim()) {
      mostrarAlerta("Por favor completa todos los campos", "error");
      return;
    }

    setCargando(true);

    const { exito, error } = await login(email.trim(), contrasena);

    setCargando(false);

    if (!exito) {
      mostrarAlerta(error || "Error al iniciar sesión", "error");
      return;
    }

    mostrarAlerta("¡Bienvenido!", "exito");

    setTimeout(() => {
      navigate("/alimentadores");
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="container">
        <div className="izquierda">
          <img
            src="/src/assets/imagenes/logo 2 rw.png"
            alt="logoApp"
            className="logo"
          />
        </div>

        <div className="derecha">
          <div className="login">
            <h3 className="usuario">EMAIL</h3>

            <input
              className="input"
              type="email"
              placeholder="Ingrese su email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={cargando}
            />

            <h3 className="usuario">CONTRASEÑA</h3>
            <div className="input-contraseña">
              <input
                className="input"
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
                disabled={cargando}
              />
              <span
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className='ojito'
              >
                {mostrarContrasena ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>

            <div className="acciones">
              <button
                type="submit"
                className="boton"
                disabled={cargando}
              >
                {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>

              <Link to="/recuperarContraseña" className="recordarme">
                ¿Olvidaste tu contraseña?
              </Link>

              <Link to="/registro" className="registrarse">
                ¿No tienes cuenta? regístrate
              </Link>
            </div>
          </div>
        </div>
      </div>

      {alerta.mensaje && (
        <div className={`alerta alerta-${alerta.tipo}`}>
          {alerta.mensaje}
        </div>
      )}
    </form>
  );
};

export default PaginaLogin;
