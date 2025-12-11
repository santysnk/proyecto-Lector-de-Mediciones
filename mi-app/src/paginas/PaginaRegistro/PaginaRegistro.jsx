// src/paginas/PaginaRegistro/PaginaRegistro.jsx

import React, { useState } from "react";                             // React y hook de estado
import { useNavigate } from "react-router-dom";                      // navegación programática entre rutas
import "../PaginaLogin/PaginaLogin.css";                             // reutiliza el layout base del login
import "./PaginaRegistro.css";                                       // ajustes visuales específicos de la pantalla de registro

const PaginaRegistro = () => {
  const [nombre, setNombre] = useState("");                          // campo "Nombre completo"
  const [usuario, setUsuario] = useState("");                        // campo "Usuario"
  const [email, setEmail] = useState("");                            // campo "Email"
  const [contraseña, setContraseña] = useState("");                  // campo "Contraseña"
  const [confirmar, setConfirmar] = useState("");                    // campo "Confirmar contraseña"

  const [errores, setErrores] = useState({});                        // { nombre: "...", usuario: "...", ... }

  const navigate = useNavigate();                                    // para volver o ir al login

  // ----------------------------------------------------------------
  // 1) Validación por campo (se llama desde onBlur y desde validarTodo)
  // ----------------------------------------------------------------
  const validarCampo = (campo) => {
    let mensaje = "";

    switch (campo) {
      case "nombre":
        if (!nombre.trim()) {
          mensaje = "El nombre es obligatorio.";
        } else if (nombre.trim().length < 3) {
          mensaje = "El nombre debe tener al menos 3 caracteres.";
        }
        break;

      case "usuario":
        if (!usuario.trim()) {
          mensaje = "El usuario es obligatorio.";
        } else if (usuario.trim().length < 4) {
          mensaje = "El usuario debe tener al menos 4 caracteres.";
        }
        break;

      case "email":
        if (!email.trim()) {
          mensaje = "El email es obligatorio.";
        } else {
          const regexEmail = /^\S+@\S+\.\S+$/;                       // regex simple para validar formato de email
          if (!regexEmail.test(email)) {
            mensaje = "El formato de email no es válido.";
          }
        }
        break;

      case "contraseña":
        if (!contraseña) {
          mensaje = "La contraseña es obligatoria.";
        } else if (contraseña.length < 6) {
          mensaje = "La contraseña debe tener al menos 6 caracteres.";
        }
        break;

      case "confirmar":
        if (!confirmar) {
          mensaje = "Debes confirmar la contraseña.";
        } else if (confirmar !== contraseña) {
          mensaje = "Las contraseñas no coinciden.";
        }
        break;

      default:
        break;
    }

    // actualizamos estado de errores para ese campo
    setErrores((prev) => {
      const next = { ...prev };

      if (mensaje) {
        next[campo] = mensaje;                                       // guardo el mensaje de error
      } else {
        delete next[campo];                                          // si ya no hay error, lo saco del objeto
      }

      return next;
    });

    return mensaje;                                                  // devuelvo el mensaje para que validarTodo lo use
  };

  // ----------------------------------------------------------------
  // 2) Validación al salir de cada input (onBlur)
  // ----------------------------------------------------------------
  const handleBlur = (campo) => {
    validarCampo(campo);                                             // valida solo el campo que perdió foco
  };

  // ----------------------------------------------------------------
  // 3) Validación global de todo el formulario (al hacer submit)
  // ----------------------------------------------------------------
  const validarTodo = () => {
    const campos = ["nombre", "usuario", "email", "contraseña", "confirmar"];
    const mensajes = campos.map((c) => validarCampo(c));             // dispara validación para cada campo

    return mensajes.every((m) => m === "");                          // true si todos los mensajes están vacíos
  };

  // ----------------------------------------------------------------
  // 4) Envío del formulario: validar, chequear duplicados y guardar
  // ----------------------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();                                          // evita que la página se recargue

    // 4.1) Validamos todo el formulario
    if (!validarTodo()) {
      return;                                                        // si hay errores no seguimos
    }

    // ----------------------------------------------------------------
    // 4.2) Evitar registrar dos veces el mismo email o usuario
    // ----------------------------------------------------------------
    try {
      // ¿ya existe alguien con este email?
      const respuestaEmail = await fetch(
        `http://localhost:4000/users?Email=${encodeURIComponent(
          email.trim().toLowerCase()
        )}`
      );
      const usuariosConEseEmail = await respuestaEmail.json();

      if (usuariosConEseEmail.length > 0) {
        alert("Ese email ya está registrado");
        return;                                                      // salimos, no seguimos creando la cuenta
      }

      // Lo mismo pero con el nombre de usuario
      const respuestaUsuario = await fetch(
        `http://localhost:4000/users?Usuario=${encodeURIComponent(
          usuario.trim()
        )}`
      );
      const usuariosConEseUsuario = await respuestaUsuario.json();

      if (usuariosConEseUsuario.length > 0) {
        alert("Ese nombre de usuario ya está en uso");
        return;
      }
    } catch (err) {
      // Si por algún motivo falla esta parte, seguimos igual (es solo para el TP)
      console.log("No se pudo verificar duplicados, seguimos...");
    }

    // ----------------------------------------------------------------
    // 4.3) Armar el objeto exactamente igual al formato de db.json
    // ----------------------------------------------------------------
    const nuevoUsuario = {
      id: Date.now().toString(),          // id único (milisegundos desde 1970 → siempre diferente)
      Nombre: nombre.trim(),              // importante la mayúscula y sin espacios extra
      Usuario: usuario.trim(),
      Email: email.trim().toLowerCase(),
      Contraseña: contraseña,             // solo para el trabajo práctico
    };

    // ----------------------------------------------------------------
    // 4.4) Enviar el nuevo usuario al json-server (POST a /users)
    // ----------------------------------------------------------------
    try {
      const respuesta = await fetch("http://localhost:4000/users", {
        method: "POST",                                          // crear nuevo recurso
        headers: {
          "Content-Type": "application/json",                    // indicamos que el cuerpo viene en JSON
        },
        body: JSON.stringify(nuevoUsuario),                      // convertimos el objeto a texto JSON
      });

      if (respuesta.ok) {
        alert("Cuenta creada con éxito!");

        // Limpiamos todos los campos y errores
        setNombre("");
        setUsuario("");
        setEmail("");
        setContraseña("");
        setConfirmar("");
        setErrores({});

        // Volvemos al login (en este proyecto, la ruta de login es "/")
        navigate("/");
      } else {
        alert("Hubo un error al guardar. Mirá la consola.");
      }
    } catch (error) {
      console.error(error);
      alert(
        "No se pudo conectar con la base de datos. ¿Tenés json-server corriendo?"
      );
    }
  };

  // ----------------------------------------------------------------
  // 5) Botón "Volver" para regresar al login
  // ----------------------------------------------------------------
  const handleVolver = () => {
    navigate("/");                                                  // volvemos a la pantalla de login
  };

  // ----------------------------------------------------------------
  // 6) Render de la pantalla de registro
  // ----------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="login-form registro-page">
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
            <button
              type="button"
              className="btn-volver"
              onClick={handleVolver}                               // vuelve a la pantalla anterior (login)
            >
              ← Volver
            </button>

            <h2 className="titulo-registro">REGISTRO</h2>

            <h3 className="label-registro">Nombre completo</h3>

            <input
              className={`input ${errores.nombre ? "input-error" : ""}`}
              type="text"
              placeholder="Ingrese su nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}          // actualiza el campo nombre
              onBlur={() => handleBlur("nombre")}                  // valida al salir del input
            />

            {errores.nombre && (
              <p className="error-text">{errores.nombre}</p>       // mensaje de error debajo del campo
            )}

            <h3 className="label-registro">Usuario</h3>

            <input
              className={`input ${errores.usuario ? "input-error" : ""}`}
              type="text"
              placeholder="Elija un usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onBlur={() => handleBlur("usuario")}
            />

            {errores.usuario && (
              <p className="error-text">{errores.usuario}</p>
            )}

            <h3 className="label-registro">Email</h3>

            <input
              className={`input ${errores.email ? "input-error" : ""}`}
              type="email"
              placeholder="Ingrese su email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
            />

            {errores.email && <p className="error-text">{errores.email}</p>}

            <h3 className="label-registro">Contraseña</h3>

            <input
              className={`input ${
                errores.contraseña ? "input-error" : ""
              }`}
              type="password"
              placeholder="Ingrese su contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              onBlur={() => handleBlur("contraseña")}
            />

            {errores.contraseña && (
              <p className="error-text">{errores.contraseña}</p>
            )}

            <h3 className="label-registro">Confirmar contraseña</h3>

            <input
              className={`input ${errores.confirmar ? "input-error" : ""}`}
              type="password"
              placeholder="Repita su contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              onBlur={() => handleBlur("confirmar")}
            />

            {errores.confirmar && (
              <p className="error-text">{errores.confirmar}</p>
            )}

            <div className="acciones">
              <button type="submit" className="boton">
                Crear cuenta
              </button>
            </div>

          </div>
        </div>
      </div>
    </form>
  );
};

