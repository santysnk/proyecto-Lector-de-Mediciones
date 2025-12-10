
// src/paginas/PaginaLogin/PaginaLogin.jsx

import React, { useEffect, useState } from "react";      // React y hooks de estado/efectos
import { Link, useNavigate } from "react-router-dom";    // navegación y links entre rutas
import "./PaginaLogin.css";                              // estilos específicos de la pantalla de login

const PaginaLogin = () => {
   // estado principal del formulario de inicio de sesión
   const [usuariosValidos, setUsuariosValidos] = useState([]);        // lista de usuarios traídos del json-server
   const [usuario, setUsuario] = useState("");                        // texto ingresado en el campo "usuario"
   const [contrasena, setContrasena] = useState("");                  // texto ingresado en el campo "contraseña"
   const [recordarme, setRecordarme] = useState(false);               // flag del checkbox "Recordarme"
   const [error, setError] = useState("");                            // mensaje de error general (fallos al cargar usuarios)
   const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });   // alerta visual para feedback de login

   const navigate = useNavigate();                                    // hook para navegar programáticamente

   // ----------------------------------------------------------------
   // 1) Autocompletar contraseña si el usuario ya fue recordado antes
   //    usando la lista "usuariosRecordados" en localStorage
   // ----------------------------------------------------------------
   useEffect(() => {
      if (usuario.trim() === "") {
         // si borran el usuario en el input
         setContrasena("");                                           // limpio también la contraseña
         return;
      }

      const lista = JSON.parse(
         localStorage.getItem("usuariosRecordados") || "[]"
      );                                                              // leo la lista de recordados (o [] si no existe)

      const encontrado = lista.find((u) => u.usuario === usuario);    // busco por nombre de usuario

      if (encontrado) {
         setContrasena(encontrado.contrasena);                        // autocompleto la contraseña
         setRecordarme(true);                                         // marco automáticamente el checkbox
      }
   }, [usuario]);

   // ----------------------------------------------------------------
   // 2) Cargar lista de usuarios desde json-server (db.json)
   //    en http://localhost:4000/users
   // ----------------------------------------------------------------
   useEffect(() => {
      fetch("http://localhost:4000/users")                            // petición GET al json-server
         .then((response) => {
            if (!response.ok) throw new Error("Error al cargar usuarios");
            return response.json();                                   // convierto la respuesta a JSON
         })
         .then((data) => setUsuariosValidos(data))                    // guardo todos los usuarios en estado
         .catch((err) => {
            console.error(err);
            setError("No se pudieron cargar los usuarios.");          // muestro error si falla la carga
         });
   }, []);                                                            // solo una vez al montar el componente

   // ----------------------------------------------------------------
   // 3) Helper para mostrar una alerta temporal en pantalla
   // ----------------------------------------------------------------
   const mostrarAlerta = (mensaje, tipo = "error") => {
      setAlerta({ mensaje, tipo });                                   // seteo el texto y tipo de alerta
      setTimeout(() => {
         setAlerta({ mensaje: "", tipo: "" });                        // luego de 4 segundos la borro sola
      }, 4000);
   };

   // ----------------------------------------------------------------
   // 4) Manejo del submit del formulario de login
   // ----------------------------------------------------------------
   const handleSubmit = (event) => {
      event.preventDefault();                                         // evito recarga completa de la página
      setError("");                                                   // limpio errores previos de carga

      const usuarioLimpio = usuario.trim().toLowerCase();             // normalizo el nombre de usuario

      // Buscar al usuario en la lista por el campo "Usuario" (del JSON)
      const usuarioEncontrado = usuariosValidos.find(
         (u) => u.Usuario.toLowerCase() === usuarioLimpio
      );

      if (!usuarioEncontrado) {
         mostrarAlerta("El usuario no existe", "error");              // feedback si el usuario no está registrado
         return;
      }

      // Comparar contraseña (la key del JSON usa "Contraseña")
      if (usuarioEncontrado["Contraseña"] !== contrasena) {
         mostrarAlerta("Contraseña incorrecta", "error");             // feedback si la contraseña no coincide
         return;
      }

      mostrarAlerta(`Bienvenido, ${usuarioEncontrado.Nombre}!`, "exito"); // mensaje de bienvenida

      // ----------------------------------------------------------------
      // 4.1) Gestionar "Recordarme" con la lista usuariosRecordados
      // ----------------------------------------------------------------
      if (recordarme) {
         let listaRecordados = JSON.parse(
            localStorage.getItem("usuariosRecordados") || "[]"
         );                                                           // leo lista previa

         listaRecordados = listaRecordados.filter(
            (u) => u.usuario !== usuarioEncontrado.Usuario
         );                                                           // evito duplicados

         listaRecordados.push({
            usuario: usuarioEncontrado.Usuario,
            contrasena: contrasena,                                   // guardo contraseña en texto plano (solo para este TP)
         });

         localStorage.setItem(
            "usuariosRecordados",
            JSON.stringify(listaRecordados)
         );                                                           // guardo lista actualizada
      } else {
         // Si no se marca "Recordarme", quito al usuario de usuariosRecordados
         let listaRecordados = JSON.parse(
            localStorage.getItem("usuariosRecordados") || "[]"
         );
         listaRecordados = listaRecordados.filter(
            (u) => u.usuario !== usuarioEncontrado.Usuario
         );
         localStorage.setItem(
            "usuariosRecordados",
            JSON.stringify(listaRecordados)
         );
      }

      // ----------------------------------------------------------------
      // 4.2) Navegar a la pantalla de alimentadores despu�s de un breve delay
      // ----------------------------------------------------------------
      setTimeout(() => {
         navigate("/alimentadores");                                  // redirige al panel principal
      }, 1200);
   };

   // ----------------------------------------------------------------
   // 5) Render del formulario de login
   // ----------------------------------------------------------------
   return (
      <form onSubmit={handleSubmit} className="login-form">
         <div className="container">
            <div className="izquierda">
               <img
                  src="/src/assets/imagenes/logo 2 rw.png"
                  alt="logoApp"
                  className="logo"
               />
            </div>

            <div className="derecha">
               <div className="login">
                  <h3 className="usuario">USUARIO</h3>

                  <input
                     className="input"
                     type="text"
                     placeholder="Ingrese su usuario"
                     value={usuario}
                     onChange={(e) => setUsuario(e.target.value)}           // actualiza el estado de usuario
                     autoComplete="username"
                     list="lista-usuarios-recordados"                       // lista para autocompletar usuarios recordados
                  />

                  <datalist id="lista-usuarios-recordados">
                     {JSON.parse(
                        localStorage.getItem("usuariosRecordados") || "[]"
                     ) // lee lista guardada de usuarios recordados (o [] si no existe)
                        .map((u) => (
                           <option
                              key={u.usuario}
                              value={u.usuario}
                           />                                              // cada opción es un usuario recordado
                        ))}
                  </datalist>

                  <h3 className="usuario">CONTRASEÑA</h3>

                  <input
                     className="input"
                     type="password"
                     placeholder="Ingrese su contraseña"
                     value={contrasena}
                     onChange={(e) => setContrasena(e.target.value)}        // actualiza el estado de contraseña
                  />

                  <label className="recordarme">
                     <input
                        type="checkbox"
                        checked={recordarme}
                        onChange={(event) =>
                           setRecordarme(event.target.checked)}             // alterna el flag de "Recordarme"
                     />{" "}
                     Recordarme
                  </label>

                  {error && (
                     <p className="error">{error}</p>                        // mensaje de error al cargar usuarios
                  )}

                  <div className="acciones">
                     <button type="submit" className="boton">
                        Iniciar sesión
                     </button>

                     <Link to="/recuperarContraseña" className="recordarme">
                        ¿Olvidaste tu contraseña?
                     </Link>

                     <Link to="/registro" className="registrarse">
                        ¿No tienes cuenta? registrate
                     </Link>
                  </div>
               </div>
            </div>
         </div>

         {alerta.mensaje && (                                           // si hay alerta activa, la muestro flotando
            <div className={`alerta alerta-${alerta.tipo}`}>
               {alerta.mensaje}
            </div>
         )}
      </form>
   );
};

