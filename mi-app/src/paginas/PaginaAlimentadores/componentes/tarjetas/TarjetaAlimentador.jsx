// src/paginas/PaginaAlimentadores/componentes/tarjetas/TarjetaAlimentador.jsx

import React, { useEffect, useRef, useState } from "react";   // React + hooks para estado y refs
import "./TarjetaAlimentador.css";                            // estilos visuales de la tarjeta
import configIcon from "../../../../assets/imagenes/Config_Icon.png"; // icono de configuración (tuerca)
import CajaMedicion from "./CajaMedicion.jsx";                // box individual de medición
import GrupoMedidores from "./GrupoMedidores.jsx";            // grupo de cajas (parte superior/inferior)

// Helper que prepara la estructura de un lado de la tarjeta (sup/inf)
const construirLado = (side, tituloDefault) => {                         // side: config del lado, tituloDefault: texto por defecto
  const cajasPorDefecto = ["R", "S", "T"].map((label) => ({              // arma 3 cajas por defecto (R, S, T)
    etiqueta: label,                                                     // etiqueta visible arriba del box
    valor: "--,--",                                                      // valor inicial cuando no hay lectura
    enabled: false,                                                      // por defecto la caja no está habilitada
    origen: null,                                                        // origen aún no definido (rele/analizador)
  }));

  if (!side) {                                                           // si no hay configuración para este lado...
    return {
      titulo: tituloDefault,                                             // usa el título por defecto
      boxes: cajasPorDefecto,                                           // y las cajas básicas
    };
  }

  const titulo =
    (side.titulo && String(side.titulo).trim()) || tituloDefault;       // toma el título de la config o cae al default

  let boxes = Array.isArray(side.boxes) ? side.boxes : [];              // garantiza que boxes sea un array
  boxes = boxes.slice(0, 4);                                            // máximo 4 cajas por lado

  if (boxes.length === 0) {                                             // si no hay ninguna caja configurada...
    boxes = cajasPorDefecto;                                            // usa las 3 por defecto
  } else {
    boxes = boxes.map((b, idx) => ({
      etiqueta:
        (b?.etiqueta && String(b.etiqueta).trim()) ||                   // etiqueta personalizada si existe
        `Box ${idx + 1}`,                                               // si no, "Box 1", "Box 2", etc.
      valor:
        b?.valor == null || b.valor === ""                              // si no hay valor numérico válido...
          ? "--,--"                                                     // muestra placeholder
          : String(b.valor),                                            // convierte el valor a string
      enabled: !!b?.enabled,                                            // fuerza a booleano (true/false)
      origen: b?.origen || null,                                        // origen de datos o null si no está definido
    }));
  }

  return { titulo, boxes };                                             // devuelve título final y lista de cajas normalizada
};

