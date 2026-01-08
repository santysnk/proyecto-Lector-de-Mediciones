// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";                // componentes de enrutado declarativo
import PaginaLogin from "./paginas/PaginaLogin/PaginaLogin.jsx";           // pantalla de login (ruta "/")
import PaginaRegistro from "./paginas/PaginaRegistro/PaginaRegistro.jsx";  // pantalla de registro (ruta "/registro")
import PaginaAlimentadoresSupabase from "./paginas/PaginaAlimentadores/PaginaAlimentadoresSupabase.jsx"; // panel principal conectado a Supabase
import RecuperarContrasena from "./paginas/PaginaRecuperar/RecuperarContrasena.jsx";

function App() {                                         // componente raíz que define el mapa de rutas
	return (
		<Routes>                                           {/* contenedor de todas las <Route> */}
			<Route                                           
				path="/"                                     
				element={<PaginaLogin />}                    // ruta principal: muestra login
			/>

			<Route                                           
				path="/registro"                            
				element={<PaginaRegistro />}                 // ruta para crear un nuevo usuario
			/>

			<Route
				path="/recuperarContraseña"
				element={<RecuperarContrasena/>}            // ruta para recuperar contraseña
			/>

			<Route
				path="/alimentadores"
				element={<PaginaAlimentadoresSupabase />}    // ruta del panel de alimentadores conectado a Supabase
			/>

			<Route                                           
				path="*"                                    
				element={<Navigate to="/" replace />}       // cualquier otra URL redirige al login
			/>
		</Routes>
	);
}

export default App;                                          // se importa en main.jsx como componente principal