export default PaginaLogin;      // componente exportado para usarlo en App.jsx

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (PaginaLogin.jsx)

 - Pantalla de login con soporte de "recordarme" y autocompletado de usuario
   y contraseña usando localStorage (`usuariosRecordados`).

 - Al montar, carga la lista de usuarios desde json-server (db.json en
   http://localhost:4000/users) y la guarda en `usuariosValidos` para validar
   las credenciales localmente sin otra llamada.

 - El segundo useEffect usa `usuariosRecordados` para autocompletar la
   contraseña cuando escribo un usuario que ya estuvo guardado antes.

 - `handleSubmit` valida usuario y contraseña, muestra alertas con `mostrarAlerta`,
   mantiene la lista `usuariosRecordados` según el estado del checkbox y, si
   todo está ok, navega a `/alimentadores` luego de un breve delay.

 - Toda la parte visual (layout, colores, alertas flotantes) se maneja en
   `PaginaLogin.css`.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (PaginaLogin.jsx)

0) Visión general de la pantalla

   - PaginaLogin.jsx implementa la pantalla de inicio de sesión de la app.

   - Soporta:
       • validación contra un json-server (http://localhost:4000/users),
       • casilla "Recordarme" con almacenamiento en localStorage,
       • autocompletado de usuario y contraseña para usuarios recordados,
       • navegación automática al panel de alimentadores tras un login exitoso.

   - Toda la parte visual (layout, colores, alertas flotantes) se define en
     PaginaLogin.css; este archivo se centra en la lógica y el manejo de estado.


1) Estado principal del componente

   const [usuariosValidos, setUsuariosValidos] = useState([]);
   const [usuario, setUsuario] = useState("");
   const [contrasena, setContrasena] = useState("");
   const [recordarme, setRecordarme] = useState(false);
   const [error, setError] = useState("");
   const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });

   - usuariosValidos:
       • contiene la lista de usuarios leída desde json-server (db.json).
       • se usa para validar el nombre de usuario y la contraseña.

   - usuario / contrasena:
       • representan lo que se escribe en los inputs del formulario.

   - recordarme:
       • indica si el usuario quiere que se recuerden sus credenciales
         para futuros inicios de sesión en este mismo equipo.

   - error:
       • guarda errores generales de carga (por ejemplo, si falla el fetch
         de usuarios desde el servidor).

   - alerta:
       • { mensaje, tipo } se usa para mostrar un cartel flotante temporal
         (por ejemplo, "El usuario no existe", "Contraseña incorrecta",
         "Bienvenido, ...").