const TarjetaAlimentador = ({
  nombre,
  color,
  onConfigClick,           // abre modal de configuración del alimentador
  topSide,                 // diseño + valores para la parte superior
  bottomSide,              // diseño + valores para la parte inferior
  draggable = false,       // si la tarjeta se puede arrastrar
  isDragging = false,      // estado visual mientras se arrastra
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,

  // Info de mediciones y periodos
  mideRele = false,
  mideAnalizador = false,
  periodoRele = 60,
  periodoAnalizador = 60,
  timestampInicioRele = null,          // (reservado por si se usan futuras animaciones)
  timestampInicioAnalizador = null,    // idem
  contadorRele = 0,                    // número de lecturas realizadas para relé
  contadorAnalizador = 0,              // número de lecturas realizadas para analizador

  // Play/Stop para polling de lecturas
  estaPolling = false,                 // indica si está activo el polling de lecturas
  puedePolling = false,                // indica si la card tiene config completa para polling
  onPlayStopClick,                     // callback para iniciar/detener polling
  contadorPolling = 0,                 // número de lecturas realizadas durante polling
  periodoPolling = 60,                 // periodo de polling en segundos (para animación)
}) => {
  // Control local de animaciones de borde: solo se activan tras recibir una lectura
  const [mostrarProgresoRele, setMostrarProgresoRele] = useState(false);
  const [mostrarProgresoAnalizador, setMostrarProgresoAnalizador] =
    useState(false);
  const [mostrarProgresoPolling, setMostrarProgresoPolling] = useState(false);
  const ultimoContadorReleRef = useRef(contadorRele);
  const ultimoContadorAnalizadorRef = useRef(contadorAnalizador);
  const ultimoContadorPollingRef = useRef(contadorPolling);

  // Si se cambia de puesto o se detiene la medición de relé, resetea la animación
  useEffect(() => {
    if (!mideRele) {
      setMostrarProgresoRele(false);
      ultimoContadorReleRef.current = contadorRele;
      return;
    }

    if (contadorRele !== ultimoContadorReleRef.current) {
      ultimoContadorReleRef.current = contadorRele;
      setMostrarProgresoRele(contadorRele > 0);
    }
  }, [contadorRele, mideRele]);

  // Idem para el analizador
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

  // Control de animación para polling de lecturas desde BD
  useEffect(() => {
    if (!estaPolling) {
      setMostrarProgresoPolling(false);
      ultimoContadorPollingRef.current = contadorPolling;
      return;
    }

    if (contadorPolling !== ultimoContadorPollingRef.current) {
      ultimoContadorPollingRef.current = contadorPolling;
      setMostrarProgresoPolling(contadorPolling > 0);
    }
  }, [contadorPolling, estaPolling]);

  // Armar lados de la tarjeta con valores por defecto si no hay diseño
  const sup = construirLado(topSide, "CONSUMO (A)");
  const inf = construirLado(bottomSide, "TENSIÓN (kV)");

  // Detectar si algún lado tiene 4 boxes (para ensanchar la tarjeta)
  const maxBoxes = Math.max(sup.boxes.length, inf.boxes.length);
  const isWide = maxBoxes >= 4;

  // Armar clases de la card
  const clasesCard = ["alim-card"];
  if (isWide) clasesCard.push("alim-card-wide");
  if (isDragging) clasesCard.push("alim-card-dragging");

  const renderizarCaja = (box, idx, zona) => (                         // renderiza una CajaMedicion para un lado ("sup"/"inf")
    <CajaMedicion
      key={`${zona}-${idx}`}                                           // key estable por lado e índice
      box={box}                                                        // datos de la caja (etiqueta, valor, enabled, origen)
      indice={idx}                                                     // posición dentro del grupo
      zona={zona}                                                      // identifica si la caja es superior o inferior
      mideRele={mideRele}                                              // indica si hay medición de relé activa
      mideAnalizador={mideAnalizador}                                  // indica si hay medición de analizador activa
      mostrarProgresoRele={mostrarProgresoRele}                        // controla animación de borde del relé
      mostrarProgresoAnalizador={mostrarProgresoAnalizador}            // controla animación de borde del analizador
      periodoRele={periodoRele}                                        // periodo configurado para relé
      periodoAnalizador={periodoAnalizador}                            // periodo configurado para analizador
      contadorRele={contadorRele}                                      // contador de lecturas del relé
      contadorAnalizador={contadorAnalizador}                          // contador de lecturas del analizador
      // Polling de lecturas desde BD
      estaPolling={estaPolling}                                        // indica si hay polling activo
      mostrarProgresoPolling={mostrarProgresoPolling}                  // controla animación de borde del polling
      periodoPolling={periodoPolling}                                  // periodo de polling en segundos
      contadorPolling={contadorPolling}                                // contador de lecturas de polling
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
      {/* Header con nombre y botones de acciones */}
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
            <img src={configIcon} alt="Configurar" className="alim-card-icon" />
          </button>

        </div>

        <span className="alim-card-title">{nombre}</span>

        {/* Botón Play/Stop para polling de lecturas */}
        <button
          type="button"
          className={`alim-card-play-btn ${estaPolling ? "alim-card-play-btn--active" : ""}`}
          onClick={onPlayStopClick}
          disabled={!puedePolling}
          title={
            !puedePolling
              ? "Configuración incompleta: necesita registrador, intervalo y al menos un box habilitado con índice"
              : estaPolling
                ? "Detener polling"
                : "Iniciar polling"
          }
        >
          {estaPolling ? "⏹" : "▶"}
        </button>
      </div>

      {/* Cuerpo con los 2 bloques (superior / inferior) */}
      <div className="alim-card-body">
        {/* ===== PARTE SUPERIOR ===== */}
        <GrupoMedidores
          titulo={sup.titulo}
          boxes={sup.boxes}
          zona="sup"
          renderizarCaja={renderizarCaja}
        />

        {/* ===== PARTE INFERIOR ===== */}
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

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (TarjetaAlimentador.jsx)

 - Este componente representa una tarjeta de alimentador (un registrador) con
   dos bloques de mediciones: parte superior e inferior.

 - `construirLado` se encarga de tomar el diseño y las lecturas de cada lado y
   devolver siempre una estructura consistente `{ titulo, boxes }`, rellenando
   con valores por defecto si falta información.

 - El estado local `mostrarProgresoRele` / `mostrarProgresoAnalizador` se usa
   para decidir si se dibuja la animación de borde en `CajaMedicion`. Solo se
   activa cuando llega al menos una lectura (contador > 0) y se resetea si se
   detiene la medición o se cambia de puesto.

 - `isWide` y las clases `alim-card`, `alim-card-wide`, `alim-card-dragging`
   controlan el layout y el aspecto visual de la tarjeta en función de cuántas
   boxes tiene y si está siendo arrastrada.

 - Toda la lógica de mediciones (periodos, contadores, timestamps) viene desde
   el contexto; esta tarjeta solo la usa para decidir qué mostrar y cómo
   animarlo.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (TarjetaAlimentador.jsx)

0) Visión general del componente

   `TarjetaAlimentador` representa visualmente un alimentador (registrador) en la grilla:

   - Muestra un encabezado con:
       • nombre del alimentador,
       • botón de configuración (tuerca),
       • botón de mapeo (ícono de mapas).

   - En el cuerpo muestra dos bloques de medición:
       • parte superior (`topSide`) → típicamente corrientes (A),
       • parte inferior (`bottomSide`) → típicamente tensiones (kV).

   - Cada bloque está compuesto por cajas (`CajaMedicion`) agrupadas por `GrupoMedidores`,
     y puede tener hasta 4 boxes por fila.

   - Además:
       • puede ser arrastrable (drag & drop) para reordenar tarjetas,
       • reacciona al estado de mediciones (relé / analizador) para animar bordes de progreso.


1) Helper construirLado

   const construirLado = (side, tituloDefault) => { ... }

   - Parámetros:
       • `side`: objeto de configuración del lado (sup/inf) que viene del mapeo.
       • `tituloDefault`: texto por defecto a usar como título si no hay uno configurado.

   - Crea primero un set de cajas por defecto:

     const cajasPorDefecto = ["R", "S", "T"].map((label) => ({
       etiqueta: label,
       valor: "--,--",
       enabled: false,
       origen: null,
     }));

     - Tres cajas con etiquetas “R”, “S” y “T”.

     - Valor inicial `"--,--"` para indicar que aún no hay lectura.

     - `enabled: false` → por defecto no están activas.

     - `origen: null` → todavía no se definió si la lectura viene de relé o analizador.

   - Si `side` no existe:

     if (!side) {
       return {
         titulo: tituloDefault,
         boxes: cajasPorDefecto,
       };
     }

     - Devuelve un lado con:
         • `titulo`: el por defecto,
         • `boxes`: las 3 cajas básicas R/S/T sin lecturas.

   - Si sí hay `side`, se normalizan título y cajas:

     const titulo =
       (side.titulo && String(side.titulo).trim()) || tituloDefault;

     - Usa `side.titulo` si viene definido y no vacío,
     - si no, cae en `tituloDefault`.

     let boxes = Array.isArray(side.boxes) ? side.boxes : [];
     boxes = boxes.slice(0, 4);

     - Garantiza que `boxes` sea un array.

     - Recorta a máximo 4 cajas por lado (límite visual de la tarjeta).

   - Si no hay ninguna caja configurada (`boxes.length === 0`):

     boxes = cajasPorDefecto;

     - Vuelve a usar las 3 cajas R/S T por defecto.

   - Si hay cajas, se mapean y “limpian”:

     boxes = boxes.map((b, idx) => ({
       etiqueta:
         (b?.etiqueta && String(b.etiqueta).trim()) ||
         `Box ${idx + 1}`,
       valor:
         b?.valor == null || b.valor === ""
           ? "--,--"
           : String(b.valor),
       enabled: !!b?.enabled,
       origen: b?.origen || null,
     }));

     - `etiqueta`:
         • usa la etiqueta del mapeo si existe,
         • si no, genera “Box 1”, “Box 2”, etc.

     - `valor`:
         • si no hay valor o está vacío → `"--,--"`,
         • si hay valor → lo convierte a string.

     - `enabled`:
         • fuerza a booleano con `!!b?.enabled` (true/false).

     - `origen`:
         • mantiene el origen declarado (`"rele"` / `"analizador"`),
         • o `null` si no se definió.

   - Al final devuelve siempre un objeto con forma homogénea:

     return { titulo, boxes };

     - Esto asegura que el componente pueda renderizar un lado aunque falten
       partes de la configuración o todavía no haya lecturas.


