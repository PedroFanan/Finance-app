// Geração de ícones PNG usando Node.js puro (sem deps externas)
// Execute: node scripts/generate-icons.mjs

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import zlib from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Create PNG from raw RGBA pixels
function createPNG(width, height, pixels) {
  const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeBuffer = Buffer.from(type, 'ascii')
    const combined = Buffer.concat([typeBuffer, data])
    const crc = Buffer.alloc(4)
    crc.writeInt32BE(crcCalc(combined))
    return Buffer.concat([len, typeBuffer, data, crc])
  }

  // CRC32
  const crcTable = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })()

  function crcCalc(buf) {
    let c = 0xffffffff
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) | 0
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Raw image data (filter byte + RGB per row)
  const rawData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 3
      const ri = y * (1 + width * 3) + 1 + x * 3
      rawData[ri] = pixels[pi]
      rawData[ri + 1] = pixels[pi + 1]
      rawData[ri + 2] = pixels[pi + 2]
    }
  }

  const compressed = zlib.deflateSync(rawData)
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function generateIconPixels(size) {
  const pixels = new Uint8Array(size * size * 3)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Rounded square (aproximado com círculo no border)
      const rx = Math.abs(dx) / (size * 0.42)
      const ry = Math.abs(dy) / (size * 0.42)
      const inRoundedRect = Math.pow(rx, 6) + Math.pow(ry, 6) <= 1

      if (!inRoundedRect) {
        // Transparent → branco (fundo)
        pixels[i] = 255; pixels[i+1] = 255; pixels[i+2] = 255
        continue
      }

      // Background azul escuro
      let r = 30, g = 64, b = 175

      // Barras do gráfico
      const pad = size * 0.15
      const barCount = 5
      const barW = (size - pad * 2) / barCount
      const barHeights = [0.35, 0.6, 0.45, 0.75, 0.55]
      const maxH = size * 0.55
      const baseY = size * 0.80

      let isBar = false
      for (let bi = 0; bi < barCount; bi++) {
        const bx0 = pad + bi * barW + barW * 0.12
        const bx1 = bx0 + barW * 0.76
        const bh = maxH * barHeights[bi]
        const by0 = baseY - bh
        if (x >= bx0 && x <= bx1 && y >= by0 && y <= baseY) {
          if (bi === 3) {
            r = 255; g = 255; b = 255 // barra destaque branca
          } else {
            r = 96; g = 165; b = 250 // barras azul claro
          }
          isBar = true
          break
        }
      }

      // Linha de tendência (diagonal)
      if (!isBar) {
        const lineY = size * 0.72 - (x / size) * size * 0.35
        if (Math.abs(y - lineY) <= size * 0.018) {
          r = 134; g = 239; b = 172 // verde
        }
      }

      pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b
    }
  }
  return pixels
}

const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

for (const size of sizes) {
  const pixels = generateIconPixels(size)
  const png = createPNG(size, size, pixels)
  writeFileSync(join(outDir, `icon-${size}x${size}.png`), png)
  console.log(`✅ icon-${size}x${size}.png`)
}
console.log('\n🎉 Ícones gerados em public/icons/')