2) useEffect – autocompletar desde usuariosRecordados

   useEffect(() => {
     if (usuario.trim() === "") { ... }
     const lista = JSON.parse(localStorage.getItem("usuariosRecordados") || "[]");
     const encontrado = lista.find((u) => u.usuario === usuario);
     ...
   }, [usuario]);

   - Se ejecuta cada vez que cambia el campo usuario.

   - Si el input queda vacío, también se limpia la contraseña.

   - Si hay texto, se busca ese usuario en la lista "usuariosRecordados"
     almacenada en localStorage (es un array con objetos { usuario, contrasena }).

   - Si se encuentra:
       • autocompleta el campo contrasena,
       • marca el checkbox "Recordarme".

   - Este mecanismo permite que, escribiendo sólo el usuario (o eligiéndolo
     desde el datalist), se rellene automáticamente la contraseña asociada.


3) useEffect #2 – carga de usuarios desde json-server

   useEffect(() => {
     fetch("http://localhost:4000/users")
       .then(...)
       .catch(...);
   }, []);

   - Hace una petición GET a json-server para obtener la lista de usuarios.

   - Espera que la respuesta sea un JSON (array de objetos) con campos como:
       • Usuario
       • Contraseña
       • Nombre
       (y otros que se definan en db.json).

   - Si la carga es exitosa:
       • guarda el array completo en usuariosValidos.

   - Si falla:
       • escribe el error en consola,
       • setea error con un mensaje genérico que luego se muestra
         debajo del formulario.