2) Props del componente principal

   const TarjetaAlimentador = ({
     nombre,
     color,
     onConfigClick,
     onMapClick,
     topSide,
     bottomSide,
     draggable = false,
     isDragging = false,
     onDragStart,
     onDragOver,
     onDrop,
     onDragEnd,
     mideRele = false,
     mideAnalizador = false,
     periodoRele = 60,
     periodoAnalizador = 60,
     timestampInicioRele = null,
     timestampInicioAnalizador = null,
     contadorRele = 0,
     contadorAnalizador = 0,
   }) => { ... }

   - Datos básicos:
       • `nombre`: texto que se muestra en el encabezado de la tarjeta.
       • `color`: color de fondo del header (identifica al alimentador).

   - Acciones de íconos:
       • `onConfigClick()`:
           - abre el modal de configuración del alimentador (IP, registros, etc.).
       • `onMapClick()`:
           - abre el modal de mapeo de mediciones (definir qué se muestra en cada box).

   - Diseño y valores de los lados:
       • `topSide`: config + valores para la parte superior.
       • `bottomSide`: config + valores para la parte inferior.
       • Ambos se pasan a `construirLado` para obtener `{ titulo, boxes }`.

   - Drag & drop:
       • `draggable` (boolean):
           - indica si la tarjeta se puede arrastrar.
       • `isDragging` (boolean):
           - indica si esta tarjeta es la que está en arrastre (para estilo visual).
       • `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`:
           - callbacks que se conectan con el hook de drag & drop
             (`usarArrastrarSoltar`), usados por la vista.

   - Información de mediciones:
       • `mideRele`, `mideAnalizador`:
           - true/false según si hay medición activa de cada equipo.
       • `periodoRele`, `periodoAnalizador`:
           - período de actualización en segundos (se usa en la animación).
       • `timestampInicioRele`, `timestampInicioAnalizador`:
           - reservados por si se quiere sincronizar animaciones en el futuro.
       • `contadorRele`, `contadorAnalizador`:
           - cuántas lecturas se realizaron desde que se inició la medición.


