import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createSimplePng(width, height) {
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrLen = Buffer.alloc(4); ihdrLen.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrCrc = calcCrc(Buffer.concat([ihdrType, ihdrData]));
  const ihdrChunk = Buffer.concat([ihdrLen, ihdrType, ihdrData, ihdrCrc]);

  // IDAT raw pixels (RGBA)
  const rawData = [];
  const radius = Math.floor(width * 0.4);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  for (let y = 0; y < height; y++) {
    rawData.push(0); // No filter byte for line
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dark slate background: #0f172a
      let r = 15, g = 23, b = 42, a = 255;

      // Cyan accent target border & crosshair: #38bdf8
      if (Math.abs(dist - radius) < Math.max(1, width * 0.08)) {
        r = 56; g = 189; b = 248;
      } else if (dist < Math.max(1, width * 0.12)) {
        // Emerald center dot: #10b981
        r = 16; g = 185; b = 129;
      }

      rawData.push(r, g, b, a);
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const compressedData = zlib.deflateSync(rawBuffer);

  const idatLen = Buffer.alloc(4); idatLen.writeUInt32BE(compressedData.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrc = calcCrc(Buffer.concat([idatType, compressedData]));
  const idatChunk = Buffer.concat([idatLen, idatType, compressedData, idatCrc]);

  // IEND chunk
  const iendLen = Buffer.alloc(4); iendLen.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCrc = calcCrc(iendType);
  const iendChunk = Buffer.concat([iendLen, iendType, iendCrc]);

  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

function calcCrc(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (byte ^ crc) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  const res = Buffer.alloc(4);
  res.writeUInt32BE((crc ^ -1) >>> 0, 0);
  return res;
}

function run() {
  const iconsDir = path.join(process.cwd(), 'assets', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sizes = [16, 48, 128];
  for (const size of sizes) {
    const pngBuf = createSimplePng(size, size);
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), pngBuf);
    console.log(`Generated icon${size}.png`);
  }
}

run();
