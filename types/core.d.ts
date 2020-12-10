export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

export interface Codec {
    decode(bytes: Uint8Array): Promise<Uint8Array>;
    encode(bytes: Uint8Array): Promise<Uint8Array>;
}

export interface Store {
    getItem(key: string): Promise<Uint8Array>;
    containsItem(key: string): Promise<boolean>;
}

export class HTTPStore implements Store {
    constructor(url: string);
    url: string;
    getItem(key: string): Promise<Uint8Array>;
    containsItem(key: string): Promise<boolean>;
}

export function getCodec(id: string): Promise<Codec>;

export function getJson(store: Store, key: string): Promise<any>;

export function addCodec(id: string, importer: () => Promise<Codec>);

// Core array just supports getRawChunk.

export interface ZarrArray {
    store: Store;
    path: string,
    shape: number[];
    dtype: string;
    chunks: number[];
    compressor: Codec | null;
    getRawChunk(chunkCoord: number[] | string): Promise<{ data: TypedArray, shape: number[] }>;
}

export function openArray({ store, path }: { store: Store, path?: string }): Promise<ZarrArray>;