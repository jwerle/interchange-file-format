interchange-file-format
=======================

> A module for working with Interchange File Format (IFF) data.

## Status

> **WIP**

## Installation

```sh
$ npm install interchange-file-format
```

## Usage

```js
// TODO
```

## Example

The following example implements a few structures for the [AIFF (Audio
Interchange File
Format)](http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf)

```js
const { Form, Chunk } = require('interchange-file-format')

Form.extensions.set('COMM', class CommonChunk extends Chunk {
  get numChannels() {
    return this.readUIntBE(0, 2)
  }

  get numSampleFrames() {
    return this.readUIntBE(2, 4)
  }

  get sampleSize() {
    return this.readUIntBE(6, 2)
  }

  get sampleRate() {
    const x = this.readUIntBE(8, 2)
    const y = this.readUIntBE(10, 1)
    const z = this.readUIntBE(11, 1)
    const pre = 16398
    const pad = x - pre
    const shifted = (y << 8) + z
    return shifted << pad
  }
})

Form.extensions.set('SSND', class SoundDataChunk extends Chunk {
  get offset() {
    return this.readUIntBE(0, 4)
  }

  get blockSize() {
    return this.readUIntBE(4, 4)
  }

  get soundData() {
    return this.slice(8)
  }
})

const buffer = fs.readFileSync('/path/to/audio/track.aif')
const form = Form.from(buf)
console.log(form.type.toString()); // AIFC

for (const chunk of form) {
  if ('COMM' ===  chunk.id.toString()) {
    // chunk is an instance of `CommonChunk`
    console.log(chunk.numChannels, chunk.numSampleFrames, chunk.sampleSize, chunk.sampleRate);
  }
}

  if ('SSND' === chunk.id.toString()) {
    // chunk is an instance of `SoundDataChunk`
    console.log(chunk.offset, chunk.blockSize, chunk.soundData);
  }
}
```

## API

> TODO

## License

MIT
