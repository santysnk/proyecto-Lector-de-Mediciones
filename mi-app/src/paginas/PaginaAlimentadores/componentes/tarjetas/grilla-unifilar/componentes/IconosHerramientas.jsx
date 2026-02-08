// componentes/IconosHerramientas.jsx
// Iconos SVG usados en la barra de herramientas de la grilla

import React from "react";

export const IconoPincel = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z"/>
   </svg>
);

export const IconoBorrador = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83l3.85 3.85c.39.39.9.59 1.41.59h8.48c.53 0 1.04-.21 1.41-.59l3.67-3.67c.78-.78.78-2.05 0-2.83L12.56 3.59C12.17 3.2 11.66 3 11.14 3h4zm-9.71 18H8.3l8.57-8.57-2.83-2.83L5.43 18.17l-.01 2.83z"/>
   </svg>
);

export const IconoBalde = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5zM5.21 10L10 5.21 14.79 10H5.21zM16.56 8.94L10 2.38 3.44 8.94c-.59.59-.59 1.54 0 2.12l6.56 6.56c.59.59 1.54.59 2.12 0l6.44-6.44c.59-.59.59-1.54 0-2.12l-.12-.12z"/>
   </svg>
);

export const IconoTexto = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M5 4v3h5.5v12h3V7H19V4H5z"/>
   </svg>
);

export const IconoMover = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
   </svg>
);

export const IconoEliminar = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
   </svg>
);

export const IconoGotero = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.41-1.42 1.42 1.41 1.41-7.83 7.83a2 2 0 00-.59 1.42V19h2.83c.53 0 1.04-.21 1.42-.59l7.83-7.83 1.41 1.41 1.42-1.42-1.41-1.41 3.12-3.12a1 1 0 00.09-1.41zM6.41 18H5v-1.41l7.83-7.83 1.41 1.41L6.41 18z"/>
   </svg>
);

export const IconoRayo = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66l.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>
   </svg>
);

export const IconoDiana = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2"/>
   </svg>
);

export const IconoPlay = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M8 5v14l11-7z"/>
   </svg>
);

export const IconoPause = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
   </svg>
);

export const IconoConfig = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
   </svg>
);

export const IconoCheck = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
   </svg>
);

export const IconoX = () => (
   <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
   </svg>
);
