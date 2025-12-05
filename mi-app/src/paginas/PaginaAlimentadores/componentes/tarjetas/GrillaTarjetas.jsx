import React from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import "./GrillaTarjetas.css";

/**
 * ==============================================================================
 * COMPONENTE: GrillaTarjetas
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el contenedor que organiza todas las tarjetas de alimentadores en la pantalla.
 * Se encarga de:
 * 1. Recorrer la lista de alimentadores y dibujar una tarjeta por cada uno.
 * 2. Mostrar la tarjeta especial de "Nuevo Registrador" al final.
 * 3. Manejar la lógica de "Arrastrar y Soltar" (Drag & Drop) para reordenarlas.
 * 
 * ¿CÓMO FUNCIONA?
 * Recibe la lista de alimentadores y las funciones para interactuar con ellos.
 * Si estamos arrastrando una tarjeta, muestra una zona especial para soltarla al final.
 * 
 * FINALIDAD:
 * Mantener el orden visual y permitir la gestión de la lista de equipos.
 */

const GrillaTarjetas = ({
	alimentadores, 			// Lista de datos de los alimentadores
	lecturas, 				// Valores actuales de medición (calculados en el padre)
	puestoId, 				// ID del puesto actual
	elementoArrastrandoId, 	// ID de la tarjeta que se está moviendo (si hay alguna)
	onAbrirConfiguracion, 	// Función para abrir config
	onAbrirMapeo, 			// Función para abrir mapeo
	onDragStart, 			// Eventos de arrastre...
	onDragOver,
	onDrop,
	onDragEnd,
	onDropAlFinal, 			// Función especial para soltar al final de la lista
	onAgregarNuevo, 		// Función para crear uno nuevo
	estaMidiendo, 			// Función para saber si un equipo está midiendo
	obtenerTimestampInicio, // Función para sincronizar animaciones
	obtenerContadorLecturas,// Función para reiniciar animaciones con nuevos datos
}) => {
	return (
		<div className="alim-cards-grid">
			{/* 1. Renderizamos cada tarjeta de la lista */}
			{alimentadores.map((alim) => {
				const lecturasAlim = lecturas[alim.id] || {};
				const mideRele = estaMidiendo(alim.id, "rele");
				const mideAnalizador = estaMidiendo(alim.id, "analizador");

				return (
					<TarjetaAlimentador
						key={alim.id}
						nombre={alim.nombre}
						color={alim.color}
						// Pasamos las funciones de click conectadas con el ID correcto
						onConfigClick={() => onAbrirConfiguracion(puestoId, alim)}
						onMapClick={() => onAbrirMapeo(puestoId, alim)}

						// Datos visuales
						topSide={lecturasAlim.parteSuperior}
						bottomSide={lecturasAlim.parteInferior}

						// Configuración de arrastre
						draggable={true}
						isDragging={elementoArrastrandoId === alim.id}
						onDragStart={() => onDragStart(alim.id)}
						onDragOver={onDragOver}
						onDrop={() => onDrop(alim.id)}
						onDragEnd={onDragEnd}

						// Estado de medición y sincronización
						mideRele={mideRele}
						mideAnalizador={mideAnalizador}
						periodoRele={alim.periodoSegundos || 60}
						periodoAnalizador={alim.analizador?.periodoSegundos || 60}
						timestampInicioRele={obtenerTimestampInicio(alim.id, "rele")}
						timestampInicioAnalizador={obtenerTimestampInicio(alim.id, "analizador")}
						contadorRele={obtenerContadorLecturas(alim.id, "rele")}
						contadorAnalizador={obtenerContadorLecturas(alim.id, "analizador")}
					/>
				);
			})}

			{/* 2. Renderizamos la tarjeta final (Agregar o Zona de Soltar) */}
			{elementoArrastrandoId ? (
				// Si estamos arrastrando algo, mostramos una zona para soltar al final
				<div
					className="alim-card-add"
					onDragOver={onDragOver}
					onDrop={onDropAlFinal}
				>
					<span
						style={{
							textAlign: "center",
							padding: "1rem",
						}}
					>
						Soltar aquí para mover al final
					</span>
				</div>
			) : (
				// Si no, mostramos el botón de agregar nuevo
				<div className="alim-card-add" onClick={onAgregarNuevo}>
					<span className="alim-card-add-plus">+</span>
					<span className="alim-card-add-text">Nuevo Registrador</span>
				</div>
			)}
		</div>
	);
};

export default GrillaTarjetas;
