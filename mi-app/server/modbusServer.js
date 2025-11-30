// server/modbusServer.js
import express from "express";
import cors from "cors";
import ModbusRTU from "modbus-serial";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post("/api/modbus/test", async (req, res) => {
   const { ip, puerto, indiceInicial, cantRegistros } = req.body || {};

   if (!ip || !puerto || !cantRegistros) {
      return res.status(400).json({
         ok: false,
         error: "Faltan datos (ip, puerto, indiceInicial, cantRegistros)",
      });
   }

   const client = new ModbusRTU();

   try {
      // Conectar al relé
      await client.connectTCP(ip, { port: Number(puerto) });
      client.setID(1); // mismo slaveId que usás en VB (1)

      const start = Number(indiceInicial);
      const len = Number(cantRegistros);

      // Leer holding registers
      const resp = await client.readHoldingRegisters(start, len);

      // resp.data es un array de números (UInt16), igual concepto que 'registros' en VB
      const registros = resp.data;

      return res.json({
         ok: true,
         ip,
         puerto: Number(puerto),
         indiceInicial: start,
         cantRegistros: len,
         registros,
      });
   } catch (err) {
      console.error("Error Modbus:", err);
      return res.status(500).json({
         ok: false,
         error: err.message || "Error en lectura Modbus",
      });
   } finally {
      try {
         client.close();
      } catch {}
   }
});

app.listen(PORT, () => {
   console.log(`Modbus server escuchando en http://localhost:${PORT}`);
});
