// src/paginas/PaginaRegistro/PaginaRegistro.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import "../PaginaLogin/PaginaLogin.css";
import "./PaginaRegistro.css";
import logoApp from "../../assets/imagenes/logo 2 rw.png";

const PaginaRegistro = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });
  const [cargando, setCargando] = useState(false);

  const { registro } = useAuth();
  const navigate = useNavigate();

  // Mostrar alerta temporal
  const mostrarAlerta = (mensaje, tipo = "error") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => {
      setAlerta({ mensaje: "", tipo: "" });
    }, 5000);
  };

  // Validación por campo
  const validarCampo = (campo) => {
    let mensaje = "";

    switch (campo) {
      case "nombre":
        if (!nombre.trim()) {
          mensaje = "El nombre es obligatorio.";
        } else if (nombre.trim().length < 3) {
          mensaje = "El nombre debe tener al menos 3 caracteres.";
        }
        break;

      case "email":
        if (!email.trim()) {
          mensaje = "El email es obligatorio.";
        } else {
          const regexEmail = /^\S+@\S+\.\S+$/;
          if (!regexEmail.test(email)) {
            mensaje = "El formato de email no es válido.";
          }
        }
        break;

      case "contrasena":
        if (!contrasena) {
          mensaje = "La contraseña es obligatoria.";
        } else if (contrasena.length < 6) {
          mensaje = "La contraseña debe tener al menos 6 caracteres.";
        }
        break;

      case "confirmar":
        if (!confirmar) {
          mensaje = "Debes confirmar la contraseña.";
        } else if (confirmar !== contrasena) {
          mensaje = "Las contraseñas no coinciden.";
        }
        break;

      default:
        break;
    }

    setErrores((prev) => {
      const next = { ...prev };
      if (mensaje) {
        next[campo] = mensaje;
      } else {
        delete next[campo];
      }
      return next;
    });

    return mensaje;
  };

  // Validación al salir de cada input
  const handleBlur = (campo) => {
    validarCampo(campo);
  };

  // Validación global del formulario
  const validarTodo = () => {
    const campos = ["nombre", "email", "contrasena", "confirmar"];
    const mensajes = campos.map((c) => validarCampo(c));
    return mensajes.every((m) => m === "");
  };

  // Envío del formulario
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validarTodo()) {
      return;
    }

    setCargando(true);

    const { exito, error, requiereConfirmacion } = await registro(
      email.trim().toLowerCase(),
      contrasena,
      nombre.trim()
    );

    setCargando(false);

    if (!exito) {
      mostrarAlerta(error || "Error al crear la cuenta", "error");
      return;
    }

    if (requiereConfirmacion) {
      mostrarAlerta(
        "¡Cuenta creada! Revisa tu email para confirmar tu cuenta antes de iniciar sesión.",
        "exito"
      );
    } else {
      mostrarAlerta("¡Cuenta creada con éxito!", "exito");
    }

    // Limpiar formulario
    setNombre("");
    setEmail("");
    setContrasena("");
    setConfirmar("");
    setErrores({});

    // Volver al login después de un momento
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  // Botón "Volver"
  const handleVolver = () => {
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="login-form registro-page">
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
            <button
              type="button"
              className="btn-volver"
              onClick={handleVolver}
              disabled={cargando}
            >
              ← Volver
            </button>

            <h2 className="titulo-registro">REGISTRO</h2>

            <h3 className="label-registro">Nombre completo</h3>
            <input
              className={`input ${errores.nombre ? "input-error" : ""}`}
              type="text"
              placeholder="Ingrese su nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => handleBlur("nombre")}
              disabled={cargando}
            />
            {errores.nombre && (
              <p className="error-text">{errores.nombre}</p>
            )}

            <h3 className="label-registro">Email</h3>
            <input
              className={`input ${errores.email ? "input-error" : ""}`}
              type="email"
              placeholder="Ingrese su email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              disabled={cargando}
            />
            {errores.email && (
              <p className="error-text">{errores.email}</p>
            )}

            <h3 className="label-registro">Contraseña</h3>
            <input
              className={`input ${errores.contrasena ? "input-error" : ""}`}
              type="password"
              placeholder="Ingrese su contraseña (mín. 6 caracteres)"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              onBlur={() => handleBlur("contrasena")}
              disabled={cargando}
            />
            {errores.contrasena && (
              <p className="error-text">{errores.contrasena}</p>
            )}

            <h3 className="label-registro">Confirmar contraseña</h3>
            <input
              className={`input ${errores.confirmar ? "input-error" : ""}`}
              type="password"
              placeholder="Repita su contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              onBlur={() => handleBlur("confirmar")}
              disabled={cargando}
            />
            {errores.confirmar && (
              <p className="error-text">{errores.confirmar}</p>
            )}

            <div className="acciones">
              <button
                type="submit"
                className="boton"
                disabled={cargando}
              >
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
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

export default PaginaRegistro;
