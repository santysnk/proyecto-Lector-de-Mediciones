import React from "react";
import { ProveedorAlimentadores } from "./contexto/ContextoAlimentadores";
import VistaAlimentadores from "./componentes/layout/VistaAlimentadores.jsx";

/**
 * ==============================================================================
 * COMPONENTE PRINCIPAL: PaginaAlimentadores
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el punto de entrada de la página. Su única responsabilidad es "conectar"
 * los datos con la vista.
 * 
 * ¿CÓMO FUNCIONA?
 * 1. Envuelve todo en <ProveedorAlimentadores>: Esto hace que los datos (puestos,
 *    mediciones, etc.) estén disponibles para todos los componentes hijos.
 * 2. Muestra <VistaAlimentadores>: Es el componente que realmente dibuja la
 *    pantalla (barras, tarjetas, modales).
 * 
 * FINALIDAD:
 * Mantener el código limpio separando la "Lógica de Datos" (Proveedor) de la
 * "Lógica Visual" (Vista).
 */

const PaginaAlimentadores = () => {
	return (
		// El Proveedor es como una "nube" de datos que cubre a toda la vista
		<ProveedorAlimentadores>
			<VistaAlimentadores />
		</ProveedorAlimentadores>
	);
};

export default PaginaAlimentadores;
