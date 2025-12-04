// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PaginaLogin from "./paginas/PaginaLogin/PaginaLogin.jsx";
import PaginaRegistro from "./paginas/PaginaRegistro/PaginaRegistro.jsx";
import PaginaAlimentadores from "./paginas/PaginaAlimentadores/PaginaAlimentadores.jsx";

function App() {

	return (

		<Routes>
			{/* Ruta principal: login */}
			<Route path="/" element={<PaginaLogin />} />

			{/* Ruta de registro */}
			<Route path="/registro" element={<PaginaRegistro />} />

			{/* Ruta de alimentadores */}
			<Route path="/alimentadores" element={<PaginaAlimentadores />} />

			{/* Cualquier otra ruta -> redirige al login */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>

	);
}

export default App;