export default PaginaRegistro;                                       // se usa en App.jsx como ruta "/registro"

{/* 
NOTA PERSONAL SOBRE ESTE ARCHIVO (PaginaRegistro.jsx)
-----------------------------------------------------

 - Pantalla para crear un nuevo usuario que se guarda en db.json vía json-server.

 - Usa un objeto `errores` para almacenar mensajes por campo y mostrarlos debajo
   de cada input, validando tanto en onBlur como en el submit.

 - Antes de crear el usuario consulta a json-server para verificar que no exista
   otro con el mismo Email o Usuario (búsqueda por querystring).

 - Si todo está bien, construye `nuevoUsuario` con el mismo formato que los
   registros existentes (Nombre, Usuario, Email, Contraseña) y hace un POST
   a http://localhost:4000/users.
	
 - Tras una creación exitosa, limpia el formulario y navega de vuelta al login
   (ruta "/"), dejando todo listo para que el usuario pruebe sus credenciales.

 - const regexEmail = /^\S+@\S+\.\S+$/;  // regex simple para validar formato de email

Explicación del regex:

   ^    →   inicio de la cadena (no permite nada antes).
  \S    →   “cualquier carácter que NO sea espacio” (ni espacios, ni tabs, etc.).
  \S+   →   uno o más caracteres no espacio (la parte antes del @).
   @    →   el símbolo arroba literal.
  \S+   →   de nuevo, uno o más caracteres no espacio (el dominio, por ejemplo gmail).
  \.    →   un punto literal (el . solo en regex significa “cualquier carácter”, por eso se escapa).
  \S+   →   uno o más caracteres no espacio (la parte final, por ejemplo com).
   $    →   final de la cadena (no permite nada después).

  Entonces regexEmail.test(email) devuelve true solo si TODO el texto tiene forma algo@algo.algo sin espacios.
  Si el usuario deja espacios, falta el @ o el punto, o escribe algo raro al principio o al final, el patrón no coincide y test devuelve false, por eso entrás en el mensaje "El formato de email no es válido." */}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (PaginaRegistro.jsx)

