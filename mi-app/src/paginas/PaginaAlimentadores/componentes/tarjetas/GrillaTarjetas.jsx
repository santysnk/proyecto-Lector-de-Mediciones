import React from "react";
import TarjetaAlimentador from "./TarjetaAlimentador.jsx";
import "./GrillaTarjetas.css";

/**
 * Grilla de tarjetas de alimentadores
 * Maneja el display de tarjetas y la tarjeta de agregar nuevo
 */
const GrillaTarjetas = ({
	alimentadores,
	lecturas,
	puestoId,
	elementoArrastrandoId,
	onAbrirConfiguracion,
	onAbrirMapeo,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onDropAlFinal,
	onAgregarNuevo,
	estaMidiendo,
	obtenerTimestampInicio,
}) => {
	return (
		<div className="alim-cards-grid">
			{alimentadores.map((alim) => {
				const lecturasAlim = lecturas[alim.id] || {};
				const mideRele = estaMidiendo(alim.id, "rele");
				const mideAnalizador = estaMidiendo(alim.id, "analizador");

				return (
					<TarjetaAlimentador
						key={alim.id}
						nombre={alim.nombre}
						color={alim.color}
						onConfigClick={() => onAbrirConfiguracion(puestoId, alim)}
						onMapClick={() => onAbrirMapeo(puestoId, alim)}
						topSide={lecturasAlim.parteSuperior}
						bottomSide={lecturasAlim.parteInferior}
						draggable={true}
						isDragging={elementoArrastrandoId === alim.id}
						onDragStart={() => onDragStart(alim.id)}
						onDragOver={onDragOver}
						onDrop={() => onDrop(alim.id)}
						onDragEnd={onDragEnd}
						mideRele={mideRele}
						mideAnalizador={mideAnalizador}
						periodoRele={alim.periodoSegundos || 60}
						periodoAnalizador={alim.analizador?.periodoSegundos || 60}
						timestampInicioRele={obtenerTimestampInicio(alim.id, "rele")}
						timestampInicioAnalizador={obtenerTimestampInicio(alim.id, "analizador")}
					/>
				);
			})}

			{elementoArrastrandoId ? (
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
				<div className="alim-card-add" onClick={onAgregarNuevo}>
					<span className="alim-card-add-plus">+</span>
					<span className="alim-card-add-text">Nuevo Registrador</span>
				</div>
			)}
		</div>
	);
};

export default GrillaTarjetas;
