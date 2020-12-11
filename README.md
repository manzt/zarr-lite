## `zarr-lite` 

A minimal (& very incomplete) Zarr implementation for the browser.

### Description

Here be dragons. This project is _not_ intended to be a feature-complete implementation of Zarr,
but rather an experiment to define a minimal subset of interfaces that are useful for 
loading Zarr in web-applications. _Please_ use [`zarr.js`](https://github.com/gzuidhof/zarr.js/)
unless you know what you are doing!

### Usage

`zarr-lite` supports only _reading_ array `chunks` and slices directly from a valid `Store` interface. To mimic
the `zarr.js` API, `zarr-lite` exports a top-level `openArray` util which returns an `ZarrArray` object 
with only `getRaw` and `getRawChunk` implemented. If your use case only requires reading chunks, you should just 
use the `/core` submodule which does not support any slicing/indexing logic, and instead relies on the user to
request array chunks by key directly.

#### Client

```javascript
// ~3.6kB min + gzip
import { openArray, HTTPStore, slice } from 'https://cdn.skypack.dev/@manzt/zarr-lite';

// ~ 1.75kB min + gzip
// import { openArray, HTTPStore } from 'https://cdn.skypack.dev/@manzt/zarr-lite/core';

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
  //   stride: [250000, 500, 1],
  // }

  const arr = await z.getRaw([0, slice(0, 200, 2), null]); // not implemented for `/core` submodule
  console.log(arr);
  // {
  //   data: Int32Array(50000),
  //   shape: [100, 500],
  //   stride: [500, 1],
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
default `zarr-lite` contains a codec `registry` the dynamically imports (`numcodecs.js`)
codecs from a CDN. The `registry` is just an ES6 `Map`, and you can override this default
behavior (e.g. host your own modules or use your own codecs) using `addCodec`.

```javascript
import { addCodec, openArray } from '@manzt/zarr-lite';
import MyCustomCodec from './myCustomCodec';

// override CDN codec
addCodec('blosc', () => MyCustomCodec);

// add new codec
addCodec(MyCustomCodec.id, () => MyCustomCodec);

const z = await openArray({ store });
```

For more information about the `Codec` interface, checkout [`numcodecs.js`](https://github.com/manzt/numcodecs.js).



#### Development

```bash
$ git clone https://github.com/manzt/zarr-lite.git
$ cd zarr-lite && npm install
$ npm run dev # builds source in watch mode
```

You can serve the contents of `dist/` via an http server and test in the browser. I've just been using 
https://observablehq.com/@manzt/using-zarr-lite to experiment since most of the library is imported from 
`zarrita`.

#### Publishing

```bash
$ npm version [<newversion> | major | minor | patch]
$ npm run build # bundles source & copies README.md + package.json to dist/
$ cd dist
$ npm publish
```
