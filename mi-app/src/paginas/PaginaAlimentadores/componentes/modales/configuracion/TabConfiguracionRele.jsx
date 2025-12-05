import React from "react";
import "./TabConfiguracion.css";

/**
 * ==============================================================================
 * SUBCOMPONENTE: TabConfiguracionRele
 * ==============================================================================
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * Es el panel para configurar la conexión con el RELÉ.
 * Permite:
 * 1. Escribir la IP, Puerto y qué registros leer.
 * 2. Probar si la conexión funciona (Test).
 * 3. Ver los datos en vivo si la medición está activa.
 * 
 * ¿CÓMO FUNCIONA?
 * Muestra un formulario con los campos necesarios.
 * Si se hace un test o se activa la medición, muestra una tabla con los resultados.
 */

const TabConfiguracionRele = ({
	config, 			// Objeto con { ip, puerto, indiceInicial, cantRegistros }
	periodoSegundos, 	// Cada cuánto leer
	onChange, 			// Función para actualizar campos individuales
	onChangePeriodo, 	// Función para actualizar el periodo
	onTestConexion, 	// Función para ejecutar la prueba
	isTesting, 			// ¿Se está probando ahora mismo?
	testError, 			// Mensaje de error si falló la prueba
	testRows, 			// Datos recibidos en la prueba
	isMeasuring, 		// ¿Está midiendo en tiempo real?
	onToggleMedicion, 	// Función para iniciar/detener medición
	registrosMedicion, 	// Datos en vivo (si está midiendo)
	disabled, 			// Si el formulario debe estar bloqueado
}) => {

	// Decidimos qué datos mostrar en la tabla:
	// - Si está midiendo en vivo, mostramos los datos reales.
	// - Si no, mostramos los datos de la última prueba (test).
	const rowsToShow =
		isMeasuring && registrosMedicion && registrosMedicion.length > 0
			? registrosMedicion
			: testRows;

	// Mensaje de estado sobre la tabla
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
					placeholder="Ej: 172.16.0.1"
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
					placeholder="Ej: 137"
					disabled={disabled}
					title="Número del primer registro Modbus a leer"
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
					placeholder="Ej: 20"
					disabled={disabled}
					title="Cuántos registros consecutivos leer"
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
					value={periodoSegundos}
					onChange={(e) => onChangePeriodo(e.target.value)}
					placeholder="Ej: 60"
					min={1}
					disabled={disabled}
				/>
			</label>

			{/* Advertencia si el periodo es muy corto */}
			{periodoSegundos &&
				Number(periodoSegundos) > 0 &&
				Number(periodoSegundos) < 60 && (
					<p className="alim-warning">
						⚠️ Periodos menores a 60&nbsp;s pueden recargar el sistema
						y la red de comunicaciones.
					</p>
				)}

			{/* BOTONES DE ACCIÓN (Test y Medición) */}
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
							? " alim-test-btn-stop" // Rojo si está midiendo
							: " alim-test-btn-secondary") // Gris si está parado
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

			{/* MENSAJE DE ERROR (Si falla el test) */}
			{testError && (
				<div className="alim-test-message alim-test-error">
					{testError}
				</div>
			)}

			{/* TABLA DE RESULTADOS (Si hay datos para mostrar) */}
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

export default TabConfiguracionRele;
