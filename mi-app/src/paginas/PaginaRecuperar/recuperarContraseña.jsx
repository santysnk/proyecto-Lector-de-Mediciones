import { useState } from "react"; //para cambiar estado de email y alertas
import { Link, useNavigate } from "react-router-dom"; //para volver a /login
import "./RecuperarContraseña.css";

const RecuperarContrasena = () => {
   const [email, setEmail] = useState(""); //estado de email que escribe el usuario
   const [alerta, setAlerta] = useState({ mensaje: "", tipo: "" }); //estado de alerta,. exito o error con colores rojo o verde

   const navigate = useNavigate();

   const mostrarAlerta = (mensaje, tipo = "exito") => {
      //funcion para mostrar alerta
      setAlerta({ mensaje, tipo });
      setTimeout(() => setAlerta({ mensaje: "", tipo: "" }), 5000); //el alerta desaparece en 5 segundos
   };

   const handleSubmit = (e) => {
      //manejo del submit cuando en usuario clickea "enviar enlace"
      e.preventDefault(); // evita que la página se recargue

      if (!email.trim()) {
         // Validación: campo vacío
         mostrarAlerta("Por favor escribí tu email", "error");
         return;
      }
      if (!email.includes("@") || !email.includes(".")) {
         //valida formato de email
         mostrarAlerta("El email no parece válido", "error");
         return;
      }
      mostrarAlerta(`Listo! Te enviamos un enlace a ${email}`, "exito");
      setTimeout(() => {
         navigate("/"); // Después de 3 segundos volvemos al login
      }, 3000);
   };
   return (
      <div className="recuperar-fondo">
         <div className="recuperar-caja">

            <button className="btn-volver" onClick={() => navigate("/")}>
               ← Volver al inicio de sesión              {/* boton flecha para volver al login*/}         
            </button>{" "}
            

            <img
               src="/src/assets/imagenes/logo 2 rw.png"
               alt="Logo"
               className="logo-recuperar"
            />{" "}                                      {/* Logo de la app */}
            
            <h2>Recuperar contraseña</h2>

            <p className="texto-ayuda">
               Ingresá tu email y te enviaremos un enlace para crear una nueva
               contraseña
            </p>
				
            <form onSubmit={handleSubmit}>
               {" "}
               {/* Input de email */}
               <input
                  type="text"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-recuperar"
               />
               <button type="submit" className="btn-enviar">
                  {" "}
                  {/* Botón para enviar enlace */}
                  Enviar enlace
               </button>
            </form>

            {alerta.mensaje && (
               <div className={`alerta alerta-${alerta.tipo}`}>
                  {" "}
                  {/* alerta muestra mensajes de exito o error en color verde o rojo */}
                  {alerta.mensaje}
               </div>
            )}
         </div>
      </div>
   );
};

export default RecuperarContrasena;
