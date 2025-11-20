import React from 'react'
import { useState,useEffect } from 'react'
import "./login.css"

const usuariosValidos = [
  {usuario:"admin", contraseña: "1234"},
  {usuario:"santy", contraseña: "santy1985"},
  {usuario:"vani", contraseña: "vani1981"}
];

const login = () => {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [recordarme, setRecordarme] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Usuario:", usuario);
    console.log("Contraseña:", contraseña);
    console.log("Recordarme:", recordarme);
  };


  return (
    <div className = "container">
      <div className='izquierda'>
        <img src="/src/assets/imagenes/logo 2 rw.png" alt="logoApp" className='logo'/>
      </div>
      <div className='derecha'>
        <div className='login'>
          <h3 className='usuario'>USUARIO</h3>
          <input className="input" type="text" />
          <h3 className='usuario'>CONTRASEÑA</h3>
          <input className="input" type="text" />
          <label className='recordarme'>
            <input type="checkbox"
                    checked={recordarme} 
                      onChange={(event) => setRecordarme(event.target.checked)}/> Recordarme
          </label>
        </div>
        

        
        
      </div>

    </div>
  )
}

export default login