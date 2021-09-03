interchange-file-format
=======================

> A module for working with Interchange File Format (IFF) data.

## Installation

```sh
$ npm install interchange-file-format
```

## Example

The following example implements a few structures for the [AIFF (Audio
Interchange File
Format)](http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf)

```js
const { Form, Chunk, extensions } = require('interchange-file-format')
const fs = require('fs')

extensions.set('COMM', class CommonChunk extends Chunk {
  get numChannels() { return this.readUIntBE(0, 2) }
  get numSampleFrames() { return this.readUIntBE(2, 4) }
  get sampleSize() { return this.readUIntBE(6, 2) }
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

extensions.set('SSND', class SoundDataChunk extends Chunk {
  get offset() { return this.readUIntBE(0, 4) }
  get blockSize() { return this.readUIntBE(4, 4) }
  get soundData() { return this.slice(8) }
})

const stream = fs.createReadStream('/path/to/audio/track.aif')
const form = new Form({ type: 'AIFF' })

stream.pipe(form.createWriteStream()).on('finish', () => {
  for (const chunk of form) {
    // `chunk` could be `CommonChunk` or `SoundDataChunk` when `COMM`
    // and `SSND` chunk IDs are foud
    console.log(chunk)
  }
})
```

## API

### ID

The `ID` class represents a container for 32 bits of characters, the
concatenation of four printable ASCII character in the range '  ' (SP, 0x20)
through '~' (0x7E). Spaces (0x20) cannot precede printing characters;
trailing spaces are allowed. Control characters are forbidden.

The `ID` class extends `Uint8Array` and is polymorphic with the `Buffer`
API.

#### `id = ID.from(bufferOrString)`

Creates a **4 byte** `ID` instance from a `Buffer` or string. A `Chunk`
can be identified by an `ID`. A `Form` will use an `ID` to describe its
type.

```js
const id = ID.from('FORM')
```

##### `validated = id.set(bytes)`

Set id value bytes on `ID` instance.

```js
if (!id.set(bytesOrString)) {
  // bytes invalid or too large
}
```

##### `buffer = id.toBuffer()`

Convert `ID` instance directly to `Buffer`, using the same internal
`ArrayBuffer` for this instance.

```js
const buffer = id.toBuffer()
```

### Chunk

The `Chunk` class is a container for bytes with a known `ID` and size.
A `Chunk` can be manually constructed or derived from an existing buffer
(see `Chunk.from()`).

#### `chunk = new Chunk(id, options)`

Create a new `Chunk` instance from `ID` with options where `options` can
be:

```js
{
  size: required, // size in bytes of chunk body
  ancestor: null  // the ancestor this chunk is derived from
}
```

```js
const chunk = new Chunk('FORM', { size: 32 }) // 32 byte chunk body
chunk.set(bytes) // set bytes on chunk
```

#### `chunk = Chunk.from(buffer, options)`

Create a new `Chunk` from a given `buffer` with constructor options.

```js
const chunk = Chunk.from(bufferFromSource)
```

##### `chunk.data`

A `Buffer` pointer to the `Chunk` data.

##### `chunk.set(bytes[, offset])`

Set bytes or a string on `Chunk`.

##### `chunk = chunk.map(map)`

Map over the chunks in this chunk returning a new `Chunk` instance.

##### `chunk = chunk.filter(filter)`

Filter over the chunks in this chunk returning a new `Chunk` instance.

##### `chunk = chunk.slice(start[, stop])`

Creates a new `Chunk` instance as a slice from this instance.

##### `array = chunk.toArray()`

Convert `Chunk`  into an `Array`.

##### `buffer = chunk.toBuffer()`

Converts (serializes) the `Chunk` to a `Buffer`, including the `ID` and size
bytes as header values.

### `ChunkIterator`

A `Chunk` iterator that implements the _Iterator Protocol_ and
satisfies the _Iterable_ interface requirements.

#### `iterator = ChunkIterator.from(buffer[, offset])`

Creates a new `ChunkIterator` from a given `buffer` starting at an
optional `offset`.

```js
const iterator = ChunkIterator.from(bufferSource)
for (const chunk of iterator) {
  console.log('%s', chunk.id, chunk)
}
```

### Group

An abstract class that extends `Array` that behaves like a container that
for many things. Classes like `Form` and `List` extend this type for the
`FORM` and `LIST` chunk types, respectively.

#### `group = new Group(id, options)`

Creates a new `Group` from a given `ID` with `options` where `option`
can be:

```js
{
  type: required, // A string type name for the group, this could be the
                  // FORM type, or the record type for a LIST
}
```

```js
const group = new Group('FORM', { type: 'TEST' })
```

#### `group = Group.from(buffer)`

Creates a new `Group` instance from a given buffer, loading types
and extensions based on parsed chunk `ID`s.

```js
const form = Group.from(bufferSource) // `bufferSource` could be a AIFF file on disk
```

##### `group.chunks`

A concatenated buffer of all chunks in this group.

##### `group.append(chunks)`

Append a chunk or an array of chunks to the group, setting this instance
as the chunks ancestor.

##### `group.push(...chunks)`

Pushes a new `Chunk` into the group, setting this instance
as the chunks ancestor.

##### `group.unshift(...chunks)`

"Unshifts" or left pushes  a new `Chunk` into the group, setting this
instance as the chunks ancestor.

##### `chunk = group.shift()`

Shift a chunk out of the group, removing a reference to this
instance as the ancestor.

##### `chunk = group.pop()`

Pop a chunk out of the group, removing a reference to this
instance as the ancestor.

##### `group = group.concat(...chunks)`

Concatenates and returns a new `Group` instance with given chunks (or
`Group`).

##### `group = group.map(map)`

Map over the chunks in this group returning a new `Group` instance.

##### `group = group.filter(filter)`

Filter over the chunks in this group returning a new `Group` instance.

##### `group = group.slice(start[, stop])`

Creates a new `Group` instance as a slice from this instance.

##### `array = group.toArray()`

Convert this instance into an `Array`.

##### `buffer = group.toBuffer()`

Creates a buffer from this `Group` instance flattening all
chunks in the hierarchy.

##### `stream = group.createReadStream()`

Get a `ReadStream` for chunks in a `Group` instance.

##### `stream = group.createWriteStream()`

Get a `WriteStream` for writing chunks in a `Group` instance.

### Form

A `Group` type with an `ID` set to `FORM`.

### List

A `Group` type with an `ID` set to `LIST`.

### CAT

A special `Group` type with an `ID` set to `LIST` with a restriction on
the types of descendants being only other `Group` types.

### `extensions`

A static `Map` of `Group` extensions that map a 4 byte chunk `ID` string
to a class that extends `Group` or `Chunk` to handle extensions to the
`EA IFF 85` spec, such as `AIFF` (or `AIFC`) with the `NAME` or `SSND` types.

```js
const { Chunk, Group, extensions } = require('interchange-file-format')
class TextChunk extends Chunk {
  get text() {
    return this.slice(0, this.size).toString()
  }
}

// when then `NAME` or `AUTH` chunk ID is seen in a `Group`, this class will be used
extensions.set('NAME', TextChunk)
extensions.set('AUTH', TextChunk)
```

## License

MIT