3) Estado local y refs para animaciones

   const [mostrarProgresoRele, setMostrarProgresoRele] = useState(false);
   const [mostrarProgresoAnalizador, setMostrarProgresoAnalizador] = useState(false);

   - Controlan si se debe mostrar la animación de borde de progreso en las cajas:
       • para el relé (`mostrarProgresoRele`),
       • para el analizador (`mostrarProgresoAnalizador`).

   - Empiezan en `false` porque inicialmente no hay lecturas.

   const ultimoContadorReleRef = useRef(contadorRele);
   const ultimoContadorAnalizadorRef = useRef(contadorAnalizador);

   - Guardan el último valor de `contadorRele` / `contadorAnalizador` sin
     provocar re-renders (porque son refs).

   - Sirven para detectar si el contador cambió (es decir, si llegó una lectura nueva).


4) useEffect para relé

   useEffect(() => {
     if (!mideRele) {
       setMostrarProgresoRele(false);
       ultimoContadorReleRef.current = contadorRele;
       return;
     }

     if (contadorRele !== ultimoContadorReleRef.current) {
       ultimoContadorReleRef.current = contadorRele;
       setMostrarProgresoRele(contadorRele > 0);
     }
   }, [contadorRele, mideRele]);

   - Dependencias:
       • `contadorRele`,
       • `mideRele`.

   - Si `mideRele` es false:
       • la medición está apagada,
       • apaga la animación (`setMostrarProgresoRele(false)`),
       • sincroniza la ref con el contador actual.

   - Si `mideRele` es true y el contador cambió:
       • actualiza la ref (`ultimoContadorReleRef.current = contadorRele`),
       • vuelve a evaluar `setMostrarProgresoRele(contadorRele > 0)`:
           - si ya hubo al menos una lectura (`> 0`), deja la animación encendida.

   - En resumen:
       • cuando se inicia o avanza una medición de relé, la animación se activa,
       • cuando se detiene, se apaga y se resetea el seguimiento.


