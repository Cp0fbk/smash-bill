/**
 * Pure TypeScript ISO/IEC 18004 QR Code Generator (Byte Mode, Error Correction Level L, Versions 1..10).
 * Generates a boolean matrix and crisp SVG markup without any external runtime dependencies.
 */

interface VersionSpec {
  version: number;
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocksGroup1: number;
  dataCodewordsGroup1: number;
  numBlocksGroup2: number;
  dataCodewordsGroup2: number;
  alignmentCoords: number[];
}

// ISO/IEC 18004 EC Level L table for Versions 1..10
const VERSION_SPECS_L: VersionSpec[] = [
  {
    version: 1,
    totalCodewords: 26,
    ecCodewordsPerBlock: 7,
    numBlocksGroup1: 1,
    dataCodewordsGroup1: 19,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [],
  },
  {
    version: 2,
    totalCodewords: 44,
    ecCodewordsPerBlock: 10,
    numBlocksGroup1: 1,
    dataCodewordsGroup1: 34,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 18],
  },
  {
    version: 3,
    totalCodewords: 70,
    ecCodewordsPerBlock: 15,
    numBlocksGroup1: 1,
    dataCodewordsGroup1: 55,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 22],
  },
  {
    version: 4,
    totalCodewords: 100,
    ecCodewordsPerBlock: 20,
    numBlocksGroup1: 1,
    dataCodewordsGroup1: 80,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 26],
  },
  {
    version: 5,
    totalCodewords: 134,
    ecCodewordsPerBlock: 26,
    numBlocksGroup1: 1,
    dataCodewordsGroup1: 108,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 30],
  },
  {
    version: 6,
    totalCodewords: 172,
    ecCodewordsPerBlock: 18,
    numBlocksGroup1: 2,
    dataCodewordsGroup1: 68,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 34],
  },
  {
    version: 7,
    totalCodewords: 196,
    ecCodewordsPerBlock: 20,
    numBlocksGroup1: 2,
    dataCodewordsGroup1: 78,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 22, 38],
  },
  {
    version: 8,
    totalCodewords: 242,
    ecCodewordsPerBlock: 24,
    numBlocksGroup1: 2,
    dataCodewordsGroup1: 97,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 24, 42],
  },
  {
    version: 9,
    totalCodewords: 292,
    ecCodewordsPerBlock: 30,
    numBlocksGroup1: 2,
    dataCodewordsGroup1: 116,
    numBlocksGroup2: 0,
    dataCodewordsGroup2: 0,
    alignmentCoords: [6, 26, 46],
  },
  {
    version: 10,
    totalCodewords: 346,
    ecCodewordsPerBlock: 18,
    numBlocksGroup1: 2,
    dataCodewordsGroup1: 68,
    numBlocksGroup2: 2,
    dataCodewordsGroup2: 69,
    alignmentCoords: [6, 28, 50],
  },
];

// GF(256) tables with primitive polynomial 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function buildGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomon(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = buildGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      rem[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return rem;
}

function selectVersion(byteLength: number): VersionSpec {
  for (const spec of VERSION_SPECS_L) {
    const capacityBytes =
      spec.numBlocksGroup1 * spec.dataCodewordsGroup1 +
      spec.numBlocksGroup2 * spec.dataCodewordsGroup2;
    const headerBits = spec.version <= 9 ? 4 + 8 : 4 + 16;
    const neededCodewords = Math.ceil((headerBits + byteLength * 8) / 8);
    if (neededCodewords <= capacityBytes) {
      return spec;
    }
  }
  throw new Error(`QR payload too long (${byteLength} bytes)`);
}

function buildDataCodewords(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const totalDataCodewords =
    spec.numBlocksGroup1 * spec.dataCodewordsGroup1 +
    spec.numBlocksGroup2 * spec.dataCodewordsGroup2;
  const bits: number[] = [];

  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Byte mode indicator (0100)
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for v1..9, 16 bits for v10+)
  pushBits(bytes.length, spec.version <= 9 ? 8 : 16);

  for (const b of bytes) {
    pushBits(b, 8);
  }

  const maxBits = totalDataCodewords * 8;
  const terminatorLen = Math.min(4, maxBits - bits.length);
  pushBits(0, terminatorLen);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords = new Uint8Array(totalDataCodewords);
  const byteCount = bits.length / 8;
  for (let i = 0; i < byteCount; i++) {
    let val = 0;
    for (let b = 0; b < 8; b++) {
      val = (val << 1) | bits[i * 8 + b];
    }
    codewords[i] = val;
  }

  const padBytes = [0xec, 0x11];
  for (let i = byteCount; i < totalDataCodewords; i++) {
    codewords[i] = padBytes[(i - byteCount) % 2];
  }

  return codewords;
}

