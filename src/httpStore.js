import { KeyError } from './errors.js';

// Default HTTPStore is read-only

export default class HTTPStore {
  constructor(url) {
    this.url =  url.endsWith('/') ? url.slice(0, -1) : url;
  }

  _path(key) {
    return `${this.url}/${key.startsWith('/') ? key.slice(1) : key}`;
  }
  
  async getItem(key) {
    const path = this._path(key);
    const value = await fetch(path);
    if (value.status === 404) {
      // Item is not found
      throw new KeyError(key);
    } else if (value.status !== 200) {
      throw new Error('HTTPError:', String(value.status));
    }
    // only decode if 200
    return value.arrayBuffer();
  }
  
  async containsItem(key) {
    const path = this._path(key);
    const value = await fetch(path);
    return value.status === 200;
  }

  keys() {
    throw new Error('Method not impemented.');
  }

  setItem(item, value) {
    throw new Error('Method not implemented.')
  }

  deleteItem(key) {
    throw new Error('Method not implemented.');
  }
}