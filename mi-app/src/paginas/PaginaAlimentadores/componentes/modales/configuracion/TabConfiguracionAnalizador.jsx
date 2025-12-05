import React from "react";
import "./TabConfiguracion.css";

/**
 * ==============================================================================
 * SUBCOMPONENTE: TabConfiguracionAnalizador
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el panel para configurar la conexión con el ANALIZADOR DE RED.
 * Funciona igual que el del Relé, pero maneja sus propios datos (IP, puerto, etc.).
 * 
 * ¿CÓMO FUNCIONA?
 * - Recibe la configuración actual del analizador.
 * - Permite editarla, probar la conexión y ver datos en vivo.
 * 
 * NOTA:
 * Aunque el código es muy parecido al del Relé, se mantiene separado para
 * permitir que en el futuro tengan campos o comportamientos diferentes
 * (ej: el analizador podría tener más opciones avanzadas).
 */

const TabConfiguracionAnalizador = ({
	config, 			// Objeto con { ip, puerto, indiceInicial, cantRegistros }
	onChange, 			// Función para actualizar campos
	onTestConexion, 	// Función para probar conexión
	isTesting, 			// Estado de "Probando..."
	testError, 			// Error de prueba
	testRows, 			// Resultados de prueba
	isMeasuring, 		// Estado de "Midiendo..."
	onToggleMedicion, 	// Iniciar/Detener medición
	registrosMedicion, 	// Datos en vivo
	disabled, 			// Bloquear formulario
}) => {

	// Lógica para decidir qué mostrar en la tabla (datos en vivo o test)
	const rowsToShow =
		isMeasuring && registrosMedicion && registrosMedicion.length > 0
			? registrosMedicion
			: testRows;

	const mensajeTabla =
		isMeasuring && registrosMedicion && registrosMedicion.length > 0
			? `Medición en curso. Registros en vivo: ${registrosMedicion.length}`
			: `Test correcto. Registros leídos: ${testRows.length}`;

	return (
		<div className="alim-modal-grid">
			{/* CAMPO: IP */}
			<label className="alim-field">
				<span className="alim-field-label">Dirección IP</span>
				<input
					type="text"
					className="alim-field-input"
					value={config.ip}
					onChange={(e) => onChange("ip", e.target.value)}
					placeholder="Ej: 172.16.0.5"
					disabled={disabled}
				/>
			</label>

			{/* CAMPO: PUERTO */}
			<label className="alim-field">
				<span className="alim-field-label">Puerto</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.puerto}
					onChange={(e) => onChange("puerto", e.target.value)}
					placeholder="Ej: 502"
					disabled={disabled}
				/>
			</label>

			{/* CAMPO: ÍNDICE INICIAL */}
			<label className="alim-field">
				<span className="alim-field-label">Índice inicial</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.indiceInicial}
					onChange={(e) => onChange("indiceInicial", e.target.value)}
					placeholder="Ej: 200"
					disabled={disabled}
				/>
			</label>

			{/* CAMPO: CANTIDAD DE REGISTROS */}
			<label className="alim-field">
				<span className="alim-field-label">Cant. registros</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.cantRegistros}
					onChange={(e) => onChange("cantRegistros", e.target.value)}
					placeholder="Ej: 10"
					disabled={disabled}
				/>
			</label>

			{/* CAMPO: PERIODO DE ACTUALIZACIÓN */}
			<label className="alim-field">
				<span className="alim-field-label">
					Período actualización (s)
				</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.periodoSegundos}
					onChange={(e) =>
						onChange("periodoSegundos", e.target.value)
					}
					placeholder="Ej: 60"
					min={1}
					disabled={disabled}
				/>
			</label>

			{/* Advertencia de rendimiento */}
			{config.periodoSegundos &&
				Number(config.periodoSegundos) > 0 &&
				Number(config.periodoSegundos) < 60 && (
					<p className="alim-warning">
						⚠️ Periodos menores a 60&nbsp;s pueden recargar el sistema
						y la red de comunicaciones.
					</p>
				)}

			{/* BOTONES DE ACCIÓN */}
			<div className="alim-test-row">
				<button
					type="button"
					className="alim-test-btn"
					onClick={onTestConexion}
					disabled={isTesting}
				>
					{isTesting ? "Probando..." : "Test conexión"}
				</button>

				<button
					type="button"
					className={
						"alim-test-btn" +
						(isMeasuring
							? " alim-test-btn-stop"
							: " alim-test-btn-secondary")
					}
					onClick={onToggleMedicion}
					disabled={
						isTesting ||
						!config.ip.trim() ||
						!config.puerto
					}
				>
					{isMeasuring ? "Detener medición" : "Iniciar medición"}
				</button>
			</div>

			{/* MENSAJES Y TABLA DE RESULTADOS */}
			{testError && (
				<div className="alim-test-message alim-test-error">
					{testError}
				</div>
			)}

			{!testError && rowsToShow.length > 0 && (
				<div className="alim-test-table">
					<div className="alim-test-message alim-test-ok">
						{mensajeTabla}
					</div>

					<table>
						<thead>
							<tr>
								<th>#</th>
								<th>Dirección</th>
								<th>Valor</th>
							</tr>
						</thead>
						<tbody>
							{rowsToShow.map((r) => (
								<tr key={r.index}>
									<td>{r.index}</td>
									<td>{r.address}</td>
									<td>{r.value}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export default TabConfiguracionAnalizador;
