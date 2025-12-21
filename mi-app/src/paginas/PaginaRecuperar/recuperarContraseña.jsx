// src/paginas/PaginaRecuperar/recuperarContraseña.jsx

import { useState } from "react";                  // hook para manejar estado local (email y alertas)
import { useNavigate } from "react-router-dom";    // navegación: volver a /login u otras rutas
import "./recuperarContraseña.css";                // estilos específicos de la pantalla de recuperación
import logoApp from "../../assets/imagenes/logo 2 rw.png";

const RecuperarContrasena = () => {
   const [email, setEmail] = useState("");         // email que escribe el usuario
   const [alerta, setAlerta] = useState({
      mensaje: "",
      tipo: "",
   });                                             // alerta de éxito o error (controla color y texto)

   const navigate = useNavigate();                 // hook para redirigir de vuelta al login

   const mostrarAlerta = (mensaje, tipo = "exito") => {
      setAlerta({ mensaje, tipo });                // muestra alerta con mensaje y tipo
      setTimeout(() => setAlerta({ mensaje: "", tipo: "" }), 5000); // la oculta a los 5 segundos
   };

   const handleSubmit = (e) => {
      e.preventDefault();                          // evita recarga completa de la página

      if (!email.trim()) {
         // Validación: campo vacío
         mostrarAlerta("Por favor escribí tu email", "error");
         return;
      }

      if (!email.includes("@") || !email.includes(".")) {
         // Validación muy básica de formato de email
         mostrarAlerta("El email no parece válido", "error");
         return;
      }

      mostrarAlerta(`Listo! Te enviamos un enlace a ${email}`, "exito");

      setTimeout(() => {
         navigate("/");                            // después de 3 segundos volvemos al login
      }, 3000);
   };

   return (
      <div className="recuperar-fondo">
         <div className="recuperar-caja">
            <button
               className="btn-volver"
               onClick={() => navigate("/")}       // vuelve a la pantalla de inicio de sesión
            >
               ← Volver al inicio de sesión
            </button>

            <img
               src={logoApp}
               alt="Logo"
               className="logo-recuperar"
            />

            <h2 className="h2-Recuperar">Recuperar contraseña</h2>

            <p className="texto-ayuda">
               Ingresá tu email y te enviaremos un enlace para crear una nueva
               contraseña.
            </p>

            <form onSubmit={handleSubmit}>
               <input
                  type="text"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // actualiza el estado con lo que escribe el usuario
                  className="input-recuperar"
               />
               <button type="submit" className="btn-enviar">
                  Enviar enlace
               </button>
            </form>

            {alerta.mensaje && (
               <div className={`alerta alerta-${alerta.tipo}`}>
                  {alerta.mensaje}
               </div>
            )}
         </div>
      </div>
   );
};

export default RecuperarContrasena;

{/*---------------------------------------------------------------------------
 NOTA SOBRE ESTE ARCHIVO (recuperarContraseña.jsx)

 - Pantalla sencilla para simular el flujo de "Recuperar contraseña". No
   envía correos reales, sólo muestra un mensaje de confirmación.

 - `email` guarda lo que escribe el usuario; `alerta` controla el texto y el
   color (éxito/error) del mensaje que aparece debajo del formulario.

 - `handleSubmit` valida que el email no esté vacío y tenga al menos un "@" y
   un ".", luego muestra una alerta de éxito y, tras 3 segundos, vuelve al
   login (`navigate("/")`).

 - El botón "← Volver al inicio de sesión" permite regresar al login sin
   enviar nada, usando también `navigate("/")`.

 - Todo el aspecto visual (fondo, caja, colores de alerta, etc.) se define en
   `recuperarContraseña.css`.
---------------------------------------------------------------------------*/}

