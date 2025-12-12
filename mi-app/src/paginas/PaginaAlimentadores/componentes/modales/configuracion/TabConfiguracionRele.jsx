// src/paginas/PaginaAlimentadores/componentes/modales/configuracion/TabConfiguracionRele.jsx

import React from "react";                                   
import "./TabConfiguracion.css";                             // estilos compartidos entre las tabs de configuración

// Tab de configuración del RELÉ:
// formulario de conexión Modbus + período + botones de test y medición.
const TabConfiguracionRele = ({
	config,                                                   // { ip, puerto, indiceInicial, cantRegistros }
	periodoSegundos,                                          // período de actualización en segundos
	onChange,                                                 // cambia campos de `config`
	onChangePeriodo,                                          // cambia el período general de lectura
	onTestConexion,                                           // callback para probar la conexión puntual
	isTesting,                                                // flag mientras se ejecuta el test
	testError,                                                // mensaje de error del test (si falla)
	testRows,                                                 // registros obtenidos en el test
	testTiempoMs,                                             // tiempo de respuesta del test en ms
	isMeasuring,                                              // si el relé está midiendo en forma continua
	onToggleMedicion,                                         // arranca/detiene medición continua
	registrosMedicion,                                        // registros en vivo (lecturas periódicas)
	disabled,                                                 // deshabilita inputs cuando ya se está midiendo
}) => {
	// Si hay medición en curso y registros en vivo, se muestran esos;
	// si no, se muestran los registros del último test de conexión.
	const rowsToShow =
		isMeasuring && registrosMedicion && registrosMedicion.length > 0
			? registrosMedicion
			: testRows;

	// Construir mensaje según el estado
	const esCacheado = testRows.length === 1 && testRows[0]?.address === '-';
	const tiempoInfo = testTiempoMs != null ? ` (${testTiempoMs}ms)` : '';

	let mensajeTabla;
	if (isMeasuring && registrosMedicion && registrosMedicion.length > 0) {
		mensajeTabla = `Medición en curso. Registros en vivo: ${registrosMedicion.length}`;
	} else if (esCacheado) {
		mensajeTabla = `Conexión verificada. Esperá 60s para volver a testear.`;
	} else {
		mensajeTabla = `Conexión exitosa${tiempoInfo}. Registros leídos: ${testRows.length}`;
	}

	return (
		<div className="alim-modal-grid">
			<label className="alim-field">
				<span className="alim-field-label">Dirección IP</span>
				<input
					type="text"
					className="alim-field-input"
					value={config.ip}
					onChange={(e) => onChange("ip", e.target.value)} // actualiza IP del relé
					placeholder="Ej: 172.16.0.1"
					disabled={disabled}
				/>
			</label>

			<label className="alim-field">
				<span className="alim-field-label">Puerto</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.puerto ?? ""}
					onChange={(e) => onChange("puerto", e.target.value)} // puerto Modbus (ej. 502)
					placeholder="Ej: 502"
					disabled={disabled}
				/>
			</label>

			<label className="alim-field">
				<span className="alim-field-label">Índice inicial</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.indiceInicial ?? ""}
					onChange={(e) => onChange("indiceInicial", e.target.value)} // primer registro a leer
					placeholder="Ej: 137"
					disabled={disabled}
				/>
			</label>

			<label className="alim-field">
				<span className="alim-field-label">Cant. registros</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.cantRegistros ?? ""}
					onChange={(e) => onChange("cantRegistros", e.target.value)} // cuántos registros seguidos leer
					placeholder="Ej: 20"
					disabled={disabled}
				/>
			</label>

			<label className="alim-field">
				<span className="alim-field-label">Período actualización (s)</span>
				<input
					type="number"
					className="alim-field-input"
					value={periodoSegundos}
					onChange={(e) => onChangePeriodo(e.target.value)} // período de muestreo para el relé
					placeholder="Ej: 60"
					min={1}
					disabled={disabled}
				/>
			</label>

			{periodoSegundos &&
				Number(periodoSegundos) > 0 &&
				Number(periodoSegundos) < 60 && (
					<p className="alim-warning">
						⚠ Atención: periodos menores a 60&nbsp;s pueden recargar el sistema
						y la red de comunicaciones.
					</p>
				)}

			{/* Botones de test y medición */}
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
						isTesting || !config.ip.trim() || !config.puerto // bloqueo si faltan datos básicos
					}
				>
					{isMeasuring ? "Detener medición" : "Iniciar medición"}
				</button>
			</div>

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

export default TabConfiguracionRele;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (TabConfiguracionRele.jsx)

 - Esta tab es el "panel de red" del relé: acá defino cómo conectarme por
   Modbus (IP, puerto, índice inicial y cantidad de registros), además del
   período de actualización para las lecturas periódicas.

 - La UI tiene dos flujos bien separados:
     * Botón "Test conexión": hace una lectura puntual para verificar
       conectividad y muestra los resultados en `testRows`.
     * Botón "Iniciar/Detener medición": le pide al padre que arranque o
       pare las lecturas periódicas, y mientras tanto muestra
       `registrosMedicion` como tabla en vivo.

 - `rowsToShow` y `mensajeTabla` se encargan de decidir si la tabla está
   mostrando el último test o las lecturas continuas, sin que el resto del
   componente tenga que preocuparse por esa diferencia.

 - Se bloquean inputs y algunos botones cuando `disabled` o `isTesting`
   están activos, para evitar cambios mientras el relé está midiendo o se
   está haciendo un test.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (TabConfiguracionRele.jsx)

