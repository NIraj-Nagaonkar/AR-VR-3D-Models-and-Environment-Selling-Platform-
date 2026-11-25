/**
 * Minimalist Procedural GLB (Binary glTF 2.0) Generator
 * Synthesizes valid, standalone .glb 3D files from manifest geometry parts.
 * Compatible with Three.js GLTFLoader, Babylon.js, Unity, and Windows 3D Viewer.
 */

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
    1.0
  ];
}

function generateBoxGeometry(sx, sy, sz) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  // 24 vertices (4 per face)
  const positions = [
    // Front
    -hx, -hy,  hz,   hx, -hy,  hz,   hx,  hy,  hz,  -hx,  hy,  hz,
    // Back
     hx, -hy, -hz,  -hx, -hy, -hz,  -hx,  hy, -hz,   hx,  hy, -hz,
    // Top
    -hx,  hy,  hz,   hx,  hy,  hz,   hx,  hy, -hz,  -hx,  hy, -hz,
    // Bottom
    -hx, -hy, -hz,   hx, -hy, -hz,   hx, -hy,  hz,  -hx, -hy,  hz,
    // Right
     hx, -hy,  hz,   hx, -hy, -hz,   hx,  hy, -hz,   hx,  hy,  hz,
    // Left
    -hx, -hy, -hz,  -hx, -hy,  hz,  -hx,  hy,  hz,  -hx,  hy, -hz
  ];

  const indices = [];
  for (let f = 0; f < 6; f++) {
    const base = f * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, indices };
}

function generateProceduralGlb(manifest) {
  const parts = manifest.parts || [
    { id: 'root', shape: 'box', transform: { position: [0, 0, 0], scale: [1, 1, 1] }, material: { color: '#0284c7' } }
  ];

  let allPositions = [];
  let allIndices = [];
  let indexOffset = 0;

  for (const p of parts) {
    const pos = p.transform?.position || [0, 0, 0];
    const scl = p.transform?.scale || [1, 1, 1];
    const geom = generateBoxGeometry(scl[0], scl[1], scl[2]);

    for (let i = 0; i < geom.positions.length; i += 3) {
      allPositions.push(
        geom.positions[i] + pos[0],
        geom.positions[i + 1] + pos[1],
        geom.positions[i + 2] + pos[2]
      );
    }

    for (const idx of geom.indices) {
      allIndices.push(idx + indexOffset);
    }
    indexOffset += geom.positions.length / 3;
  }

  // Convert to typed arrays
  const posArray = new Float32Array(allPositions);
  const indArray = new Uint16Array(allIndices);

  // Compute bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < posArray.length; i += 3) {
    minX = Math.min(minX, posArray[i]);
    minY = Math.min(minY, posArray[i + 1]);
    minZ = Math.min(minZ, posArray[i + 2]);
    maxX = Math.max(maxX, posArray[i]);
    maxY = Math.max(maxY, posArray[i + 1]);
    maxZ = Math.max(maxZ, posArray[i + 2]);
  }

  // Pad buffer to 4-byte boundary
  const indByteLen = indArray.byteLength;
  const indPad = (4 - (indByteLen % 4)) % 4;
  const posByteLen = posArray.byteLength;

  const totalBinaryLen = indByteLen + indPad + posByteLen;
  const binaryBuffer = Buffer.alloc(totalBinaryLen);

  Buffer.from(indArray.buffer).copy(binaryBuffer, 0);
  Buffer.from(posArray.buffer).copy(binaryBuffer, indByteLen + indPad);

  const primaryColor = parts[0]?.material?.color ? hexToRgb(parts[0].material.color) : [0.01, 0.52, 0.78, 1.0];

  const gltf = {
    asset: { version: '2.0', generator: 'Aether3D AI Engine' },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: manifest.assetName || 'GeneratedModel' }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 1 },
        indices: 0,
        material: 0
      }]
    }],
    materials: [{
      name: 'PBR_Material',
      pbrMetallicRoughness: {
        baseColorFactor: primaryColor,
        metallicFactor: parts[0]?.material?.metallic ?? 0.8,
        roughnessFactor: parts[0]?.material?.roughness ?? 0.3
      }
    }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: indArray.length,
        type: 'SCALAR',
        min: [0],
        max: [allPositions.length / 3 - 1]
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126, // FLOAT
        count: posArray.length / 3,
        type: 'VEC3',
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: indByteLen,
        target: 34963 // ELEMENT_ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: indByteLen + indPad,
        byteLength: posByteLen,
        target: 34962 // ARRAY_BUFFER
      }
    ],
    buffers: [{ byteLength: totalBinaryLen }]
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBuf = Buffer.from(jsonStr, 'utf8');
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const jsonChunkLen = jsonBuf.length + jsonPad;

  const glbHeaderLen = 12;
  const chunkHeaderLen = 8;
  const totalGlbLen = glbHeaderLen + chunkHeaderLen + jsonChunkLen + chunkHeaderLen + totalBinaryLen;

  const glb = Buffer.alloc(totalGlbLen);

  // GLB Header
  glb.writeUInt32LE(0x46546C67, 0); // 'glTF'
  glb.writeUInt32LE(2, 4);          // version 2
  glb.writeUInt32LE(totalGlbLen, 8); // total length

  // JSON Chunk Header
  let offset = 12;
  glb.writeUInt32LE(jsonChunkLen, offset);
  glb.writeUInt32LE(0x4E4F534A, offset + 4); // 'JSON'
  offset += 8;

  jsonBuf.copy(glb, offset);
  offset += jsonBuf.length;
  for (let i = 0; i < jsonPad; i++) {
    glb.write(' ', offset + i); // pad with spaces
  }
  offset += jsonPad;

  // Binary Chunk Header
  glb.writeUInt32LE(totalBinaryLen, offset);
  glb.writeUInt32LE(0x004E4942, offset + 4); // 'BIN\0'
  offset += 8;

  binaryBuffer.copy(glb, offset);

  return glb;
}

module.exports = {
  generateProceduralGlb
};