/*---------------------------------------------------------------------------
CÓDIGO + EXPLICACIÓN DE CADA PARTE (recuperarContraseña.jsx)

0) Visión general de la pantalla

   - RecuperarContrasena implementa una pantalla sencilla para simular el
     flujo de “Recuperar contraseña”.

   - No envía correos reales: valida mínimamente el email, muestra un mensaje
     de confirmación y luego redirige de vuelta al login.

   - Toda la parte visual (fondo, caja central, colores de alerta, etc.)
     se define en el archivo de estilos `recuperarContraseña.css`.

1) Imports y setup básico

   import { useState } from "react";
   import { Link, useNavigate } from "react-router-dom";
   import "./recuperarContraseña.css";

   - useState:
       • se usa para manejar el email escrito por el usuario y la estructura
         de alerta (mensaje + tipo).

   - useNavigate:
       • permite redirigir programáticamente a otra ruta (en este caso, al
         inicio de sesión "/").

   - El CSS asociado encapsula el look & feel de esta pantalla (fondo difuminado,
     caja centrada, tamaños de fuente, colores de botones, etc.).

2) Estado interno del componente

   const [email, setEmail] = useState("");
   const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" });

   - email:
       • refleja el contenido del input de texto donde el usuario escribe
         su dirección de correo.
       • se actualiza en cada pulsación mediante onChange.

   - alerta:
       • es un objeto con dos propiedades:
           - mensaje: texto que se muestra al usuario (por ejemplo,
             “Por favor escribí tu email”, “Listo! Te enviamos un enlace a ...”).
           - tipo: “exito” o “error”, que luego se usa como sufijo en la clase
             CSS (alerta-exito / alerta-error).
       • cuando mensaje está vacío, la alerta no se muestra en la interfaz.

3) Navegación con useNavigate

   const navigate = useNavigate();

   - navigate:
       • función que permite cambiar de ruta desde código.
       • acá se usa para volver al login ("/") tanto desde el botón de “Volver”
         como después de un envío exitoso del formulario.

4) Helper mostrarAlerta(mensaje, tipo)

   const mostrarAlerta = (mensaje, tipo = "exito") => {
      setAlerta({ mensaje, tipo });
      setTimeout(() => setAlerta({ mensaje: "", tipo: "" }), 5000);
   };

   - Recibe un texto y un tipo (“exito” por defecto).

   - Actualiza el estado alerta para que la UI muestre un cartel de feedback.

   - Luego de 5 segundos, limpia el estado para ocultar ese cartel
     automáticamente, sin que el usuario tenga que cerrarlo.

5) Manejo del submit del formulario (handleSubmit)

   const handleSubmit = (e) => {
      e.preventDefault();
      ...
   };

   5.1) Evitar recarga de página

   - e.preventDefault() cancela el comportamiento por defecto del formulario
     (recargar la página completa).

   5.2) Validaciones básicas

   - Primera validación: campo vacío
       if (!email.trim()) {
         mostrarAlerta("Por favor escribí tu email", "error");
         return;
       }

       • trim() elimina espacios al principio y al final.
       • Si el resultado queda vacío, se muestra un mensaje de error pidiendo
         que el usuario escriba su email.

   - Segunda validación: formato muy básico
       if (!email.includes("@") || !email.includes(".")) {
         mostrarAlerta("El email no parece válido", "error");
         return;
       }

       • No es una validación “real” de RFC, sólo verifica que exista “@”
         y un punto, suficiente para un TP o demo.

   5.3) Simulación de envío y redirección

   - Si pasa las validaciones:
       mostrarAlerta(`Listo! Te enviamos un enlace a ${email}`, "exito");

       • Se muestra un mensaje de éxito usando el email que escribió el usuario.
       • No se hace ningún request real; el envío es puramente simulado.

   - Luego:
       setTimeout(() => {
         navigate("/");
       }, 3000);

       • Espera 3 segundos y redirige al login (ruta "/").
       • Da tiempo a que el usuario lea la confirmación antes de regresar.

6) Estructura visual del componente (render)

   return (
      <div className="recuperar-fondo">
         <div className="recuperar-caja">
            ...
         </div>
      </div>
   );

   - recuperar-fondo:
       • contenedor que suele ocupar toda la pantalla, con un fondo de color
         o imagen. Centra la caja principal en el viewport.

   - recuperar-caja:
       • tarjeta o panel donde se muestra el contenido de recuperación.

   6.1) Botón “Volver al inicio de sesión”

   <button
     className="btn-volver"
     onClick={() => navigate("/")}
   >
     ← Volver al inicio de sesión
   </button>

   - Permite regresar inmediatamente al login sin enviar el formulario.

   - Usa navigate("/") para cambiar de ruta.

   6.2) Logo y títulos

   <img src={logoApp} ... />
   <h2 className="h2-Recuperar">Recuperar contraseña</h2>
   <p className="texto-ayuda">...</p>

   - Refuerzan la identidad visual de la app y explican brevemente qué debe
     hacer el usuario (ingresar su email para recibir un enlace).

   6.3) Formulario de email

   <form onSubmit={handleSubmit}>
      <input
         type="text"
         placeholder="tuemail@ejemplo.com"
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         className="input-recuperar"
      />
      <button type="submit" className="btn-enviar">
         Enviar enlace
      </button>
   </form>

   - El input está controlado por el estado email.

   - Cada pulsación dispara setEmail con el nuevo valor.

   - Al presionar el botón “Enviar enlace”:
       • se dispara handleSubmit,
       • se ejecutan las validaciones,
       • se muestra la alerta adecuada,
       • eventualmente se redirige al login.

   6.4) Alerta de feedback

   {alerta.mensaje && (
      <div className={`alerta alerta-${alerta.tipo}`}>
         {alerta.mensaje}
      </div>
   )}

   - Sólo se renderiza si alerta.mensaje no está vacío.
	
   - Usa dos clases:
       • alerta: estilos comunes (posición, padding, borde, etc.),
       • alerta-{tipo}: variaciones según “exito” o “error”
         (colores verde/rojo, iconos distintos, etc.).

7) Resumen conceptual

   - Este componente representa un paso “ligero” de recuperación de contraseña:
       • Comprueba que el usuario introduzca un email con un formato mínimo.
       • Muestra un mensaje de feedback claro (éxito o error).
       • No gestiona credenciales reales ni integra un backend de correo,
         sino que sirve como maqueta funcional para el flujo de UX.

   - Su responsabilidad se limita a:
       • controlar el estado del input,
       • validar ese estado,
       • mostrar feedback al usuario,
       • decidir cuándo y adónde navegar.
---------------------------------------------------------------------------*/