0) Visión general del componente

   `TabConfiguracionRele` es la pestaña dedicada al relé dentro del modal de
   configuración del alimentador.

   Desde acá se define:
   - cómo conectarse al relé por Modbus (IP, puerto, índice inicial, cantidad),
   - cada cuánto tiempo se van a leer los registros (período en segundos),
   - y se pueden hacer:
       • pruebas puntuales de lectura (botón "Test conexión"),
       • o iniciar/detener una medición continua (botón "Iniciar/Detener medición").

   No guarda estado propio; todo el estado se maneja en el modal padre
   (`ModalConfiguracionAlimentador`). Esta tab solo:
   - muestra los campos,
   - dispara callbacks cuando el usuario cambia algo,
   - y decide qué tabla mostrar (test puntual o medición en vivo).


1) Props del componente

   const TabConfiguracionRele = ({
     config,
     periodoSegundos,
     onChange,
     onChangePeriodo,
     onTestConexion,
     isTesting,
     testError,
     testRows,
     isMeasuring,
     onToggleMedicion,
     registrosMedicion,
     disabled,
   }) => { ... }

   - `config`:
       • objeto con la configuración del relé:
         {
           ip,
           puerto,
           indiceInicial,
           cantRegistros,
         }
       • todos los campos suelen venir como strings (se parsean más arriba).

   - `periodoSegundos`:
       • período de actualización de las lecturas periódicas (en segundos),
       • se usa tanto para mostrarlo en el input como para la advertencia de
         periodos muy cortos.

   - `onChange(campo, valor)`:
       • callback que actualiza campos de `config` en el padre,
       • se llama desde los inputs de IP, puerto, índice inicial y cantidad.

   - `onChangePeriodo(valor)`:
       • callback específico para modificar el período de actualización.

   - `onTestConexion()`:
       • se ejecuta cuando el usuario pulsa "Test conexión",
       • el padre se encarga de llamar a `leerRegistrosModbus` y de rellenar
         `testRows` o `testError`.

   - `isTesting` (boolean):
       • indica si un test de conexión está en curso,
       • se usa para deshabilitar el botón de test y mostrar "Probando...".

   - `testError` (string):
       • mensaje de error si el test falló (IP inválida, sin respuesta, etc.).

   - `testRows` (array):
       • registros obtenidos en el último test exitoso,
       • se muestran en la tabla cuando no hay medición continua.

   - `isMeasuring` (boolean):
       • indica si hay una medición periódica en curso para el relé,
       • cambia el texto del botón ("Iniciar" ↔ "Detener")
         y la clase de estilo (color de stop vs. secundario).

   - `onToggleMedicion()`:
       • callback que pide al padre arrancar o detener la medición continua,
       • el padre decide si usa overrides, timers, etc.

   - `registrosMedicion` (array):
       • registros leídos periódicamente mientras la medición está activa,
       • si hay datos aquí, tienen prioridad visual sobre `testRows`.

   - `disabled` (boolean):
       • cuando es true, deshabilita los inputs de la parte de conexión,
       • típicamente se usa cuando el relé ya está midiendo para evitar
         cambios mientras hay una medición activa.


2) Selección de filas a mostrar: `rowsToShow` y `mensajeTabla`

   const rowsToShow =
     isMeasuring && registrosMedicion && registrosMedicion.length > 0
       ? registrosMedicion
       : testRows;

   const mensajeTabla =
     isMeasuring && registrosMedicion && registrosMedicion.length > 0
       ? `Medición en curso. Registros en vivo: ${registrosMedicion.length}`
       : `Test correcto. Registros leídos: ${testRows.length}`;

   - Regla general:
       • si hay medición continua y llegaron registros en vivo
         (`registrosMedicion.length > 0`), la tabla muestra esos registros;
       • en caso contrario, se muestran los resultados del último test.

   - `rowsToShow`:
       • es el array que se recorre para dibujar la tabla,
       • es una abstracción para que el resto del JSX no tenga que hacer
         ifs entre "test" y "medición en vivo".

   - `mensajeTabla`:
       • texto informativo encima de la tabla,
       • en modo medición: "Medición en curso...",
       • en modo test: "Test correcto. Registros leídos...".

   De esta manera, la lógica de qué se ve en pantalla depende únicamente del
   estado `isMeasuring` + contenido de `registrosMedicion` y `testRows`.


