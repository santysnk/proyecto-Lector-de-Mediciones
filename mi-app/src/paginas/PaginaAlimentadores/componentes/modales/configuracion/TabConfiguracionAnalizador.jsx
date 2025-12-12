// src/paginas/PaginaAlimentadores/componentes/modales/configuracion/TabConfiguracionAnalizador.jsx

import React from "react";              
import "./TabConfiguracion.css";        // estilos compartidos con la pestaña del relé

// Tab de configuración del ANALIZADOR:
// formulario de conexión Modbus + período + botones de test y medición.
const TabConfiguracionAnalizador = ({
	config,                               // { ip, puerto, indiceInicial, cantRegistros, periodoSegundos }
	onChange,                             // callback genérico para cambiar campos de `config`
	onTestConexion,                       // prueba puntual de lectura
	isTesting,                            // flag mientras se ejecuta el test
	testError,                            // mensaje de error del test
	testRows,                             // registros obtenidos en el test
	testTiempoMs,                         // tiempo de respuesta del test en ms
	isMeasuring,                          // si el analizador está midiendo en forma continua
	onToggleMedicion,                     // arranca/detiene la medición continua
	registrosMedicion,                    // registros en vivo de la medición
	disabled,                             // deshabilita inputs cuando no se debe editar
}) => {
	const rowsToShow =
		isMeasuring && registrosMedicion && registrosMedicion.length > 0
			? registrosMedicion
			: testRows;                    // si hay medición en curso, priorizo los registros en vivo

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
					onChange={(e) => onChange("ip", e.target.value)} // IP del analizador
					placeholder="Ej: 172.16.0.5"
					disabled={disabled}
				/>
			</label>

			<label className="alim-field">
				<span className="alim-field-label">Puerto</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.puerto ?? ""}
					onChange={(e) => onChange("puerto", e.target.value)} // puerto Modbus (típicamente 502)
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
				<span className="alim-field-label">
					Período actualización (s)
				</span>
				<input
					type="number"
					className="alim-field-input"
					value={config.periodoSegundos}
					onChange={(e) =>
						onChange("periodoSegundos", e.target.value)
					} // período de muestreo propio del analizador
					placeholder="Ej: 60"
					min={1}
					disabled={disabled}
				/>
			</label>

			{config.periodoSegundos &&
				Number(config.periodoSegundos) > 0 &&
				Number(config.periodoSegundos) < 60 && (
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

export default TabConfiguracionAnalizador;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (TabConfiguracionAnalizador.jsx)

 - Esta pestaña es casi gemela de `TabConfiguracionRele`, pero dedicada al
   analizador de redes. Cambia solo la etiqueta de los campos y el hecho de
   que el período se toma de `config.periodoSegundos`.

 - La tabla inferior puede mostrar:
     * los resultados de un "Test conexión" (lectura puntual), o
     * los registros en vivo cuando la medición continua está activa.

 - Igual que en el relé, el componente no hace requests por sí mismo: delega
   todo a los callbacks `onTestConexion` y `onToggleMedicion`, y sólo muestra
   el resultado que llega por props (`testRows` / `registrosMedicion`).
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (TabConfiguracionAnalizador.jsx)

0) Visión general del componente

   `TabConfiguracionAnalizador` es la pestaña dedicada al analizador de redes
   dentro del modal de configuración del alimentador.

   Desde acá se define:
   - cómo conectarse al analizador por Modbus (IP, puerto, índice inicial, cantidad),
   - cada cuánto tiempo se van a leer los registros (período propio del analizador),
   - y se pueden hacer:
       • pruebas puntuales de lectura (botón "Test conexión"),
       • o iniciar/detener una medición continua (botón "Iniciar/Detener medición").

   Es muy similar a `TabConfiguracionRele`, pero:
   - el período viene desde `config.periodoSegundos`,
   - y la configuración afecta específicamente al analizador.


1) Props del componente

   const TabConfiguracionAnalizador = ({
     config,
     onChange,
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
       • objeto con los parámetros de conexión del analizador:
         {
           ip,
           puerto,
           indiceInicial,
           cantRegistros,
           periodoSegundos,
         }
       • todos estos campos se editan como strings en los inputs.

   - `onChange(campo, valor)`:
       • callback genérico para actualizar cualquier propiedad de `config`,
       • se usa en todos los inputs (IP, puerto, índices, período).

   - `onTestConexion()`:
       • dispara el flujo de prueba puntual de lectura,
       • el padre se encarga de hacer la llamada real (backend / Modbus) y
         llenar `testRows` o `testError`.

   - `isTesting` (boolean):
       • indica que un test de conexión está en curso,
       • se usa para deshabilitar el botón de test y mostrar "Probando...".

   - `testError` (string):
       • mensaje de error cuando el test de conexión falla.

   - `testRows` (array):
       • registros obtenidos en el último test exitoso,
       • se muestran en la tabla cuando no hay medición continua.

   - `isMeasuring` (boolean):
       • indica si hay medición periódica activa para el analizador.

   - `onToggleMedicion()`:
       • pide al padre que arranque o detenga la medición continua.

   - `registrosMedicion` (array):
       • registros leídos periódicamente durante la medición en curso.

   - `disabled` (boolean):
       • cuando es true, bloquea los inputs de la parte superior,
       • sirve para evitar cambios mientras el analizador está midiendo,
         o cuando se quiera forzar una configuración fija.


2) Selección de filas y mensaje de tabla

   const rowsToShow =
     isMeasuring && registrosMedicion && registrosMedicion.length > 0
       ? registrosMedicion
       : testRows;

   const mensajeTabla =
     isMeasuring && registrosMedicion && registrosMedicion.length > 0
       ? `Medición en curso. Registros en vivo: ${registrosMedicion.length}`
       : `Test correcto. Registros leídos: ${testRows.length}`;

   - Regla:
       • si hay medición continua y ya llegaron registros de esa medición,
         la tabla muestra `registrosMedicion`,
       • en caso contrario, usa los registros del último test (`testRows`).

   - `rowsToShow`:
       • es el array que recorre la tabla,
       • encapsula la lógica de “qué datos toca mostrar”.

   - `mensajeTabla`:
       • texto informativo que se ve encima de la tabla,
       • cambia según esté mostrando medición en vivo o test puntual.


3) Campos de conexión Modbus del analizador

   - Dirección IP

     <input
       type="text"
       className="alim-field-input"
       value={config.ip}
       onChange={(e) => onChange("ip", e.target.value)}
       placeholder="Ej: 172.16.0.5"
       disabled={disabled}
     />

     • IP del analizador de redes.
     • `onChange` delega al padre la actualización del campo.

   - Puerto

     <input
       type="number"
       className="alim-field-input"
       value={config.puerto}
       onChange={(e) => onChange("puerto", e.target.value)}
       placeholder="Ej: 502"
       disabled={disabled}
     />

     • Puerto Modbus TCP (normalmente 502, pero configurable).

   - Índice inicial

     <input
       type="number"
       className="alim-field-input"
       value={config.indiceInicial}
       onChange={(e) => onChange("indiceInicial", e.target.value)}
       placeholder="Ej: 200"
       disabled={disabled}
     />

     • Primer registro Modbus que se va a leer desde el analizador.

   - Cantidad de registros

     <input
       type="number"
       className="alim-field-input"
       value={config.cantRegistros}
       onChange={(e) => onChange("cantRegistros", e.target.value)}
       placeholder="Ej: 10"
       disabled={disabled}
     />

     • Cantidad de registros consecutivos a leer a partir del índice inicial.


