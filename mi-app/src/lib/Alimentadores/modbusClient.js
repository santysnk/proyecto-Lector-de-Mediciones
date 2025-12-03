// src/lib/Alimentadores/modbusClient.js

export const MODBUS_MODE = "simulado"; // 👉 "real" para usar el server Modbus o "simulado" para usar el server simulado
export const USE_MODBUS_REAL = MODBUS_MODE === "real";

const BASE_URL = "http://localhost:5000/api/modbus/test";

// Función única para leer registros (simulado o real)
export async function leerRegistrosModbus({
   ip,
   puerto,
   indiceInicial,
   cantRegistros,
}) {
   const start = Number(indiceInicial);
   const len = Number(cantRegistros);
   const p = Number(puerto);

   // Validación básica
   if (!ip || !p || Number.isNaN(start) || Number.isNaN(len) || len <= 0) {
      return null;
   }

   // 🧪 MODO SIMULADO: generamos datos falsos
   if (!USE_MODBUS_REAL) {
      return Array.from({ length: len }, (_, i) => ({
         index: i,
         address: start + i,
         value: Math.floor(Math.random() * 501), // 0–500
      }));
   }

   // 🌐 MODO REAL: llamamos a tu server Express
   const resp = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         ip,
         puerto: p,
         indiceInicial: start,
         cantRegistros: len,
      }),
   });

   const data = await resp.json();

   if (!resp.ok || !data.ok) {
      throw new Error(data.error || "Error en lectura Modbus");
   }

   // data.registros viene del server (UInt16[])
   return data.registros.map((v, i) => ({
      index: i,
      address: start + i,
      value: v,
   }));
}
