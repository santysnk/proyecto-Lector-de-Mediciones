// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";                // componentes de enrutado declarativo
import PaginaLogin from "./paginas/PaginaLogin/PaginaLogin.jsx";           // pantalla de login (ruta "/")
import PaginaRegistro from "./paginas/PaginaRegistro/PaginaRegistro.jsx";  // pantalla de registro (ruta "/registro")
import PaginaAlimentadoresSupabase from "./paginas/PaginaAlimentadores/PaginaAlimentadoresSupabase.jsx"; // panel principal conectado a Supabase
import RecuperarContrasena from "./paginas/PaginaRecuperar/recuperarContraseña.jsx"; // pantalla de recupero de contraseña (ruta "/recuperarContraseña")

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

// ---------------------------------------------------------------------------
// NOTA PERSONAL SOBRE ESTE ARCHIVO (App.jsx)
// - Este componente define el enrutado de alto nivel de la aplicación.
// - Usa <Routes> y <Route> de react-router-dom para asociar paths a componentes.
// - "/" carga PaginaLogin, "/registro" carga PaginaRegistro "/recuperarContraseña"
//   carga RecuperarContraseña y "/alimentadores" muestra el panel principal 
//   donde se manejan puestos y alimentadores.
// - La última ruta con path="*" actúa como catch-all: cualquier URL desconocida
//   navega automáticamente a "/", evitando pantallas en blanco o errores.
// - En resumen: App.jsx es el “switch” de rutas que decide qué pantalla ver en
//   función de la URL actual del navegador.