function interleaveCodewords(dataCodewords: Uint8Array, spec: VersionSpec): Uint8Array {
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.numBlocksGroup1; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataCodewordsGroup1);
    offset += spec.dataCodewordsGroup1;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomon(block, spec.ecCodewordsPerBlock));
  }

  for (let i = 0; i < spec.numBlocksGroup2; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataCodewordsGroup2);
    offset += spec.dataCodewordsGroup2;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomon(block, spec.ecCodewordsPerBlock));
  }

  const result = new Uint8Array(spec.totalCodewords);
  let pos = 0;
  const maxDataLen = Math.max(spec.dataCodewordsGroup1, spec.dataCodewordsGroup2);

  for (let col = 0; col < maxDataLen; col++) {
    for (const block of dataBlocks) {
      if (col < block.length) {
        result[pos++] = block[col];
      }
    }
  }

  for (let col = 0; col < spec.ecCodewordsPerBlock; col++) {
    for (const block of ecBlocks) {
      result[pos++] = block[col];
    }
  }

  return result;
}

function computeFormatBits(ecIndicator: number, mask: number): number {
  const data = (ecIndicator << 3) | mask;
  let rem = data << 10;
  for (let i = 4; i >= 0; i--) {
    if ((rem >>> (i + 10)) & 1) {
      rem ^= 0x537 << i;
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function computeVersionBits(version: number): number {
  let rem = version << 12;
  for (let i = 5; i >= 0; i--) {
    if ((rem >>> (i + 12)) & 1) {
      rem ^= 0x1f25 << i;
    }
  }
  return (version << 12) | rem;
}

/**
 * Encodes a string into a square QR Code boolean matrix (`true` = dark module).
 */
export function encodeQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const spec = selectVersion(bytes.length);
  const size = spec.version * 4 + 17;

  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(top + dr, left + dc, inOuter && (onBorder || inCore));
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    setFunctionModule(6, i, dark);
    setFunctionModule(i, 6, dark);
  }

  // Alignment patterns
  const coords = spec.alignmentCoords;
  for (const r of coords) {
    for (const c of coords) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Dark module
  setFunctionModule(size - 8, 8, true);

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      if (!isFunction[8][i]) isFunction[8][i] = true;
      if (!isFunction[i][8]) isFunction[i][8] = true;
    }
    if (i < 8) {
      if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
      if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
    }
  }

  // Version info for v >= 7
  if (spec.version >= 7) {
    const vBits = computeVersionBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vBits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }

  // Place data bits (zigzag from bottom-right)
  const dataCodewords = buildDataCodewords(bytes, spec);
  const allCodewords = interleaveCodewords(dataCodewords, spec);
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    const upward = ((size - 1 - right) & 2) === 0;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((allCodewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
    }
  }

  // Apply Mask 0 ((r + c) % 2 === 0) and write format info (EC Level L indicator = 0b01)
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && (r + c) % 2 === 0) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  const formatBits = computeFormatBits(0b01, mask);
  for (let i = 0; i <= 5; i++) modules[8][i] = ((formatBits >>> i) & 1) === 1;
  modules[8][7] = ((formatBits >>> 6) & 1) === 1;
  modules[8][8] = ((formatBits >>> 7) & 1) === 1;
  modules[7][8] = ((formatBits >>> 8) & 1) === 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = ((formatBits >>> i) & 1) === 1;

  for (let i = 0; i < 8; i++) modules[8][size - 1 - i] = ((formatBits >>> i) & 1) === 1;
  for (let i = 8; i < 15; i++) modules[size - 15 + i][8] = ((formatBits >>> i) & 1) === 1;

  return modules;
}

export interface QrSvgOptions {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Renders a QR code string into a crisp, self-contained `<svg>` string.
 */
export function renderQrSvg(text: string, options: QrSvgOptions = {}): string {
  const matrix = encodeQrMatrix(text);
  const moduleCount = matrix.length;
  const margin = options.margin ?? 2;
  const totalSize = moduleCount + margin * 2;
  const pixelSize = options.size ?? 220;
  const darkColor = options.darkColor ?? '#0F172A';
  const lightColor = options.lightColor ?? '#FFFFFF';

  const paths: string[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        paths.push(`M${c + margin},${r + margin}h1v1h-1z`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges" role="img" aria-label="QR Code"><rect width="100%" height="100%" fill="${lightColor}"/><path d="${paths.join('')}" fill="${darkColor}"/></svg>`;
}
