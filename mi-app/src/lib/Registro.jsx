import React, { useState } from "react";
import "./login.css"; // reutilizamos los estilos del login

const Registro = () => {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Nombre:", nombre);
    console.log("Usuario:", usuario);
    console.log("Email:", email);
    console.log("Contraseña:", contraseña);
    console.log("Confirmar:", confirmar);

    // acá después vas a validar y mandar al backend
  };

  return (
    <form onSubmit={handleSubmit}>
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
            <h2 className="usuario">REGISTRO</h2>

            <h3 className="usuario">Nombre completo</h3>
            <input
              className="input"
              type="text"
              placeholder="Ingrese su nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <h3 className="usuario">Usuario</h3>
            <input
              className="input"
              type="text"
              placeholder="Elija un usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />

            <h3 className="usuario">Email</h3>
            <input
              className="input"
              type="email"
              placeholder="Ingrese su email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <h3 className="usuario">Contraseña</h3>
            <input
              className="input"
              type="password"
              placeholder="Ingrese su contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
            />

            <h3 className="usuario">Confirmar contraseña</h3>
            <input
              className="input"
              type="password"
              placeholder="Repita su contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />

            <div className="acciones">
              <button type="submit" className="boton">
                Crear cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Registro;
