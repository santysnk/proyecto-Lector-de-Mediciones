/**
 * Script para generar iconos de Android a partir de la imagen 1024x1024
 * Genera todos los tamaños necesarios para mipmap-* folders
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tamaños para cada densidad de Android
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Tamaño del foreground (para adaptive icons) - 108dp base con safe zone
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432
};

const sourceImage = path.join(__dirname, 'src/assets/imagenes/relaywatch_android_icon_1024.png');
const androidResPath = path.join(__dirname, 'android/app/src/main/res');

async function generateIcons() {
  console.log('🎨 Generando iconos de Android...\n');

  // Verificar que la imagen fuente existe
  if (!fs.existsSync(sourceImage)) {
    console.error('❌ No se encontró la imagen fuente:', sourceImage);
    process.exit(1);
  }

  // Generar ic_launcher.png para cada densidad
  for (const [folder, size] of Object.entries(sizes)) {
    const outputPath = path.join(androidResPath, folder, 'ic_launcher.png');

    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`✅ ${folder}/ic_launcher.png (${size}x${size})`);
  }

  // Generar ic_launcher_round.png para cada densidad
  for (const [folder, size] of Object.entries(sizes)) {
    const outputPath = path.join(androidResPath, folder, 'ic_launcher_round.png');

    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`✅ ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generar ic_launcher_foreground.png para adaptive icons (Android 8+)
  for (const [folder, size] of Object.entries(foregroundSizes)) {
    const outputPath = path.join(androidResPath, folder, 'ic_launcher_foreground.png');

    // Para foreground, el icono real debe ocupar ~66% del tamaño total (safe zone)
    const iconSize = Math.round(size * 0.66);
    const padding = Math.round((size - iconSize) / 2);

    await sharp(sourceImage)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .resize(size, size) // Asegurar tamaño exacto
      .png()
      .toFile(outputPath);

    console.log(`✅ ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  console.log('\n🎉 ¡Iconos generados exitosamente!');
  console.log('\nPróximos pasos:');
  console.log('1. Ejecuta: npx cap sync android');
  console.log('2. Compila el APK con el nuevo icono');
}

generateIcons().catch(console.error);