4) mostrarAlerta(mensaje, tipo)

   const mostrarAlerta = (mensaje, tipo = "error") => {
     setAlerta({ mensaje, tipo });
     setTimeout(() => setAlerta({ mensaje: "", tipo: "" }), 4000);
   };

   - Centraliza la lógica para mostrar mensajes temporales:
       • "El usuario no existe"
       • "Contraseña incorrecta"
       • "Bienvenido, ...", etc.
   - tipo se utiliza para asignar una clase CSS distinta (alerta-error,
     alerta-exito, etc.).
   - Luego de 4 segundos, la alerta se limpia sola, dejando de mostrarse.


5) handleSubmit – flujo principal de login

   const handleSubmit = (event) => {
     event.preventDefault();
     ...
   };

   5.1) Validación de usuario y contraseña

   - Normaliza el usuario a minúsculas (usuarioLimpio).
   - Busca en usuariosValidos un registro cuyo campo Usuario coincida
     (case-insensitive).
   - Si no lo encuentra:
       • muestra alerta "El usuario no existe".
   - Si lo encuentra, compara la contraseña ingresada con el campo
     "Contraseña" del JSON:
       • si no coinciden, alerta "Contraseña incorrecta";
       • si coinciden, alerta de bienvenida y continúa el flujo.

   5.2) Gestión de la lista usuariosRecordados

   - Si recordarme === true:
       • lee la lista existente de usuariosRecordados desde localStorage
         (o [] si no existe),
       • elimina cualquier entrada previa para ese mismo usuario,
       • agrega un nuevo objeto { usuario, contrasena },
       • vuelve a guardar la lista completa en localStorage.

   - Si recordarme === false:
       • lee la misma lista,
       • elimina al usuario actual de esa lista,
       • guarda el resultado.

   - De esta forma, usuariosRecordados mantiene sólo aquellos usuarios que
     pidieron ser recordados, junto con su contraseña (en texto plano en
     este trabajo práctico, sabiendo que en producción se debería cifrar).

   5.3) Navegación hacia /alimentadores

   - Tras un pequeño delay (1200 ms), llama a navigate("/alimentadores").
	
   - Esto permite que la alerta de bienvenida sea visible un instante
     antes de redirigir al usuario al panel principal de la app.


6) Render del formulario y estructura visual

   return (
     <form onSubmit={handleSubmit} className="login-form">
       <div className="container">
         <div className="izquierda">...</div>
         <div className="derecha">...</div>
       </div>
       {alerta.mensaje && <div className={`alerta alerta-${alerta.tipo}`}>...</div>}
     </form>
   );

   - Estructura general:
       • container con dos columnas:
           - izquierda: logo de la aplicación,
           - derecha: formulario de login.

   - Inputs principales:
       • Usuario:
           - type="text", autoComplete="username".
           - usa list="lista-usuarios-recordados" para ofrecer opciones
             de usuarios previamente recordados (datalist).
       • Contraseña:
           - type="password", ligada a contrasena.

   - Datalist "lista-usuarios-recordados":
       • se arma dinámicamente leyendo usuariosRecordados desde localStorage.
       • cada <option> tiene value = nombre de usuario recordado.

   - Checkbox "Recordarme":
       • ligado a recordarme.
       • controla si el usuario se agrega o quita de usuariosRecordados
         al hacer login correcto.

   - Sección "acciones":
       • botón de "Iniciar sesión" (submit del formulario),
       • link a recuperación de contraseña,
       • link a pantalla de registro.

   - Alerta flotante:
       • si alerta.mensaje tiene contenido, se renderiza un div con clases
         alerta y alerta-{tipo}, posicionado según el CSS, para mostrar
         errores o mensajes de éxito de forma destacada sobre la pantalla.

---------------------------------------------------------------------------*/



