import { ZarrArray } from '../node_modules/zarrita/src/core.js';
import { KeyError } from './errors.js';

Object.defineProperties(ZarrArray.prototype, {
  _chunk_key: {
    value: function(chunkCoords) {
      if (Array.isArray(chunkCoords)) {
        chunkCoords = chunkCoords.join(this.chunk_separator);
      }
      return this.path + '/' + chunkCoords;
    },
  },
  keyPrefix: {
    get() { return this.path + '/' },
  },
  chunks: {
    get() { return this.chunk_shape; },
  },
  getRawChunk: {
    value: function(chunkCoords) {
      return this.get_chunk(chunkCoords);
    },
  },
});

async function defaultImport(codecId) {
  const url = 'https://cdn.skypack.dev/numcodecs@^0.1/' + codecId;
  const { default: Codec } = await import(url);
  return Codec;
}

const registry = new Map()
  .set('gzip', () => defaultImport('gzip'))
  .set('zlib', () => defaultImport('zlib'))
  .set('blosc', () => defaultImport('blosc'));

function addCodec(codecId, importer) {
  registry.set(codecId, importer);
}

async function getCodec(config) {
  if (!registry.has(config.id)) {
    throw Error(`Codec missing from registry: ${config.id}`);
  }
  const Codec = await registry.get(config.id)();
  return Codec.fromConfig(config);
}

const decoder = new TextDecoder('utf-8');
async function getJson(store, key) {
  const buffer = await store.getItem(key);
  const json = JSON.parse(decoder.decode(buffer));
  return json;
}

function validateMetadata(meta) {
  const { order, dtype, filters, zarr_format } = meta;
  if (zarr_format !== 2) {
    throw new Error('Only Zarr v2 supported.')
  }
  if (order === 'F') {
    throw new Error('Fortran order not implemented.');
  }
  if (filters?.length > 0) {
    throw new Error('Filters not implmented.')
  }
  if (meta.dtype.startsWith('|')) {
    meta.dtype = meta.dtype.slice(1);
  }
}

// alias zarrita.js conventions for store to zarr-lite/zarr.js conventions.
const storeHandler = {
  get: function(store, prop) {
    if (prop === 'get') return store.getItem;
    if (prop === 'has') store.containsItem;
    if (prop === 'set') return store.setItem;
    return store[prop];
  }
}

async function openArray({ store, path = '' }) {
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  const meta = await getJson(store, `${path}/.zarray`);
  validateMetadata(meta);
  if (meta.compressor) {
    meta.compressor = await getCodec(meta.compressor);
  }
  store = new Proxy(store, storeHandler);
  return new ZarrArray({
    store,
    path,
    chunk_shape: meta.chunks,
    chunk_separator: '.',
    ...meta,
  });
}

export {
  openArray,
  addCodec,
  getCodec,
  getJson,
  KeyError,
  ZarrArray,
};