3) Campos de conexión Modbus

   - Dirección IP

     <input
       type="text"
       className="alim-field-input"
       value={config.ip}
       onChange={(e) => onChange("ip", e.target.value)}
       placeholder="Ej: 172.16.0.1"
       disabled={disabled}
     />

     • Campo de texto simple para la IP del relé.
     • `onChange` notifica al padre el nuevo valor.
     • `disabled` evita cambios cuando se considera que no debería editarse
       (por ejemplo, si ya hay medición continua activa).

   - Puerto

     <input
       type="number"
       className="alim-field-input"
       value={config.puerto}
       onChange={(e) => onChange("puerto", e.target.value)}
       placeholder="Ej: 502"
       disabled={disabled}
     />

     • Puerto TCP para Modbus (el típico es 502, pero se deja configurable).
     • Se maneja como string en el input y se convierte a número en niveles
       superiores.

   - Índice inicial

     <input
       type="number"
       className="alim-field-input"
       value={config.indiceInicial}
       onChange={(e) => onChange("indiceInicial", e.target.value)}
       placeholder="Ej: 137"
       disabled={disabled}
     />

     • Primer registro Modbus a leer.
     • Permite definir dónde empieza el bloque de lecturas.

   - Cant. registros

     <input
       type="number"
       className="alim-field-input"
       value={config.cantRegistros}
       onChange={(e) => onChange("cantRegistros", e.target.value)}
       placeholder="Ej: 20"
       disabled={disabled}
     />

     • Cantidad de registros consecutivos a leer a partir del índice inicial.
     • Se usa tanto en el test de conexión como en la medición periódica.


4) Período de actualización y advertencia

   <input
     type="number"
     className="alim-field-input"
     value={periodoSegundos}
     onChange={(e) => onChangePeriodo(e.target.value)}
     placeholder="Ej: 60"
     min={1}
     disabled={disabled}
   />

   - Define cada cuántos segundos se hacen las lecturas periódicas del relé.
   - `onChangePeriodo` permite que el padre actualice este valor.

   Advertencia para periodos cortos:

   {periodoSegundos &&
    Number(periodoSegundos) > 0 &&
    Number(periodoSegundos) < 60 && (
      <p className="alim-warning">
        ⚠ Atención: periodos menores a 60 s pueden recargar el sistema
        y la red de comunicaciones.
      </p>
    )}

   - Si el período es menor a 60 segundos, se muestra un mensaje de alerta.
   - El objetivo es recordar que lecturas muy frecuentes pueden:
       • sobrecargar el backend,
       • y generar más tráfico en la red de comunicaciones.


5) Botones de test y de medición continua

   - Botón "Test conexión"

     <button
       type="button"
       className="alim-test-btn"
       onClick={onTestConexion}
       disabled={isTesting}
     >
       {isTesting ? "Probando..." : "Test conexión"}
     </button>

     • Ejecuta `onTestConexion` cuando se hace clic.
     • Mientras `isTesting` es true:
         - el botón se deshabilita,
         - y el texto cambia a "Probando...".
     • El resultado se refleja en `testRows` (éxito) o `testError` (fallo).

   - Botón "Iniciar/Detener medición"

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
         isTesting || !config.ip.trim() || !config.puerto
       }
     >
       {isMeasuring ? "Detener medición" : "Iniciar medición"}
     </button>

     • Cambia la clase CSS según `isMeasuring`:
         - en stop → estilo de "botón de paro",
         - en start → estilo secundario.
     • Deshabilita el botón si:
         - hay un test en curso (`isTesting`),
         - falta IP o puerto (config incompleta).
     • `onToggleMedicion` le pide al padre que:
         - arranque la medición (si no estaba midiendo),
         - o la detenga (si ya estaba activa).


6) Mensajes de error y tabla de resultados

   - Mensaje de error

     {testError && (
       <div className="alim-test-message alim-test-error">
         {testError}
       </div>
     )}

     • Si `testError` tiene contenido, se muestra un bloque de error.
     • Típicamente usado para:
         - IP inalcanzable,
         - error en la respuesta del backend,
         - parámetros inválidos.

   - Tabla de registros

     {(!testError && rowsToShow.length > 0) && (
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

     • La tabla solo aparece si:
         - no hay `testError`,
         - y `rowsToShow` tiene al menos un registro.

     • Columnas:
         - `#`         → índice interno de la fila (r.index),
         - `Dirección` → dirección Modbus efectiva (r.address),
         - `Valor`     → valor leído del registro (r.value).

     • Como `rowsToShow` ya resuelve si mostrar test o medición continua,
       la tabla no necesita saber de dónde vienen exactamente esos datos.


7) Resumen de responsabilidades

   - Lo que hace `TabConfiguracionRele`:
       • dibuja inputs de IP/puerto/índices,
       • permite ajustar el período,
       • ofrece botones para test y medición continua,
       • y muestra resultados (error o tabla de registros).

   - Lo que NO hace (lo delega al padre):
       • llamar efectivamente a Modbus / backend,
       • arrancar y mantener timers de medición,
       • convertir valores a números definitivos,
       • guardar la configuración de forma persistente.

   Pensarlo como "la cara" del relé en el modal de configuración: concentra
   la interfaz de usuario, mientras que la lógica de negocio y de comunicación
   vive en componentes y hooks superiores.

---------------------------------------------------------------------------*/
