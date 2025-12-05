import React, { useEffect, useRef, useState } from "react";
import "./TarjetaAlimentador.css";
import configIcon from "../../../../assets/imagenes/Config_Icon.png";
import mapIcon from "../../../../assets/imagenes/Mapeo_icon.png";
import CajaMedicion from "./CajaMedicion.jsx";
import GrupoMedidores from "./GrupoMedidores.jsx";

/**
 * ==============================================================================
 * COMPONENTE: TarjetaAlimentador
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es la "tarjeta" individual que representa a un alimentador (registrador).
 * Muestra:
 * 1. El nombre y color del alimentador.
 * 2. Botones para configurarlo o mapearlo.
 * 3. Dos secciones de mediciones (generalmente Consumo arriba y Tensión abajo).
 * 
 * ¿CÓMO FUNCIONA?
 * Recibe muchos "props" con datos (valores, configuración, estado de medición).
 * Se encarga de organizar esos datos y pasárselos a componentes más pequeños
 * (GrupoMedidores y CajaMedicion) para que los dibujen.
 * 
 * FINALIDAD:
 * Ser el contenedor visual principal de cada equipo monitoreado.
 */

// Función auxiliar para preparar los datos de un lado de la tarjeta (arriba o abajo)
const construirLado = (side, tituloDefault) => {
	// Si no hay datos configurados, mostramos 3 cajas vacías (R, S, T) por defecto
	const cajasPorDefecto = ["R", "S", "T"].map((label) => ({
		etiqueta: label,
		valor: "--,--",
		enabled: false,
		origen: null,
	}));

	if (!side) {
		return {
			titulo: tituloDefault,
			boxes: cajasPorDefecto,
		};
	}

	// Usamos el título configurado o el por defecto
	const titulo = (side.titulo && String(side.titulo).trim()) || tituloDefault;

	// Aseguramos que sea un array y tomamos máximo 4 cajas
	let boxes = Array.isArray(side.boxes) ? side.boxes : [];
	boxes = boxes.slice(0, 4);

	if (boxes.length === 0) {
		boxes = cajasPorDefecto;
	} else {
		// Normalizamos los datos de cada caja para evitar errores
		boxes = boxes.map((b, idx) => ({
			etiqueta: (b?.etiqueta && String(b.etiqueta).trim()) || `Box ${idx + 1}`,
			valor: b?.valor == null || b.valor === "" ? "--,--" : String(b.valor),
			enabled: !!b?.enabled,
			origen: b?.origen || null,
		}));
	}

	return { titulo, boxes };
};