0) Visión general de la pantalla

   - PaginaRegistro implementa la alta de nuevos usuarios para el TP.

   - Valida cada campo del formulario, evita duplicar Email y Usuario y, si
     todo está correcto, hace un POST al json-server (db.json) en /users.

   - Tras registrar al usuario, limpia el formulario y redirige al login.

1) Imports y estilos

   import React, { useState, useEffect } from "react";
   import { useNavigate } from "react-router-dom";
   import "../PaginaLogin/PaginaLogin.css";
   import "./PaginaRegistro.css";

   - useState:
       • maneja el contenido de cada input (nombre, usuario, email, etc.)
         y el objeto de errores.

   - useNavigate:
       • se usa para volver al login tanto desde el botón “Volver” como
         luego de un registro exitoso.

   - CSS:
       • PaginaLogin.css da el layout base (lado izquierdo con logo y lado
         derecho con formulario).

       • PaginaRegistro.css aplica ajustes visuales particulares de esta vista.

2) Estado del formulario y navegación

   const [nombre, setNombre] = useState("");
   const [usuario, setUsuario] = useState("");
   const [email, setEmail] = useState("");
   const [contraseña, setContraseña] = useState("");
   const [confirmar, setConfirmar] = useState("");
   const [errores, setErrores] = useState({});
   const navigate = useNavigate();

   - Cada campo de texto tiene su propio estado controlado:
       • nombre → “Nombre completo”
       • usuario → nombre de usuario que se usará al loguearse
       • email → correo de contacto/identificación
       • contraseña / confirmar → credenciales de acceso (doble entrada).

   - errores:
       • es un objeto cuyas keys son los nombres de campo ("nombre",
         "usuario", etc.) y cuyos valores son strings con el mensaje de
         error correspondiente.
       • si un campo no tiene error, no aparece en este objeto.

3) validarCampo(campo): validación por campo

   const validarCampo = (campo) => { ... };

   - Recibe el nombre del campo y, mediante un switch, aplica reglas específicas:

     • nombre:
         - obligatorio (no puede ser vacío tras trim()).
         - al menos 3 caracteres.

     • usuario:
         - obligatorio.
         - al menos 4 caracteres.

     • email:
         - obligatorio.
         - debe cumplir el patrón de regexEmail (forma general algo@algo.algo).

     • contraseña:
         - obligatoria.
         - mínimo 6 caracteres.

     • confirmar:
         - obligatorio.
         - debe coincidir exactamente con contraseña.

   - Luego, actualiza el estado errores:
       • si hay mensaje, guarda errores[campo] = mensaje.
       • si mensaje está vacío, elimina ese campo del objeto de errores.

   - Devuelve el mensaje generado (vacío si el campo está bien), lo cual permite
     que otras funciones (como validarTodo) sepan si hubo algún problema.

4) handleBlur(campo): validación al salir de cada input

   const handleBlur = (campo) => {
     validarCampo(campo);
   };

   - Se usa en onBlur de cada input para validar cada campo al perder el foco.

   - Esto permite mostrar el error inmediatamente debajo del input sin esperar
     al submit del formulario.

