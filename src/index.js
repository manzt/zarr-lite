export * from './core.js';
import { ZarrArray } from './core.js';

import { _BasicIndexer, _get_selection, slice } from 'zarrita/lib/indexing';
export { slice };

// mutate prototype and add indexing

Object.defineProperties(ZarrArray.prototype, {
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
