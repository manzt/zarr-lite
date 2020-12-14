import type { TypedArray, Codec, Store } from './common';

// Core array just supports getRawChunk.

interface ZarrArray {
    store: Store;
    path: string;
    shape: number[];
    dtype: string;
    chunks: number[]
    compressor?: Codec;
    fill_value: number | null;
    keyPrefix: string;
    attrs: any;
    TypedArray: TypedArray;
    getRawChunk(chunkCoord: number[] | string): Promise<{ data: TypedArray, shape: number[] }>;
}

function openArray({ store, path }: { store: Store, path?: string }): Promise<ZarrArray>;

export { Store, HTTPStore, addCodec, getJson } from './core';
export { ZarrArray, openArray };