const TarjetaAlimentador = ({
	nombre, 			// Nombre del alimentador (ej: "Torno 1")
	color, 				// Color de la cabecera
	onConfigClick, 		// Función al tocar el engranaje
	onMapClick, 		// Función al tocar el mapa
	topSide, 			// Datos para la parte de arriba
	bottomSide, 		// Datos para la parte de abajo
	draggable = false, 	// ¿Se puede arrastrar?
	isDragging = false, // ¿Se está arrastrando ahora mismo?
	onDragStart, 		// Eventos de arrastre...
	onDragOver,
	onDrop,
	onDragEnd,

	// Datos de medición en tiempo real
	mideRele = false,
	mideAnalizador = false,
	periodoRele = 60,
	periodoAnalizador = 60,
	timestampInicioRele = null,
	timestampInicioAnalizador = null,
	contadorRele = 0,
	contadorAnalizador = 0,
}) => {

	// ==========================================================================
	// LÓGICA DE ANIMACIÓN
	// ==========================================================================

	// Estado local para controlar cuándo mostrar la animación de borde amarillo
	const [mostrarProgresoRele, setMostrarProgresoRele] = useState(false);
	const [mostrarProgresoAnalizador, setMostrarProgresoAnalizador] = useState(false);

	// Referencias para recordar el último valor del contador y detectar cambios
	const ultimoContadorReleRef = useRef(contadorRele);
	const ultimoContadorAnalizadorRef = useRef(contadorAnalizador);

	// Efecto: Controla la animación del Relé
	useEffect(() => {
		if (!mideRele) {
			setMostrarProgresoRele(false); // Si no mide, apagar animación
			ultimoContadorReleRef.current = contadorRele;
			return;
		}

		// Si el contador cambió (llegó un dato nuevo), activar animación
		if (contadorRele !== ultimoContadorReleRef.current) {
			ultimoContadorReleRef.current = contadorRele;
			setMostrarProgresoRele(contadorRele > 0);
		}
	}, [contadorRele, mideRele]);

	// Efecto: Controla la animación del Analizador (misma lógica)
	useEffect(() => {
		if (!mideAnalizador) {
			setMostrarProgresoAnalizador(false);
			ultimoContadorAnalizadorRef.current = contadorAnalizador;
			return;
		}

		if (contadorAnalizador !== ultimoContadorAnalizadorRef.current) {
			ultimoContadorAnalizadorRef.current = contadorAnalizador;
			setMostrarProgresoAnalizador(contadorAnalizador > 0);
		}
	}, [contadorAnalizador, mideAnalizador]);

	// Preparamos los datos visuales
	const sup = construirLado(topSide, "CONSUMO (A)");
	const inf = construirLado(bottomSide, "TENSION (kV)");

	// Detectamos si la tarjeta debe ser ancha (si tiene 4 cajas en alguna fila)
	const maxBoxes = Math.max(sup.boxes.length, inf.boxes.length);
	const isWide = maxBoxes >= 4;

	// Clases CSS dinámicas
	const clasesCard = ["alim-card"];
	if (isWide) clasesCard.push("alim-card-wide");
	if (isDragging) clasesCard.push("alim-card-dragging");

	// Función helper para renderizar cada cajita individual
	const renderizarCaja = (box, idx, zona) => (
		<CajaMedicion
			box={box}
			indice={idx}
			zona={zona}
			mideRele={mideRele}
			mideAnalizador={mideAnalizador}
			mostrarProgresoRele={mostrarProgresoRele}
			mostrarProgresoAnalizador={mostrarProgresoAnalizador}
			periodoRele={periodoRele}
			periodoAnalizador={periodoAnalizador}
			contadorRele={contadorRele}
			contadorAnalizador={contadorAnalizador}
		/>
	);

	return (
		<div
			className={clasesCard.join(" ")}
			style={{ cursor: draggable ? "grab" : "default" }}
			draggable={draggable}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDrop={onDrop}
			onDragEnd={onDragEnd}
		>
			{/* CABECERA: Nombre y botones de acción */}
			<div
				className="alim-card-header"
				style={{ backgroundColor: color || "#0ea5e9" }}
			>
				<div className="alim-card-icons">
					<button
						type="button"
						className="alim-card-icon-btn"
						onClick={onConfigClick}
						title="Configurar registrador"
					>
						<img
							src={configIcon}
							alt="Configurar"
							className="alim-card-icon"
						/>
					</button>

					<button
						type="button"
						className="alim-card-icon-btn alim-card-map-btn"
						onClick={onMapClick}
						title="Mapeo"
					>
						<img src={mapIcon} alt="Mapeo" className="alim-card-icon" />
					</button>
				</div>

				<span className="alim-card-title">{nombre}</span>
			</div>

			{/* CUERPO: Las dos secciones de mediciones */}
			<div className="alim-card-body">
				{/* SECCIÓN SUPERIOR */}
				<GrupoMedidores
					titulo={sup.titulo}
					boxes={sup.boxes}
					zona="sup"
					renderizarCaja={renderizarCaja}
				/>

				{/* SECCIÓN INFERIOR */}
				<GrupoMedidores
					titulo={inf.titulo}
					boxes={inf.boxes}
					zona="inf"
					renderizarCaja={renderizarCaja}
				/>
			</div>
		</div>
	);
};

export default TarjetaAlimentador;
