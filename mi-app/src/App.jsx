// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./lib/Login/login.jsx";
import Registro from "./lib/Registro/Registro.jsx";
import Alimentadores from "./lib/Alimentadores/Alimentadores.jsx";  

function App() {	

		return (
		
			<Routes>
				{/* Ruta principal: login */}
				<Route path="/" element={<Login />} />

				{/* Ruta de registro */}
				<Route path="/registro" element={<Registro />} />

				{/* Ruta de alimentadores */}
				<Route path="/alimentadores" element={<Alimentadores />} />

				{/* Cualquier otra ruta -> redirige al login */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
	
	);
}

export default App;