4) Período de actualización del analizador

   <input
     type="number"
     className="alim-field-input"
     value={config.periodoSegundos}
     onChange={(e) => onChange("periodoSegundos", e.target.value)}
     placeholder="Ej: 60"
     min={1}
     disabled={disabled}
   />

   - Define el período de actualización propio del analizador (en segundos).
   - A diferencia del relé, el período viene directamente dentro de `config`.

   Advertencia para periodos cortos:

   {config.periodoSegundos &&
    Number(config.periodoSegundos) > 0 &&
    Number(config.periodoSegundos) < 60 && (
      <p className="alim-warning">
        ⚠ Atención: periodos menores a 60 s pueden recargar el sistema
        y la red de comunicaciones.
      </p>
    )}

   - Si el período es mayor que 0 y menor que 60, se muestra el mensaje de alerta.
   - Mismo criterio que en el relé: recuerda el impacto de muestrear demasiado rápido.


5) Botones de test y medición continua

   - Botón "Test conexión"

     <button
       type="button"
       className="alim-test-btn"
       onClick={onTestConexion}
       disabled={isTesting}
     >
       {isTesting ? "Probando..." : "Test conexión"}
     </button>

     • Ejecuta `onTestConexion` para hacer una lectura puntual.
     • Si `isTesting` es true:
         - el botón se deshabilita,
         - y el texto cambia a "Probando...".

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

     • Cambia de estilo según el estado:
         - en medición → clase de stop,
         - en reposo → clase secundaria.
     • Se deshabilita si:
         - hay un test en curso (`isTesting`),
         - falta IP o puerto (config incompleta).
     • `onToggleMedicion` le pide al padre arrancar o cortar la medición continua.


6) Mensajes de error y tabla de resultados

   - Mensaje de error

     {testError && (
       <div className="alim-test-message alim-test-error">
         {testError}
       </div>
     )}

     • Si el test falló, se muestra este bloque con el mensaje recibido.

   - Tabla de registros

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

     • Igual que en la pestaña del relé:
         - si no hay error y hay registros, se muestra la tabla,
         - `rowsToShow` ya decide si son datos de test o de medición en vivo.


7) Diferencias clave respecto a TabConfiguracionRele

   - Ambas pestañas comparten el mismo patrón visual y de flujo:
       • definir parámetros Modbus,
       • testear,
       • iniciar/detener medición continua,
       • mostrar tabla de registros.

   - Las diferencias principales son:
       • en el analizador, el período se toma de `config.periodoSegundos`,
         no de una prop separada;
       • las etiquetas/ejemplos de placeholders están pensados para el
         equipo analizador (por ejemplo, otro rango de índices).

   Podés pensar esta pestaña como "la cara del analizador" en el mismo panel
   donde la pestaña hermana representa "la cara del relé".

---------------------------------------------------------------------------*/
