import { ZarrArray } from '../node_modules/zarrita/src/core.js';

import HTTPStore from './httpStore.js';
import { KeyError } from './errors.js';


// Adapt ZarrArray from zarrita to zarr.js API

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


// Util to "open" ZarrArray; mimics zarr.js API.

async function openArray({ store, path = '' }) {
  if (typeof store === 'string') {
    store = new HTTPStore(store);
  }
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

// alias zarrita.js conventions for store to zarr-lite/zarr.js conventions.
const storeHandler = {
  get: function(store, prop) {
    if (prop === 'get') return store.getItem;
    if (prop === 'has') return store.containsItem;
    if (prop === 'set') return store.setItem;
    return store[prop];
  }
}

// Compression

const registry = new Map()
  .set('gzip', () => defaultImport('gzip'))
  .set('zlib', () => defaultImport('zlib'))
  .set('blosc', () => defaultImport('blosc'));


async function defaultImport(codecId) {
  // Default import just pulls codecs from skypack, can override with addCodec
  const url = `https://cdn.skypack.dev/numcodecs@^0.1/${codecId}`;
  const { default: Codec } = await import(url);
  return Codec;
}

function addCodec(codecId, importer) {
  // Add or override coded importer in registry
  registry.set(codecId, importer);
}

async function getCodec(config) {
  if (!registry.has(config.id)) {
    throw Error(`Codec missing from registry: ${config.id}`);
  }
  const Codec = await registry.get(config.id)();
  return Codec.fromConfig(config);
}


// Utils 

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
    meta.dtype = dtype.slice(1);
  }
}

export {
  openArray,
  addCodec,
  getJson,
  KeyError,
  ZarrArray,
  HTTPStore,
};
