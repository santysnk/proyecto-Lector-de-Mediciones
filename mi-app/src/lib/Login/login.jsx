// src/lib/Login/login.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

const Login = () => {
	const [usuariosValidos, setUsuariosValidos] = useState([]);
	const [usuario, setUsuario] = useState("");
	const [contraseña, setContraseña] = useState("");
	const [recordarme, setRecordarme] = useState(false);
	const [error, setError] = useState("");

	const navigate = useNavigate();

	// Cargar usuarios desde db.json (json-server en http://localhost:4000)
	useEffect(() => {
		fetch("http://localhost:4000/users")
			.then((response) => {
				if (!response.ok) throw new Error("Error al cargar usuarios");
				return response.json();
			})
			.then((data) => setUsuariosValidos(data))
			.catch((err) => {
				console.error(err);
				setError("No se pudieron cargar los usuarios.");
			});
	}, []); // 👈 vacío para que se ejecute solo una vez

	const handleSubmit = (event) => {
		event.preventDefault();
		setError("");

		const usuarioLimpio = usuario.trim().toLowerCase();

		// Buscar el usuario por el campo "Usuario" del JSON
		const usuarioEncontrado = usuariosValidos.find(
			(u) => u.Usuario.toLowerCase() === usuarioLimpio
		);

		if (!usuarioEncontrado) {
			setError("El usuario no existe.");
			return;
		}

		// Comparar contraseña (ojo con la ñ en la key)
		if (usuarioEncontrado["Contraseña"] !== contraseña) {
			setError("La contraseña es incorrecta.");
			return;
		}

		// Si llega acá: login OK
		if (recordarme) {
			localStorage.setItem(
				"usuarioLogueado",
				JSON.stringify({
					id: usuarioEncontrado.id,
					nombre: usuarioEncontrado.Nombre,
					usuario: usuarioEncontrado.Usuario,
					email: usuarioEncontrado.Email,
				})
			);
		}
		
		// Redirección directa a la página de alimentadores
		navigate("/alimentadores");
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
						<h3 className="usuario">USUARIO</h3>
						<input
							className="input"
							type="text"
							placeholder="Ingrese su usuario"
							value={usuario}
							onChange={(e) => setUsuario(e.target.value)}
						/>

						<h3 className="usuario">CONTRASEÑA</h3>
						<input
							className="input"
							type="password"
							placeholder="Ingrese su contraseña"
							value={contraseña}
							onChange={(e) => setContraseña(e.target.value)}
						/>

						<label className="recordarme">
							<input
								type="checkbox"
								checked={recordarme}
								onChange={(event) => setRecordarme(event.target.checked)}
							/>{" "}
							Recordarme
						</label>

						{error && <p className="error">{error}</p>}

						<div className="acciones">
							<button type="submit" className="boton">
								Iniciar sesión
							</button>
							<p className="recordarme">¿Olvidaste tu contraseña?</p>
							<Link to="/registro" className="registrarse">
								¿No tienes cuenta? registrate
							</Link>
						</div>
					</div>
				</div>
			</div>
		</form>
	);
};

export default Login;
