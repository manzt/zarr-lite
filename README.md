## `zarr-lite` 

A minimal (& very incomplete) Zarr implementation for the browser.

### Description

Here be dragons. This project is _not_ intended to be a feature-complete implementation of Zarr,
but rather an experiment to define a minimal subset of interfaces that are useful for 
loading Zarr in web-applications. _Please_ use [`zarr.js`](https://github.com/gzuidhof/zarr.js/)
unless you know what you are doing!

### Usage

`zarr-lite` only supports _reading_ array `chunks` directly from a valid `Store` interface. To mimic
the `zarr.js` API, a `zarr-lite` exports a top-level `openArray` util which returns an `ZarrArray` object 
with only `getRawChunk` implemented. This means that `zarr-lite` does not support any type of slicing/indexing,
and instead relies on the user to request array chunks by key directly.


#### Client

```javascript
import { openArray } from 'https://cdn.skypack.dev/@manzt/zarr-lite'; // pure ESM module, ~2kb
import HTTPStore  from 'https://cdn.skypack.dev/@manzt/zarr-lite/httpStore' // No default store; can use any zarr.js store!


// open an array
(async () => {
  const store = new HTTPStore('http://localhost:8080/data.zarr');
  const z = await openArray({ store });
  console.log(z.dtype);
  // "<i4"

  console.log(z.shape); // Array shape
  // [10, 1000, 1000]

  console.log(z.chunks); // Chunk shape
  // [5, 500, 500]

  console.log(z.compressor); // Initialized compressor (null, Blosc, GZip, or Zlib)
  // Blosc { blocksize: 0, clevel: 5, cname: 'lz4', shuffle: 1 }

  // Load decoded chunk (Same API as zarr.js)
  const chunk = await z.getRawChunk('0.0.0'); // get chunk by key; can also use [0, 0, 0];
  console.log(chunk);
  // {
  //   data: Int32Array(1250000),
  //   shape: [5, 500, 500],
  //   strides: [250000, 500, 1],
  // }
})();
```


#### Server

```python
import numpy as np
import zarr
from simple_zarr_server import serve

arr = np.arange(10 * 1000 * 1000, dtype='i4').reshape(10, 1000, 1000)
z = zarr.array(arr, chunks=[5, 500, 500])
serve(z, port=8080, name='data.zarr', allowed_origins=["*"])
```


#### Codecs

Chunk compression is an important aspect Zarr, but you shouldn't have to pay for a codec 
you don't use! Ultimately array compression might not be known until _runtime_, so by
default `zarr-lite` exports a `registry` that serves to dynamically import (`numcodecs.js`)
codecs from a CDN. The `registry` is just a JavaScript `Map`, so you can override this default
behavior (e.g. host your own modules or use your own codecs) by overriding the registry key:

```javascript
import { registry, openArray } from 'zarr-lite';
import MyCustomCodec from './myCustomCodec';

// override CDN codec
registry.set('blosc', () => MyCustomCodec);

// add new codec
registry.set(MyCustomCodec.id, () => MyCustomCodec);

const z = await openArray({ store });
```

For more information about the `Codec` interface, checkout [`numcodecs.js`](https://github.com/manzt/numcodecs.js).
