// src/paginas/PaginaAlimentadores/PaginaAlimentadores.jsx
import React from "react"; 

// provider con estado y lógica de puestos/mediciones/alimentadores
import { ProveedorAlimentadores } from "./contexto/ContextoAlimentadores"; 

// layout principal del panel de alimentadores
import VistaAlimentadores from "./componentes/layout/VistaAlimentadores.jsx"; 

const PaginaAlimentadores = () => {       // página principal del panel de alimentadores
  return (
    <ProveedorAlimentadores>              {/* provee contexto de alimentadores (datos y lógica) */}
      <VistaAlimentadores />              {/* construye toda la interfaz visible */}
    </ProveedorAlimentadores>
  );
};

export default PaginaAlimentadores; // se usa en App.jsx como ruta "/alimentadores"

{/*---------------------------------------------------------------------------
 NOTA PERSONAL SOBRE ESTE ARCHIVO (PaginaAlimentadores.jsx)

 - Es una "página contenedora": no tiene lógica propia, solo envuelve la vista
   principal de alimentadores dentro del ContextoAlimentadores.

 - Podés imaginar `ProveedorAlimentadores` como la sala de máquinas del sistema:
   ahí viven los datos (puestos, alimentadores, mediciones en vivo) y las
   funciones que los operan; todo eso se comparte por context con los hijos.

 - `VistaAlimentadores` es el tablero de control que ve el operador: usando el
   contexto arma la IU completa (barra superior, menú lateral, grilla de
   tarjetas, modales de configuración/mapeo y drag & drop).

 - La línea `<ProveedorAlimentadores> ... </ProveedorAlimentadores>` envuelve a
   `<VistaAlimentadores />` para que todos los componentes internos puedan usar
   `usarContextoAlimentadores()` sin pasar props manualmente por cada nivel.

 - Si algún día necesito otra pantalla basada en los mismos datos (por ejemplo,
   un dashboard resumido), puedo reutilizar el mismo provider y montar otra
   vista distinta adentro sin tocar cómo se guardan o calculan los estados, 
	por ejemplo:
		
	<ProveedorAlimentadores>
	  <OtraVista  />
	</ProveedorAlimentadores>
	
	y OtraVista tendría acceso a los mismos datos/funciones.
-------------------------------------------------------------------------------
*/}

