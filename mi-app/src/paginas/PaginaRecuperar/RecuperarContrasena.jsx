// src/paginas/PaginaRecuperar/RecuperarContrasena.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RecuperarContrasena.css";
import logoApp from "../../assets/imagenes/logo 2 rw.png";

const RecuperarContrasena = () => {
   const [email, setEmail] = useState("");
   const [alerta, setAlerta] = useState({
      mensaje: "",
      tipo: "",
   });

   const navigate = useNavigate();

   const mostrarAlerta = (mensaje, tipo = "exito") => {
      setAlerta({ mensaje, tipo });
      setTimeout(() => setAlerta({ mensaje: "", tipo: "" }), 5000);
   };

   const handleSubmit = (e) => {
      e.preventDefault();

      if (!email.trim()) {
         mostrarAlerta("Por favor escribí tu email", "error");
         return;
      }

      if (!email.includes("@") || !email.includes(".")) {
         mostrarAlerta("El email no parece válido", "error");
         return;
      }

      mostrarAlerta(`Listo! Te enviamos un enlace a ${email}`, "exito");

      setTimeout(() => {
         navigate("/");
      }, 3000);
   };

   return (
      <div className="recuperar-fondo">
         <div className="recuperar-caja">
            <button
               className="btn-volver"
               onClick={() => navigate("/")}
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
                  onChange={(e) => setEmail(e.target.value)}
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