5) validarTodo(): validación global del formulario

   const validarTodo = () => {
     const campos = ["nombre", "usuario", "email", "contraseña", "confirmar"];
     const mensajes = campos.map((c) => validarCampo(c));
     return mensajes.every((m) => m === "");
   };

   - Recorre todos los campos importantes, ejecuta validarCampo para cada uno
     y recoge los mensajes devueltos.

   - Devuelve true solo si todos los mensajes son cadenas vacías (es decir, no
     hay errores en ningún campo).

   - Se utiliza justo antes de intentar enviar los datos al servidor.

6) handleSubmit: flujo principal de registro

   const handleSubmit = async (event) => { ... };

   6.1) Evitar recarga y validar

   - event.preventDefault() mantiene la SPA sin recargar la página.

   - Si validarTodo() devuelve false, se corta el flujo para que el usuario
     corrija los errores mostrados.

   6.2) Comprobación de duplicados en json-server

   - Consulta por email:
       • GET a http://localhost:4000/users?Email=EMAIL
       • Si la respuesta devuelve al menos un registro, significa que ya existe
         alguien con ese email → se muestra alert y se interrumpe el registro.

   - Consulta por usuario:
       • GET a http://localhost:4000/users?Usuario=USUARIO
       • Si también hay registros, se muestra alert indicando que el nombre de
         usuario ya está en uso.

   - Si ocurre algún error en estas consultas, se notifica en consola pero se
     continúa con el flujo (al ser un TP, se privilegia no trabar al usuario).

   6.3) Construcción de nuevoUsuario

   const nuevoUsuario = {
     id: Date.now().toString(),
     Nombre: nombre.trim(),
     Usuario: usuario.trim(),
     Email: email.trim().toLowerCase(),
     Contraseña: contraseña,
   };

   - id:
       • usa Date.now() para generar un identificador único simple basado en
         milisegundos. Es suficiente para un TP sin colisiones.
   - Nombre / Usuario / Email / Contraseña:
       • se arman exactamente con las keys y formateo que espera db.json
         (“Nombre”, “Usuario”, “Email”, “Contraseña”).
       • Email se normaliza a minúsculas para evitar duplicados por diferencias
         de mayúsculas/minúsculas.

   6.4) POST al json-server y feedback al usuario

   - Se hace un fetch a "http://localhost:4000/users" con método POST y
     cuerpo JSON.stringify(nuevoUsuario).

   - Si respuesta.ok es true:
       • se muestra alert("Cuenta creada con éxito!").
       • se limpian todos los estados de campos y el objeto errores.
       • se navega a "/" (pantalla de login) para que el usuario pruebe
         sus nuevas credenciales.

   - Si no es ok:
       • se muestra un alert genérico de error al guardar.

   - En caso de excepción de red o de json-server caído:
       • se loguea el error en consola.
       • se muestra un alert indicando que verifiques si json-server está
         corriendo.

7) handleVolver: volver al login sin registrar

   const handleVolver = () => {
     navigate("/");
   };

   - Botón auxiliar para regresar al login sin intentar crear usuario.

   - Útil si el usuario se arrepiente o quiere revisar credenciales existentes.

8) Render del formulario y manejo visual de errores

   - Estructura general:
       • form.login-form.registro-page → reutiliza el layout de login.
       • container → divide en izquierda (logo) y derecha (formulario).
       • Cada input:
           - está ligado a su estado local (value + onChange).
           - usa onBlur para disparar la validación de ese campo.
           - aplica la clase "input-error" si existe errores[campo], para
             mostrar el borde o color de error.
           - debajo de cada input, si errores[campo] tiene texto, se muestra
             <p className="error-text"> con el detalle del problema.

   - Botón principal:
       • “Crear cuenta” envía el formulario (onSubmit) y dispara handleSubmit.

9) Explicación del regex de email

   const regexEmail = /^\S+@\S+\.\S+$/;

   - ^        → inicio de la cadena (no se permite nada antes).
   - \S+      → uno o más caracteres que no sean espacio (parte local del email).
   - @        → el símbolo arroba literal.
   - \S+      → uno o más caracteres sin espacio (dominio, por ejemplo "gmail").
   - \.       → un punto literal (se escapa porque . en regex significa “cualquier carácter”).
   - \S+      → uno o más caracteres sin espacio (TLD, por ejemplo "com").
   - $        → final de la cadena (no se permite nada después).

   - En conjunto, sólo acepta textos del estilo:
       algo@algo.algo
     sin espacios ni caracteres adicionales antes o después.
	  
   - Si el email no cumple esa forma mínima, regexEmail.test(email) devuelve
     false y se muestra el mensaje "El formato de email no es válido.".
---------------------------------------------------------------------------*/