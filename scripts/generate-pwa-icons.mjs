import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Simple solid/gradient PNG with pulse emblem
  const buffer = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded claymorphic squircle
      if (dist <= radius) {
        // Gradient from indigo #6366F1 to violet #8B5CF6
        const t = (x + y) / (width + height);
        const curR = Math.round(99 + t * (139 - 99));
        const curG = Math.round(102 + t * (92 - 102));
        const curB = Math.round(241 + t * (246 - 241));

        // Draw central pulse / heartbeat glyph
        const nx = (x - cx) / (width * 0.25);
        const ny = (y - cy) / (height * 0.25);
        const isPulse =
          Math.abs(ny - Math.sin(nx * 3) * 0.5) < 0.2 && Math.abs(nx) < 1.2;

        if (isPulse) {
          buffer[idx] = 255;
          buffer[idx + 1] = 255;
          buffer[idx + 2] = 255;
          buffer[idx + 3] = 255;
        } else {
          buffer[idx] = curR;
          buffer[idx + 1] = curG;
          buffer[idx + 2] = curB;
          buffer[idx + 3] = 255;
        }
      } else {
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  // Build raw scanlines (filter type 0: None)
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (1 + width * 4);
    rawScanlines[rawOffset] = 0; // Filter None
    buffer.copy(rawScanlines, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(rawScanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced

  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(4 + 4 + len + 4);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4);
    data.copy(chunk, 8);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    chunk.writeUInt32BE(crc, 8 + len);
    return chunk;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const png192 = createPng(192, 192, 99, 102, 241);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);

const png512 = createPng(512, 512, 99, 102, 241);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);

console.log('✅ PWA Icons generated: icon-192.png & icon-512.png');
