# Trabajo-final-los-electricos
Trabajo final del tercer cuatrimestre 
# ⚡️ RelayWatch – Monitor educativo de alimentadores

> Aplicación web en React + Vite para visualizar alimentadores eléctricos, gestionar puestos y simular lecturas de relé/analizador con animación de progreso en los bordes de cada medición. Proyecto educativo del tercer cuatrimestre.

---

## 👥 Equipo de desarrollo

- **Santiago Casal** (@santysnk)  
- **Vanina Labrunee** (@VaninaL)

---

## 📋 Índice

1. [Descripción](#-descripción)  
2. [Características](#-características)  
3. [Tecnologías](#-tecnologías)  
4. [Estructura del proyecto](#-estructura-del-proyecto)  
5. [Instalación](#-instalación)  
6. [Uso](#-uso)  
7. [Scripts disponibles](#-scripts-disponibles)  
8. [Recursos del proyecto](#-recursos-del-proyecto)  
9. [Notas](#-notas)

---

## 📌 Descripción

- Pantalla de **Alimentadores** con puestos, tarjetas arrastrables y boxes de medición.  
- Lecturas periódicas configurables (IP/puerto/periodo) para **relé** y **analizador**.  
- Borde amarillo de cada box animado según el tiempo de actualización; se reinicia al llegar un dato nuevo.  
- Mapeo de registros a boxes configurable por modal (parte superior/inferior).  
- Estado persistido en `localStorage` (puestos, selección, configuraciones).

---

## ✨ Características

- Gestión de puestos (crear, editar, reordenar).  
- Configuración de alimentadores (color, IP/puerto, periodos de relé y analizador).  
- Mapeo de mediciones por modal, con vista previa y persistencia local.  
- Drag & drop de tarjetas con indicador de “soltar al final”.  
- Animación de borde sincronizada con el contador de lecturas (reinicia al recibir dato nuevo).  
- UI responsive con menú lateral en modo compacto.

---

## 🛠 Tecnologías

- **React** + **Vite**  
- **JavaScript** (hooks y contexto)  
- **Tailwind** (via `@tailwindcss/vite`) para estilos utilitarios  
- **Express** + **cors** para simular un backend ligero  
- **json-server** (usa `db.json`) para simular datos temporales  
- CSS modular por componentes  
- Almacenamiento local (`localStorage`)  
- Cliente Modbus con modo de operación `"simulado"` o `"real"` (configurable en `src/paginas/PaginaAlimentadores/utilidades/clienteModbus.js`)

---

## 📁 Estructura del proyecto

```
mi-app/
├─ public/
│  └─ fonts/ (BalooBhai2, ds-digi)
│
├─ server/
│  └─ modbusServer.js
│
├─ src/
│  ├─ App.jsx                          # Rutas: login, registro, alimentadores
│  ├─ App.css
│  ├─ main.jsx
│  ├─ index.css
│  │
│  ├─ assets/
│  │  └─ imagenes/ (Config_Icon.png, Mapeo_icon.png, logo 2 rw.png)
│  │
│  ├─ paginas/
│  │  ├─ PaginaLogin/
│  │  │  ├─ PaginaLogin.jsx
│  │  │  └─ PaginaLogin.css
│  │  │
│  │  ├─ PaginaRegistro/
│  │  │  ├─ PaginaRegistro.jsx
│  │  │  └─ PaginaRegistro.css
│  │  │
│  │  └─ PaginaAlimentadores/
│  │     ├─ PaginaAlimentadores.jsx       # Monta el proveedor de datos y la vista
│  │     ├─ PaginaAlimentadores.css
│  │     │
│  │     ├─ contexto/ (ContextoAlimentadores.jsx)
│  │     │
│  │     ├─ componentes/
│  │     │  ├─ layout/ (VistaAlimentadores.jsx)
│  │     │  ├─ tarjetas/ (TarjetaAlimentador, GrupoMedidores, CajaMedicion)
│  │     │  ├─ modales/ (Configuración, Mapeo, Puestos)
│  │     │  └─ navegacion/ (barra superior y menú lateral)
│  │     │
│  │     ├─ hooks/ (usarPuestos, usarMediciones, usarArrastrarSoltar, useGestorModales)
│  │     ├─ utilidades/ (calculosMediciones, calculosFormulas, almacenamiento, clienteModbus)
│  │     └─ constantes/ (colores, títulos)
│  │
│  └─ assets/ (iconos e imágenes)
│
├─ server/modbusServer.js
├─ db.json
├─ package.json
└─ vite.config.js
```

---

## 🚀 Instalación

1) Clona el repositorio.  
2) Entra en `mi-app/` e instala dependencias:
```bash
npm install
```

---

## ▶️ Uso

1) Levanta la base temporal con json-server:
```bash
npm run db
```
2) Levanta el backend simulado:
```bash
npm run backend
```
3) Inicia la aplicación web:
```bash
npm run dev
```
Abre la URL indicada por la consola (por defecto `http://localhost:5174`).  
Crea un puesto, agrega alimentadores, configura relé/analizador y empieza las mediciones. El borde de los boxes se anima según el periodo configurado.

---

## 🧩 Scripts disponibles

| Comando           | Descripción                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Arranca Vite con hot reload.                  |
| `npm run build`   | Compila para producción.                      |
| `npm run preview` | Sirve el build local para revisar.            |
| `npm run db`      | Ejecuta json-server con `db.json` en el puerto 4000. |
| `npm run backend` | Ejecuta el servidor simulado `server/modbusServer.js`. |

---

## 📋 Recursos del proyecto

- Presentación (Gamma): https://gamma.app/docs/RelayWatch-aa48ymgzh3rok4s  
- Tablero Trello: https://trello.com/invite/b/68faa899637e581fd429a624/ATTI948066650eec58b8e1d97b2fa25a0093E3901CC3/trabajo-final-de-programacion  
- Diseño en Figma: https://www.figma.com/design/5CbvjUrKUlVxgt7EZERuJc/Proyecto-RelayWatch?t=PZSK0fnncGCoZbFc-0

---

## 🧠 Notas

- En `clienteModbus.js` puedes elegir el modo de operación:
```js
/**
 * Modo de operación: "simulado" o "real"
 * En modo simulado genera datos aleatorios para pruebas
 */
export const MODO_MODBUS = "simulado";
```
- `json-server` + `db.json` dan una base temporal para pruebas. La idea a futuro es migrar a una base MySQL real.
- `server/modbusServer.js` sirve como backend muy básico para la demo; a futuro se espera un backend más robusto y seguro desplegado en la nube.