5) useEffect para analizador

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

   - Mismo patrón que el del relé, pero aplicado al analizador.

   - Permite tener animaciones independientes:
       • puede estar midiendo solo relé, solo analizador o ambos.


6) Preparación de los lados y ancho de la tarjeta

   const sup = construirLado(topSide, "CONSUMO (A)");
   const inf = construirLado(bottomSide, "TENSIÓN (kV)");

   - `sup` y `inf` quedan con forma:
       • `{ titulo: string, boxes: Array<...> }`
   - Títulos por defecto:
       • “CONSUMO (A)” para la parte superior,
       • “TENSIÓN (kV)” para la inferior.

   const maxBoxes = Math.max(sup.boxes.length, inf.boxes.length);
   const isWide = maxBoxes >= 4;

   - Calcula cuántas cajas tiene el lado más poblado.
	
   - Si tiene 4 o más, marca la tarjeta como “ancha” (`isWide = true`) para ensancharla.

   const clasesCard = ["alim-card"];
   if (isWide) clasesCard.push("alim-card-wide");
   if (isDragging) clasesCard.push("alim-card-dragging");

   - Construye un array de clases CSS:
       • siempre incluye `"alim-card"`,
       • agrega `"alim-card-wide"` si la tarjeta debe ser más ancha,
       • agrega `"alim-card-dragging"` si está siendo arrastrada (para cambiar estilo
         durante el drag & drop).


7) Helper renderizarCaja

   const renderizarCaja = (box, idx, zona) => (
     <CajaMedicion
       key={`${zona}-${idx}`}
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

   - Función de ayuda que devuelve una `CajaMedicion` correctamente parametrizada.

   - Parámetros:
       • `box`: objeto con la información de la caja (etiqueta, valor, enabled, origen),
       • `idx`: índice dentro del grupo,
       • `zona`: "sup" o "inf" (parte superior o inferior).

   - Props importantes que se pasan a `CajaMedicion`:
       • `mideRele` / `mideAnalizador` → para saber qué equipos están activos.
       • `mostrarProgresoRele` / `mostrarProgresoAnalizador` → para animar bordes.
       • `periodoRele` / `periodoAnalizador` → para sincronizar la animación con el período.
       • `contadorRele` / `contadorAnalizador` → para detectar nuevos ciclos.


8) JSX principal (estructura de la tarjeta)

   // Contenedor principal de la tarjeta (card)
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
       // Header con nombre y botones de acciones
       <div
         className="alim-card-header"
         style={{ backgroundColor: color || "#0ea5e9" }}
       >
         <div className="alim-card-icons">
           <button ... onClick={onConfigClick}> [icono tuerca] </button>
           <button ... onClick={onMapClick}>   [icono mapeo]  </button>
         </div>

         <span className="alim-card-title">{nombre}</span>
       </div>

       // Cuerpo con los 2 bloques (superior / inferior)
       <div className="alim-card-body">
         <GrupoMedidores
           titulo={sup.titulo}
           boxes={sup.boxes}
           zona="sup"
           renderizarCaja={renderizarCaja}
         />

         <GrupoMedidores
           titulo={inf.titulo}
           boxes={inf.boxes}
           zona="inf"
           renderizarCaja={renderizarCaja}
         />
       </div>
     </div>
   );

   - Contenedor `<div className={clasesCard.join(" ")} ...>`:
       • envuelve toda la tarjeta,
       • `cursor: "grab"` si es arrastrable,
       • atributos `draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`
         conectan la tarjeta con la lógica de drag & drop.

   - Header:
       • fondo con `color` del alimentador (o celeste por defecto),
       • botones de:
           - configuración (`onConfigClick`),
           - mapeo (`onMapClick`),
       • título con el nombre del alimentador.

   - Cuerpo:
       • dos `GrupoMedidores`, uno para la parte superior (“sup”) y otro para
         la inferior (“inf”),
       • cada grupo recibe:
           - título,
           - lista de `boxes`,
           - función `renderizarCaja` para generar cada `CajaMedicion`.


9) Export

   export default TarjetaAlimentador;

   - Permite usar esta tarjeta dentro de `GrillaTarjetas` para construir la vista
     completa de alimentadores.

---------------------------------------------------------------------------*/
