// src/main.jsx
import React from "react";                         // librería principal de React para componentes
import ReactDOM from "react-dom/client";           // API moderna de renderizado en el navegador
import { BrowserRouter } from "react-router-dom";  // enrutador basado en historial del navegador
import { AuthProvider } from "./contextos/AuthContext"; // contexto de autenticación con Supabase
import App from "./App.jsx";                       // componente raíz de la aplicación (define las rutas)
import "./index.css";                              // estilos globales (tailwind + tema general)

ReactDOM.createRoot(document.getElementById("root")).render(   // crea la raíz de React sobre el div#root
   <React.StrictMode>                   {/* modo estricto: ayuda a detectar problemas en desarrollo */}
      <BrowserRouter>                   {/* provee contexto de rutas a toda la app */}
         <AuthProvider>                 {/* provee contexto de autenticación a toda la app */}
            <App />                     {/* componente principal que contiene las páginas/rutas */}
         </AuthProvider>
      </BrowserRouter>
   </React.StrictMode>
);

// ---------------------------------------------------------------------------
// NOTA PERSONAL SOBRE ESTE ARCHIVO (main.jsx)
// - Este es el punto de entrada de la app React que usa Vite.
// - ReactDOM.createRoot() toma el <div id="root"> del index.html y ahí monta todo.
// - StrictMode solo afecta al modo desarrollo: vuelve a montar componentes para
//   avisar de problemas potenciales, pero en producción no impacta.
// - BrowserRouter envuelve a <App /> para que dentro pueda usar rutas
//   (Link, Route, useNavigate, etc.) basadas en la URL del navegador.
// - En resumen: acá se conecta el HTML base con mi árbol de componentes y el
//   sistema de rutas de React Router.
