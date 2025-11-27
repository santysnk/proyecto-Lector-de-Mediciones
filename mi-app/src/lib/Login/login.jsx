import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";

const Login = () => {
	const [usuario, setUsuario] = useState("");
	const [contraseña, setContraseña] = useState("");
	const [recordarme, setRecordarme] = useState(false);

	const handleSubmit = (event) => {
		event.preventDefault();

		console.log("Usuario:", usuario);
		console.log("Contraseña:", contraseña);
		console.log("Recordarme:", recordarme);
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
