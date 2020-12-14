export type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array;

export interface Codec {
    codecId: string;
    encode(data: Uint8Array): Uint8Array | Promise<Uin8Array>;
    decode(data: Uint8Array): Uint8Array | Promise<Uint8Array>;
    fromConfig(config: any): Codec;
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

export function getJson(store: Store, key: string): Promise<any>;

export function addCodec(id: string, importer: () => Promise<Codec>): void;