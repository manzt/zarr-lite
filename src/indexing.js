export * from './index.js';
import { ZarrArray } from './index.js';
import { _BasicIndexer, _get_selection, slice } from '../node_modules/zarrita/src/indexing.js';
export { slice };

Object.defineProperties(ZarrArray.prototype, {
  get_chunk: {
    value: function(ckey) {
      return this.getRawChunk(ckey);
    }
  },
  getRaw: {
    value: function(selection) {
      return this.getBasicSelection(selection);
    },
  },
  getBasicSelection: {
    value: function(selection) {
      const indexer = new _BasicIndexer({ selection, ...this });
      return _get_selection.call(this, indexer);
    }
  }
});
