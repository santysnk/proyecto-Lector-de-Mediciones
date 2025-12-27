# Hoja de Ruta: App Android con Capacitor y Firebase Push Notifications

## Resumen

Convertir la aplicación web React existente en una app Android nativa usando Capacitor, con soporte para notificaciones push via Firebase Cloud Messaging (FCM).

---

## Fase 1: Configuración de Capacitor en el Frontend

### 1.1 Instalar Capacitor

```bash
cd mi-app

# Instalar Capacitor core y CLI
npm install @capacitor/core @capacitor/cli

# Inicializar Capacitor
npx cap init "RelayWatch" "com.relaywatch.app" --web-dir dist
```

**Notas:**
- `RelayWatch`: nombre de la app
- `com.relaywatch.app`: ID único de la app (formato reverse domain)
- `--web-dir dist`: carpeta donde Vite genera el build

### 1.2 Agregar plataforma Android

```bash
# Instalar plataforma Android
npm install @capacitor/android

# Agregar proyecto Android
npx cap add android
```

Esto crea la carpeta `android/` con el proyecto nativo.

### 1.3 Configurar capacitor.config.ts

Crear/editar `mi-app/capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.relaywatch.app',
  appName: 'RelayWatch',
  webDir: 'dist',
  server: {
    // Para desarrollo, conectar al servidor de Vite
    // Comentar en producción
    // url: 'http://192.168.x.x:5174',
    // cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

### 1.4 Build y sincronización

```bash
# Generar build de producción
npm run build

