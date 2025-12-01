// src/lib/Registro/Registro.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Login/login.css";
import "./Registro.css";


const Registro = () => {
	const [nombre, setNombre] = useState("");
	const [usuario, setUsuario] = useState("");
	const [email, setEmail] = useState("");
	const [contraseña, setContraseña] = useState("");
	const [confirmar, setConfirmar] = useState("");

	const [errores, setErrores] = useState({}) // { nombre: "...", usuario: "...", ... }

	const navigate = useNavigate();

	// --- Validación por campo ---
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

			case "usuario":
				if (!usuario.trim()) {
					mensaje = "El usuario es obligatorio.";
				} else if (usuario.trim().length < 4) {
					mensaje = "El usuario debe tener al menos 4 caracteres.";
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

			case "contraseña":
				if (!contraseña) {
					mensaje = "La contraseña es obligatoria.";
				} else if (contraseña.length < 6) {
					mensaje = "La contraseña debe tener al menos 6 caracteres.";
				}
				break;

			case "confirmar":
				if (!confirmar) {
					mensaje = "Debes confirmar la contraseña.";
				} else if (confirmar !== contraseña) {
					mensaje = "Las contraseñas no coinciden.";
				}
				break;

			default:
				break;
		}

		// actualizamos estado de errores para ese campo
		setErrores((prev) => {
			const next = { ...prev };
			if (mensaje) {
				next[campo] = mensaje;
			} else {
				delete next[campo]; // si ya no hay error, lo quitamos
			}
			return next;
		});

		return mensaje;
	};

	// se dispara al salir de cada input
	const handleBlur = (campo) => {
		validarCampo(campo);
	};

	// --- Validación total al hacer submit ---
	const validarTodo = () => {
		const campos = ["nombre", "usuario", "email", "contraseña", "confirmar"];
		const mensajes = campos.map((c) => validarCampo(c));
		// true si todos los mensajes están vacíos
		return mensajes.every((m) => m === "");
	};

	const handleSubmit = async (event) => {
  event.preventDefault(); // evita que la página se recargue

  // 1. Validamos todo el formulario (ya lo tenías)
    if (!validarTodo()) {
    return; // si hay errores → no hacemos nada más
    }

  // ------------------------------------------------------------------
  // 2. Evitamos que se registre dos veces el mismo email o usuario
  // ------------------------------------------------------------------
    try {
    // Preguntamos al servidor: "¿ya existe alguien con este email?"
    const respuestaEmail = await fetch(
    `http://localhost:4000/users?Email=${encodeURIComponent(email.trim().toLowerCase())}`
    );
    const usuariosConEseEmail = await respuestaEmail.json();

    if (usuariosConEseEmail.length > 0) {
    alert("Ese email ya está registrado");
      return; // salimos, no seguimos creando la cuenta
    }

    // Lo mismo pero con el nombre de usuario
    const respuestaUsuario = await fetch(
    `http://localhost:4000/users?Usuario=${encodeURIComponent(usuario.trim())}`
    );
    const usuariosConEseUsuario = await respuestaUsuario.json();

    if (usuariosConEseUsuario.length > 0) {
    alert("Ese nombre de usuario ya está en uso");
    return;
    }
} catch (err) {
    // Si por algún motivo falla esta parte, seguimos igual (es solo para el TP)
    console.log("No se pudo verificar duplicados, seguimos...");
}

  // ------------------------------------------------------------------
  // 3. Armamos el objeto exactamente igual a los que ya están en db.json
  // ------------------------------------------------------------------
    const nuevoUsuario = {
    id: Date.now().toString(),        // id único (número de milisegundos desde 1970 → siempre diferente)
    Nombre: nombre.trim(),           // importante la mayúscula y sin espacios al principio/final
    Usuario: usuario.trim(),
    Email: email.trim().toLowerCase(),
    Contraseña: contraseña           // solo para el trabajo práctico
};

  // ------------------------------------------------------------------
  // 4. Enviamos el nuevo usuario al json-server (es como un POST a una API)
  // ------------------------------------------------------------------
    try {
    const respuesta = await fetch("http://localhost:4000/users", {
      method: "POST",                                 // crear nuevo recurso
        headers: {
        "Content-Type": "application/json"              // le decimos que mandamos JSON
    },
      body: JSON.stringify(nuevoUsuario)               // convertimos el objeto a texto JSON
    });

    // Si todo salió bien...
    if (respuesta.ok) {
    alert("¡Cuenta creada con éxito!");

      // Limpiamos todos los campos
    setNombre("");
    setUsuario("");
    setEmail("");
    setContraseña("");
    setConfirmar("");
      setErrores({}); // quitamos cualquier mensaje rojo

      // Lo mandamos al login (cambiá la ruta si tu página de login es otra)
    navigate("/login");
    } else {
    alert("Hubo un error al guardar. Mirá la consola.");
    }
} catch (error) {
    console.error(error);
    alert("No se pudo conectar con la base de datos. ¿Tenés json-server corriendo?");
}
};

	const handleVolver = () => {
		navigate("/");
	};

	return (
		<form onSubmit={handleSubmit} className="login-form registro-page">
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
						<button
							type="button"
							className="btn-volver"
							onClick={handleVolver}
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
						/>
						{errores.nombre && (
							<p className="error-text">{errores.nombre}</p>
						)}

						<h3 className="label-registro">Usuario</h3>
						<input
							className={`input ${errores.usuario ? "input-error" : ""}`}
							type="text"
							placeholder="Elija un usuario"
							value={usuario}
							onChange={(e) => setUsuario(e.target.value)}
							onBlur={() => handleBlur("usuario")}
						/>
						{errores.usuario && (
							<p className="error-text">{errores.usuario}</p>
						)}

						<h3 className="label-registro">Email</h3>
						<input
							className={`input ${errores.email ? "input-error" : ""}`}
							type="email"
							placeholder="Ingrese su email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onBlur={() => handleBlur("email")}
						/>
						{errores.email && (
							<p className="error-text">{errores.email}</p>
						)}

						<h3 className="label-registro">Contraseña</h3>
						<input
							className={`input ${errores.contraseña ? "input-error" : ""}`}
							type="password"
							placeholder="Ingrese su contraseña"
							value={contraseña}
							onChange={(e) => setContraseña(e.target.value)}
							onBlur={() => handleBlur("contraseña")}
						/>
						{errores.contraseña && (
							<p className="error-text">{errores.contraseña}</p>
						)}

						<h3 className="label-registro">Confirmar contraseña</h3>
						<input
							className={`input ${errores.confirmar ? "input-error" : ""}`}
							type="password"
							placeholder="Repita su contraseña"
							value={confirmar}
							onChange={(e) => setConfirmar(e.target.value)}
							onBlur={() => handleBlur("confirmar")}
						/>
						{errores.confirmar && (
							<p className="error-text">{errores.confirmar}</p>
						)}

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
