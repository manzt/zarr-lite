import { KeyError } from '../node_modules/zarrita/src/errors.js';
export { KeyError };

function systemIsLittleEndian() {
  const a = new Uint32Array([0x12345678]);
  const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  return !(b[0] === 0x12);
}

const LITTLE_ENDIAN_OS = systemIsLittleEndian();

async function defaultImport(codecId) {
  const url = 'https://cdn.skypack.dev/numcodecs@^0.1/' + codecId;
  const { default: Codec } = await import(url);
  return Codec;
}

export const registry = new Map()
  .set('gzip', () => defaultImport('gzip'))
  .set('zlib', () => defaultImport('zlib'))
  .set('blosc', () => defaultImport('blosc'));

async function getCodec(config) {
  if (!registry.has(config.id)) {
    throw Error(`Codec missing from registry: ${config.id}`);
  }
  const Codec = await registry.get(config.id)();
  return Codec.fromConfig(config);
}

const DTYPES = {
  u1: Uint8Array,
  i1: Int8Array,
  u2: Uint16Array,
  i2: Int16Array,
  u4: Uint32Array,
  i4: Int32Array,
  f4: Float32Array,
  f8: Float64Array
};

const decoder = new TextDecoder('utf-8');
export async function getJson(store, key) {
  const buffer = await store.getItem(key);
  const json = JSON.parse(decoder.decode(buffer));
  return json;
}

function byteSwapInplace(src) {
  const b = src.BYTES_PER_ELEMENT;
  const flipper = new Uint8Array(src.buffer, src.byteOffset, src.length * b);
  const numFlips = b / 2;
  const endByteIndex = b - 1;
  let t = 0;
  for (let i = 0; i < flipper.length; i += b) {
    for (let j = 0; j < numFlips; j += 1) {
      t = flipper[i + j];
      flipper[i + j] = flipper[i + endByteIndex - j];
      flipper[i + endByteIndex - j] = t;
    }
  }
}

function validateMetadata(meta) {
  const { order, dtype, filters, zarr_format } = meta;
  if (zarr_format !== 2) {
    throw new Error('Only Zarr v2 supported.')
  }
  if (order === 'F') {
    throw new Error('Fortran order not implemented.');
  }
  if (!(dtype.slice(1, 3) in DTYPES)) {
    throw new Error(`Decoding of dtype not implemented: ${dtype}`);
  }
  if (filters?.length > 0) {
    throw new Error('Filters not implmented.')
  }
}

export class ZarrArray {
  constructor({ store, path, ...meta }) {
    Object.assign(this, meta);
    this.path = path;
    this.store = store;
    this.TypedArray = DTYPES[this.dtype.slice(1, 3)];
    this.chunk_shape = meta.chunks;
  }

  async getRawChunk(ckey) {
    if (Array.isArray(ckey)) {
      ckey = ckey.join('.');
    }
    try {
      const buffer = await this.store.getItem(this.path + "/" + ckey);
      const decoded = await this._decodeChunk(buffer)
      return decoded;
    } catch (err) {
      if (err instanceof KeyError) {
        return null;
      }
      throw err;
    }
  }

  async getRaw() {
    // TODO: Probably extend this core module with special indexing
    throw Error('Method not implemented in zarr-lite.')
  }

  async _decodeChunk(buffer) {
    let bytes = new Uint8Array(buffer);
    if (this.compressor) {
      const codec = await this.compressor;
      bytes = await codec.decode(bytes);
    }
    const data = new this.TypedArray(bytes.buffer);
    if ((this.dtype[0] === '>' && LITTLE_ENDIAN_OS) || (this.dtype[0] === '<' && !LITTLE_ENDIAN_OS)) {
      byteSwapInplace(data);
    }
    const shape = this.chunks.filter(d => d > 1);
    return { data, shape };
  }

}

export async function openArray({ store, path = '' }) {
  const meta = await getJson(store, `${path}/.zarray`);
  validateMetadata(meta);
  if (meta.compressor) {
    meta.compressor = await getCodec(meta.compressor);
  }
  return new ZarrArray({ store, path, ...meta });
}
