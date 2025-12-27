// src/paginas/PaginaLogin/PaginaLogin.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import { Capacitor } from "@capacitor/core";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import "./PaginaLogin.css";
import logoApp from "../../assets/imagenes/logo 2 rw.png";

const STORAGE_KEY = "relaywatch_recordarme";

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
  const [recordarme, setRecordarme] = useState(false);
  const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });
  const [cargando, setCargando] = useState(false);

  // Ref para saber si las credenciales vienen del localStorage (precargadas)
  const credencialesPrecargadas = useRef(false);
  const biometriaYaIntentada = useRef(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Cargar credenciales guardadas al montar
  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        const { email: emailGuardado, contrasena: contrasenaGuardada } = JSON.parse(guardado);
        if (emailGuardado && contrasenaGuardada) {
          setEmail(emailGuardado);
          setContrasena(contrasenaGuardada);
          setRecordarme(true);
          credencialesPrecargadas.current = true;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Mostrar alerta temporal
  const mostrarAlerta = (mensaje, tipo = "error") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => {
      setAlerta({ mensaje: "", tipo: "" });
    }, 4000);
  };

  // Mostrar prompt de biometría automáticamente SOLO si hay credenciales precargadas
  useEffect(() => {
    const intentarBiometria = async () => {
      // Solo ejecutar si:
      // 1. Las credenciales vienen precargadas del localStorage
      // 2. No se ha intentado ya la biometría
      // 3. Estamos en plataforma nativa
      if (!credencialesPrecargadas.current || biometriaYaIntentada.current) return;
      if (!Capacitor.isNativePlatform()) return;

      biometriaYaIntentada.current = true;

      try {
        const info = await BiometricAuth.checkBiometry();
        if (!info.isAvailable) return;

        await BiometricAuth.authenticate({
          reason: "Inicia sesión con tu huella digital",
          cancelTitle: "Cancelar",
          allowDeviceCredential: true,
        });

        // Biometría exitosa, hacer login automático
        setCargando(true);
        const { exito, error } = await login(email.trim(), contrasena);
        setCargando(false);

        if (!exito) {
          mostrarAlerta(error || "Error al iniciar sesión", "error");
          return;
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.trim(), contrasena }));
        mostrarAlerta("¡Bienvenido!", "exito");

        setTimeout(() => {
          navigate("/alimentadores");
        }, 1200);
      } catch {
        // Usuario canceló o error de biometría - no mostrar error
      }
    };

    // Pequeño delay para que la UI se renderice primero
    const timer = setTimeout(intentarBiometria, 500);
    return () => clearTimeout(timer);
  }, [email, contrasena, login, navigate]);

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

    // Guardar o limpiar credenciales según checkbox
    if (recordarme) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.trim(), contrasena }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
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
            src={logoApp}
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

            <label className="checkbox-recordarme">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                disabled={cargando}
              />
              <span>Recordarme</span>
            </label>

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
