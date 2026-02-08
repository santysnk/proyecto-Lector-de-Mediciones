// hooks/agentes/registradoresConfigUtils.js
// Constantes y funciones puras para useRegistradoresConfig

export const REGISTRADOR_INICIAL = {
   nombre: '',
   tipo: 'modbus',
   tipoDispositivo: 'analizador',
   ip: '',
   puerto: '',
   unitId: '',
   indiceInicial: '',
   cantidadRegistros: '',
   intervaloSegundos: '',
   configuracionRele: null,
   configuracionAnalizador: null,
};

export function prepararDatosRegistrador(formData) {
   const esRele = formData.tipoDispositivo === 'rele';
   const esAnalizador = formData.tipoDispositivo === 'analizador';

   if (esRele && formData.configuracionRele) {
      const configRele = formData.configuracionRele;
      return {
         nombre: formData.nombre,
         tipo: 'modbus',
         tipoDispositivo: 'rele',
         ip: configRele.conexion.ip,
         puerto: String(configRele.conexion.puerto || 502),
         unitId: String(configRele.conexion.unitId || 1),
         indiceInicial: String(configRele.registroInicial || 120),
         cantidadRegistros: String(configRele.cantidadRegistros || 80),
         intervaloSegundos: '60',
         plantillaId: configRele.plantillaId || null,
         configuracionRele: configRele,
      };
   }

   if (esAnalizador && formData.configuracionAnalizador) {
      const configAnalizador = formData.configuracionAnalizador;
      return {
         nombre: formData.nombre,
         tipo: 'modbus',
         tipoDispositivo: 'analizador',
         ip: configAnalizador.conexion?.ip || formData.ip,
         puerto: String(configAnalizador.conexion?.puerto || formData.puerto || 502),
         unitId: String(configAnalizador.conexion?.unitId || formData.unitId || 1),
         indiceInicial: String(configAnalizador.registroInicial || formData.indiceInicial || 0),
         cantidadRegistros: String(configAnalizador.cantidadRegistros || formData.cantidadRegistros || 10),
         intervaloSegundos: '60',
         plantillaId: configAnalizador.plantillaId || null,
         configuracionRele: configAnalizador,
      };
   }

   return {
      ...formData,
      tipoDispositivo: formData.tipoDispositivo || 'analizador',
      unitId: formData.unitId || '1',
      intervaloSegundos: formData.intervaloSegundos || '60',
   };
}

export function mapearRegistradorAFormulario(reg) {
   const configuracion = reg.configuracion_completa || reg.configuracion_rele || null;
   return {
      nombre: reg.nombre || '',
      tipo: reg.tipo || 'modbus',
      tipoDispositivo: reg.tipo_dispositivo || 'analizador',
      ip: reg.ip || '',
      puerto: String(reg.puerto || '502'),
      unitId: String(reg.unit_id || '1'),
      indiceInicial: String(reg.indice_inicial || '0'),
      cantidadRegistros: String(reg.cantidad_registros || '10'),
      intervaloSegundos: String(reg.intervalo_segundos || '60'),
      configuracionRele: configuracion,
      configuracionAnalizador: configuracion,
   };
}

export function construirDatosTest(datosForm) {
   return {
      nombre: datosForm.nombre || 'Test',
      ip: datosForm.ip,
      puerto: parseInt(datosForm.puerto),
      unit_id: parseInt(datosForm.unitId) || 1,
      indice_inicial: parseInt(datosForm.indiceInicial),
      cantidad_registros: parseInt(datosForm.cantidadRegistros),
   };
}