# Sincronizar con proyecto Android
npx cap sync android
```

**Importante:** Ejecutar `npx cap sync android` cada vez que hagas cambios en el código web.

---

## Fase 2: Configuración de Firebase

### 2.1 Crear proyecto en Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `RelayWatch` (o el que prefieras)
4. Desactivar Google Analytics (opcional, no necesario para push)
5. Crear proyecto

### 2.2 Registrar app Android en Firebase

1. En el proyecto Firebase, click en el ícono de Android
2. Completar:
   - **Package name:** `com.relaywatch.app` (debe coincidir con capacitor.config.ts)
   - **App nickname:** RelayWatch (opcional)
   - **SHA-1:** (obtener con el comando abajo, opcional para push básico)
3. Click "Register app"

**Obtener SHA-1 (opcional):**
```bash
cd android
./gradlew signingReport
```

### 2.3 Descargar google-services.json

1. Firebase te dará el archivo `google-services.json`
2. Copiarlo a: `mi-app/android/app/google-services.json`

### 2.4 Configurar build.gradle (proyecto)

Editar `android/build.gradle` (el del proyecto raíz):

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
        // Agregar esta línea para Firebase
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 2.5 Configurar build.gradle (app)

Editar `android/app/build.gradle`:

```gradle
// Al final del archivo, agregar:
apply plugin: 'com.google.gms.google-services'
```

También verificar que las dependencias de Firebase estén:

```gradle
dependencies {
    // ... otras dependencias
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

---

## Fase 3: Plugin de Push Notifications en el Frontend

### 3.1 Instalar plugin de Capacitor

```bash
cd mi-app
npm install @capacitor/push-notifications
npx cap sync android
```

### 3.2 Crear servicio de notificaciones

Crear `mi-app/src/servicios/pushNotifications.js`:

```javascript
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// Verificar si estamos en plataforma nativa
export const esPlataformaNativa = () => {
  return Capacitor.isNativePlatform();
};

// Registrar dispositivo para push notifications
export const registrarPushNotifications = async (onTokenRecibido) => {
  if (!esPlataformaNativa()) {
    console.log('Push notifications solo disponibles en app nativa');
    return null;
  }

  try {
    // Solicitar permisos
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Permisos de notificación denegados');
      return null;
    }

    // Registrar en FCM
    await PushNotifications.register();

    // Listener para recibir el token
    PushNotifications.addListener('registration', (token) => {
      console.log('Token FCM:', token.value);
      if (onTokenRecibido) {
        onTokenRecibido(token.value);
      }
    });

    // Listener para errores de registro
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error registrando push:', error);
    });

    // Listener para notificaciones recibidas (app en primer plano)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Notificación recibida:', notification);
      // Aquí puedes mostrar un toast o actualizar la UI
    });

    // Listener para cuando el usuario toca la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Usuario tocó notificación:', notification);
      // Aquí puedes navegar a una pantalla específica
    });

    return true;
  } catch (error) {
    console.error('Error configurando push notifications:', error);
    return null;
  }
};

// Desregistrar listeners (llamar al desmontar componente)
export const desregistrarPushNotifications = async () => {
  if (!esPlataformaNativa()) return;

  await PushNotifications.removeAllListeners();
};
```

### 3.3 Integrar en la app

Modificar `mi-app/src/App.jsx` o crear un hook:

```javascript
import { useEffect } from 'react';
import { registrarPushNotifications } from './servicios/pushNotifications';
import { registrarTokenDispositivo } from './servicios/apiService';

function App() {
  useEffect(() => {
    const inicializarPush = async () => {
      await registrarPushNotifications(async (token) => {
        // Enviar token al backend para guardarlo
        try {
          await registrarTokenDispositivo(token);
        } catch (error) {
          console.error('Error guardando token:', error);
        }
      });
    };

    inicializarPush();
  }, []);

  // ... resto del componente
}
```

---

## Fase 4: Backend - Almacenar Tokens y Enviar Notificaciones

### 4.1 Crear tabla en Supabase

```sql
CREATE TABLE dispositivos_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  plataforma VARCHAR(20) DEFAULT 'android',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, fcm_token)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_dispositivos_usuario_id ON dispositivos_usuario(usuario_id);
CREATE INDEX idx_dispositivos_activo ON dispositivos_usuario(activo);
```

### 4.2 Instalar Firebase Admin en el backend

```bash
cd lector-mediciones-backend
npm install firebase-admin
```

### 4.3 Configurar Firebase Admin

Obtener credenciales del servicio:
1. Firebase Console → Configuración del proyecto → Cuentas de servicio
2. Click "Generar nueva clave privada"
3. Guardar el JSON descargado de forma segura

Crear `backend/src/config/firebase.js`:

```javascript
const admin = require('firebase-admin');

// Opción 1: Usando variables de entorno (recomendado para producción)
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
};

// Opción 2: Usando archivo JSON (solo desarrollo local)
// const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
```

### 4.4 Agregar variables de entorno

En `.env` del backend:

```env
FIREBASE_PROJECT_ID=relaywatch-xxxxx
FIREBASE_PRIVATE_KEY_ID=xxxxxxxxxxxxxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@relaywatch-xxxxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
```

### 4.5 Crear controller para dispositivos

Crear `backend/src/controllers/dispositivosController.js`:

```javascript
const supabase = require('../config/supabase');

// POST /api/dispositivos/registrar
async function registrarDispositivo(req, res) {
  try {
    const usuarioId = req.user.id;
    const { fcmToken, plataforma = 'android' } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'fcmToken es requerido' });
    }

    // Upsert: insertar o actualizar si ya existe
    const { data, error } = await supabase
      .from('dispositivos_usuario')
      .upsert({
        usuario_id: usuarioId,
        fcm_token: fcmToken,
        plataforma,
        activo: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'usuario_id,fcm_token',
      })
      .select()
      .single();

    if (error) {
      console.error('Error registrando dispositivo:', error);
      return res.status(500).json({ error: 'Error registrando dispositivo' });
    }

    res.json({ mensaje: 'Dispositivo registrado', dispositivo: data });
  } catch (err) {
    console.error('Error en registrarDispositivo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /api/dispositivos/desregistrar
async function desregistrarDispositivo(req, res) {
  try {
    const usuarioId = req.user.id;
    const { fcmToken } = req.body;

    const { error } = await supabase
      .from('dispositivos_usuario')
      .update({ activo: false })
      .eq('usuario_id', usuarioId)
      .eq('fcm_token', fcmToken);

    if (error) {
      console.error('Error desregistrando dispositivo:', error);
      return res.status(500).json({ error: 'Error desregistrando dispositivo' });
    }

    res.json({ mensaje: 'Dispositivo desregistrado' });
  } catch (err) {
    console.error('Error en desregistrarDispositivo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  registrarDispositivo,
  desregistrarDispositivo,
};
```

### 4.6 Crear servicio de notificaciones

Crear `backend/src/servicios/notificacionesService.js`:

```javascript
const admin = require('../config/firebase');
const supabase = require('../config/supabase');

/**
 * Envía una notificación push a un usuario específico
 */
async function enviarNotificacionAUsuario(usuarioId, titulo, cuerpo, datos = {}) {
  try {
    // Obtener tokens activos del usuario
    const { data: dispositivos, error } = await supabase
      .from('dispositivos_usuario')
      .select('fcm_token')
      .eq('usuario_id', usuarioId)
      .eq('activo', true);

    if (error || !dispositivos || dispositivos.length === 0) {
      console.log(`No hay dispositivos activos para usuario ${usuarioId}`);
      return { enviados: 0, errores: 0 };
    }

    const tokens = dispositivos.map(d => d.fcm_token);

    // Enviar a todos los dispositivos del usuario
    const mensaje = {
      notification: {
        title: titulo,
        body: cuerpo,
      },
      data: {
        ...datos,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Para manejo en app
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(mensaje);

    console.log(`Notificaciones enviadas: ${response.successCount} éxitos, ${response.failureCount} fallos`);

    // Desactivar tokens inválidos
    if (response.failureCount > 0) {
      const tokensInvalidos = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
          tokensInvalidos.push(tokens[idx]);
        }
      });

      if (tokensInvalidos.length > 0) {
        await supabase
          .from('dispositivos_usuario')
          .update({ activo: false })
          .in('fcm_token', tokensInvalidos);
      }
    }

    return {
      enviados: response.successCount,
      errores: response.failureCount,
    };
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return { enviados: 0, errores: 1, error: error.message };
  }
}

/**
 * Envía notificación a todos los usuarios de un workspace
 */
async function enviarNotificacionAWorkspace(workspaceId, titulo, cuerpo, datos = {}) {
  try {
    // Obtener usuarios del workspace
    const { data: usuarios, error } = await supabase
      .from('usuario_workspaces')
      .select('usuario_id')
      .eq('workspace_id', workspaceId);

    if (error || !usuarios) {
      return { enviados: 0, errores: 0 };
    }

    let totalEnviados = 0;
    let totalErrores = 0;

    for (const u of usuarios) {
      const resultado = await enviarNotificacionAUsuario(u.usuario_id, titulo, cuerpo, datos);
      totalEnviados += resultado.enviados;
      totalErrores += resultado.errores;
    }

    return { enviados: totalEnviados, errores: totalErrores };
  } catch (error) {
    console.error('Error enviando notificación a workspace:', error);
    return { enviados: 0, errores: 1, error: error.message };
  }
}

module.exports = {
  enviarNotificacionAUsuario,
  enviarNotificacionAWorkspace,
};
```

### 4.7 Agregar rutas al backend

En `backend/src/routes/index.js`:

```javascript
const dispositivosController = require('../controllers/dispositivosController');

// Rutas de dispositivos (requieren autenticación)
router.post('/api/dispositivos/registrar', auth, dispositivosController.registrarDispositivo);
router.delete('/api/dispositivos/desregistrar', auth, dispositivosController.desregistrarDispositivo);
```

### 4.8 Agregar endpoint al frontend

En `mi-app/src/servicios/apiService.js`:

```javascript
/**
 * Registra el token FCM del dispositivo
 */
export async function registrarTokenDispositivo(fcmToken, plataforma = 'android') {
  return fetchConAuth('/api/dispositivos/registrar', {
    method: 'POST',
    body: JSON.stringify({ fcmToken, plataforma }),
  });
}

/**
 * Desregistra el token FCM del dispositivo
 */
export async function desregistrarTokenDispositivo(fcmToken) {
  return fetchConAuth('/api/dispositivos/desregistrar', {
    method: 'DELETE',
    body: JSON.stringify({ fcmToken }),
  });
}
```

---

## Fase 5: Lógica de Alertas (Alimentador sin Servicio)

### 5.1 Crear servicio de monitoreo

Crear `backend/src/servicios/monitoreoService.js`:

```javascript
const supabase = require('../config/supabase');
const { enviarNotificacionAWorkspace } = require('./notificacionesService');

// Tiempo máximo sin lectura antes de alertar (en minutos)
const TIEMPO_ALERTA_MINUTOS = 5;

/**
 * Verifica alimentadores sin lecturas recientes y envía alertas
 * Esta función debería ejecutarse periódicamente (cron job)
 */
async function verificarAlimentadoresSinLectura() {
  try {
    const tiempoLimite = new Date(Date.now() - TIEMPO_ALERTA_MINUTOS * 60 * 1000);

    // Obtener alimentadores con sus últimas lecturas
    const { data: alimentadores, error } = await supabase
      .from('alimentadores')
      .select(`
        id,
        nombre,
        card_design,
        puestos (
          id,
          nombre,
          workspace_id
        )
      `);

    if (error) {
      console.error('Error obteniendo alimentadores:', error);
      return;
    }

    for (const alim of alimentadores) {
      // Obtener registradores configurados en el alimentador
      const registradorIds = obtenerRegistradoresDeAlimentador(alim.card_design);

      if (registradorIds.length === 0) continue;

      // Verificar última lectura de cada registrador
      for (const regId of registradorIds) {
        const { data: ultimaLectura } = await supabase
          .from('lecturas')
          .select('timestamp')
          .eq('registrador_id', regId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (!ultimaLectura || new Date(ultimaLectura.timestamp) < tiempoLimite) {
          // Alimentador sin lectura reciente - enviar alerta
          await enviarNotificacionAWorkspace(
            alim.puestos.workspace_id,
            `⚠️ Alerta: ${alim.nombre}`,
            `Sin lectura hace más de ${TIEMPO_ALERTA_MINUTOS} minutos`,
            {
              tipo: 'alerta_sin_lectura',
              alimentador_id: alim.id,
              puesto_id: alim.puestos.id,
            }
          );

          // Registrar alerta en base de datos (opcional)
          await registrarAlerta(alim.id, 'sin_lectura', regId);
        }
      }
    }
  } catch (error) {
    console.error('Error en verificarAlimentadoresSinLectura:', error);
  }
}

/**
 * Extrae IDs de registradores del card_design
 */
function obtenerRegistradoresDeAlimentador(cardDesign) {
  const ids = [];
  if (cardDesign?.superior?.registrador_id) {
    ids.push(cardDesign.superior.registrador_id);
  }
  if (cardDesign?.inferior?.registrador_id) {
    ids.push(cardDesign.inferior.registrador_id);
  }
  return ids;
}

/**
 * Registra una alerta en la base de datos
 */
async function registrarAlerta(alimentadorId, tipo, registradorId = null) {
  await supabase.from('alertas').insert({
    alimentador_id: alimentadorId,
    tipo,
    registrador_id: registradorId,
    mensaje: `Alerta de tipo ${tipo}`,
  });
}

module.exports = {
  verificarAlimentadoresSinLectura,
};
```

### 5.2 Configurar cron job

Opción A: Usando node-cron en el backend:

```bash
npm install node-cron
```

En `backend/src/index.js`:

```javascript
const cron = require('node-cron');
const { verificarAlimentadoresSinLectura } = require('./servicios/monitoreoService');

// Ejecutar cada minuto
cron.schedule('* * * * *', () => {
  console.log('Verificando alimentadores sin lectura...');
  verificarAlimentadoresSinLectura();
});
```

Opción B: Usando Supabase Edge Functions o Render Cron Jobs (más robusto para producción).

---

## Fase 6: Compilar y Probar

### 6.1 Compilar APK de debug

```bash
cd mi-app

# Build del frontend
npm run build

# Sincronizar con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

En Android Studio:
1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. El APK estará en `android/app/build/outputs/apk/debug/`

### 6.2 Instalar en dispositivo

Opción A: Conectar dispositivo por USB
1. Habilitar "Opciones de desarrollador" en el teléfono
2. Habilitar "Depuración USB"
3. Conectar por USB
4. En Android Studio: Run → Run 'app'

Opción B: Transferir APK
1. Copiar el APK al teléfono
2. Instalar manualmente (requiere habilitar "Orígenes desconocidos")

### 6.3 Probar notificaciones

1. Abrir la app en el dispositivo
2. Iniciar sesión
3. Verificar en los logs que se registró el token FCM
4. Desde Firebase Console → Cloud Messaging → "Send your first message"
5. Enviar notificación de prueba al token

---

## Fase 7: Compilar APK de Release (Producción)

### 7.1 Generar keystore

```bash
cd android/app
keytool -genkey -v -keystore relaywatch-release.keystore -alias relaywatch -keyalg RSA -keysize 2048 -validity 10000
```

**Guardar la contraseña de forma segura - la necesitarás para futuras actualizaciones.**

### 7.2 Configurar signing

Crear `android/app/signing.properties` (no commitear):

```properties
storeFile=relaywatch-release.keystore
storePassword=TU_PASSWORD
keyAlias=relaywatch
keyPassword=TU_PASSWORD
```

Modificar `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            def signingProps = new Properties()
            signingProps.load(new FileInputStream(file('signing.properties')))
            storeFile file(signingProps['storeFile'])
            storePassword signingProps['storePassword']
            keyAlias signingProps['keyAlias']
            keyPassword signingProps['keyPassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 7.3 Compilar release

```bash
cd android
./gradlew assembleRelease
```

El APK firmado estará en `android/app/build/outputs/apk/release/`

---

## Checklist Final

### Frontend (mi-app)
- [ ] Instalar @capacitor/core, @capacitor/cli, @capacitor/android
- [ ] Configurar capacitor.config.ts
- [ ] Instalar @capacitor/push-notifications
- [ ] Crear servicio pushNotifications.js
- [ ] Integrar registro de token en App.jsx
- [ ] Agregar endpoints en apiService.js

### Firebase
- [ ] Crear proyecto en Firebase Console
- [ ] Registrar app Android
- [ ] Descargar google-services.json
- [ ] Configurar build.gradle (proyecto y app)

### Backend
- [ ] Crear tabla dispositivos_usuario en Supabase
- [ ] Instalar firebase-admin
- [ ] Configurar credenciales de Firebase
- [ ] Crear dispositivosController.js
- [ ] Crear notificacionesService.js
- [ ] Crear monitoreoService.js
- [ ] Agregar rutas de dispositivos
- [ ] Configurar cron job para verificación

### Android
- [ ] Sincronizar proyecto (npx cap sync android)
- [ ] Configurar google-services.json
- [ ] Probar en emulador/dispositivo
- [ ] Generar keystore para release
- [ ] Compilar APK firmado

---

## Comandos Útiles

```bash
# Desarrollo
npm run build && npx cap sync android    # Sincronizar cambios
npx cap open android                      # Abrir Android Studio
npx cap run android                       # Correr en dispositivo conectado

# Logs
npx cap run android -l                    # Correr con live reload
adb logcat | grep -i "capacitor\|push"    # Ver logs de Android

# Build
cd android && ./gradlew assembleDebug     # APK debug
cd android && ./gradlew assembleRelease   # APK release
```

---

## Consideraciones de Seguridad

1. **Nunca commitear:**
   - `google-services.json`
   - `signing.properties`
   - Archivo de credenciales de Firebase Admin
   - Keystore (.keystore, .jks)

2. **Variables de entorno:**
   - Usar variables de entorno para credenciales de Firebase en producción
   - En Render: agregar las variables en el dashboard

3. **Tokens FCM:**
   - Los tokens pueden expirar o invalidarse
   - Implementar lógica para refrescar tokens
   - Desactivar tokens que fallen repetidamente

---

## Troubleshooting

### Error: "google-services.json not found"
- Verificar que el archivo está en `android/app/google-services.json`
- Ejecutar `npx cap sync android`

### Notificaciones no llegan
- Verificar que el token se registró correctamente
- Comprobar logs de Firebase Admin en el backend
- Verificar que el dispositivo tiene conexión a internet

### App no abre después de tocar notificación
- Verificar el `click_action` en la data del mensaje
- Implementar manejo en `pushNotificationActionPerformed`

### Error de compilación Gradle
- Verificar versiones de plugins en build.gradle
- Ejecutar `cd android && ./gradlew clean`
- Verificar que Android Studio tiene las SDK tools actualizadas
