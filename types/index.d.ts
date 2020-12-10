export { Store, TypedArray, Codec, HTTPStore, getCodec, addCodec } from './core';
export function openArray({ store, path }: { store: Store, path?: string }): Promise<ZarrArray>;
import type { TypedArray, ZarrArray as BaseZarrArray } from './core';

export type Indices = [start: number, stop: number, step: number];
export interface Slice { 
    start: number | null;
    stop: number | null;
    step: number | null;
    indices: (length: number) => Indices;
    _slice: true;
}
export type Selection = (number | null | Slice)[];

export function slice(start: null | number, stop?: null | number, step?: null | number): Slice;

// extends BaseZarrArray with indexing 

export type ZarrArray = BaseZarrArray & {
    getRaw(selection: Selection): Promise<{ data: TypedArray, shape: number[], stride: number[] }>;
}

export function openArray({ store, path }: { store: Store, path?: string }): Promise<ZarrArray>;