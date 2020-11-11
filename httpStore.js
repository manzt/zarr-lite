import { KeyError } from './index.js';

function joinUrlParts(...args) {
  return args.map((part, i) => {
    if (i === 0) {
      return part.trim().replace(/[\/]*$/g, '');
    } else {
      return part.trim().replace(/(^[\/]*|[\/]*$)/g, '');
    }
  }).filter(x=>x.length).join('/');
}

export default class HTTPStore {
  constructor(url) {
    this.url = url;
  }
  
  async getItem(key) {
    const url = joinUrlParts(this.url, key);
    const value = await fetch(url);

    if (value.status === 404) {
      // Item is not found
      throw new KeyError(key);
    } else if (value.status !== 200) {
      throw new HTTPError(String(value.status));
    }
    // only decode if 200
    return value.arrayBuffer(); // Browser
  }
  
  async containsItem(key) {
    const url = joinUrlParts(this.url, key);
    // Just check headers if HEAD method supported
    const value = await fetch(url);
    return value.status === 200;
  }

  keys() {
    throw new Error('Method not impemented.');
  }

  async setItem(item, value) {
    throw new Error('Method not implemented.')
  }

  deleteItem(key) {
    throw new Error('Method not implemented.');
  }
}
