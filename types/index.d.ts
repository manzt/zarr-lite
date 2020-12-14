import type { TypedArray, Codec, Store } from './common';

type Indices = [start: number, stop: number, step: number];

interface Slice {
  start: number | null;
  stop: number | null;
  step: number | null;
  indices: (length: number) => Indices;
  _slice: true;
}

function slice(start: number | null, stop?: null | number, step: null | number = null): Slice;

// extends BaseZarrArray with indexing 

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
    getRawChunk(chunkCoord: number[] | string): Promise<NDArray>;
    getRaw(selection: null | (number | null | Slice)[]): Promise<number | { data: TypedArray, shape: number[], stride: number[]}>;
}

function openArray({ store, path }: { store: Store, path?: string }): Promise<ZarrArray>;

export { Store, HTTPStore, addCodec, getJson } from './core';
export { ZarrArray, openArray, slice };