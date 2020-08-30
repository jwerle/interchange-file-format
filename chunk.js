const { ID } = require('./id')
const assert = require('nanoassert')

/**
 * A `Chunk` is a container for bytes with an ID and size.
 * @class Chunk
 * @extends Buffer (Uint8Array)
 */
class Chunk extends Uint8Array {

  /**
   * Create a new `Chunk` from a given `buffer` with options.
   * @static
   * @param {Buffer} buffer
   * @return {Chunk}
   */
  static from(buffer, opts) {
    if (!opts) {
      opts = {}
    }

    if (buffer instanceof Chunk) {
      return new this(buffer.id, {
        ancestor: opts.ancestor || buffer.ancestor,
        size: opts.size || buffer.length,
      })
    }

    buffer = Buffer.from(buffer)

    const { ancestor } = opts
    const size = opts.size || buffer.readUIntBE(4, 4)
    const id = ID.from(buffer.slice(0, 4))

    const chunk = new this(id, { size: size, ancestor })
    chunk.set(buffer.slice(8, 8 + size))
    return chunk
  }

  /**
   * `Chunk` class constructor.
   * @param {String|Buffer|ID|Uint8Array|Number} id
   * @param {Object} opts
   * @param {Number} opts.size
   * @param {?(Chunk)} opts.ancestor
   */
  constructor(id, opts) {
    assert(id, 'Expecting `id` to be something. Got: ' + typeof id)
    assert(opts && 'object' === typeof opts, 'Expecting `options` to be an object')
    assert(opts.size >= 0, 'Expecting `options.size > 0`')

    const { ancestor = null } = opts
    const { size } = opts
    const pad = size % 2 ? 1 : 0

    super(size + pad)

    Object.defineProperties(this, {
      ancestor: { value: ancestor , enumerable: false, writable: true },
      size: { value: size, enumerable: false, writable: true },
      id: { value: ID.from(id), enumerable: false },
    })
  }

  /**
   * Return a pointer to the underlying data for this chunk as a `Buffer`.
   * @accessor
   * @type {Buffer}
   */
  get data() {
    return Buffer.from(this.buffer)
  }

  /**
   * Set bytes on the instance at an optional offset.
   * @param {Buffer} bytes
   * @param {?(Number)} offset
   */
  set(bytes, offset) {
    if ('string' === typeof bytes) {
      bytes = Buffer.from(bytes)
    }

    return super.set(bytes, offset)
  }

  /**
   * Map over the chunks in this chunk returning a new `Chunk` instance.
   * @return {Chunk}
   */
  map(...args) {
    const mapped = Buffer.from(this.toArray().map(...args))
    const chunk = new this.constructor(this.id, {
      ancestor: this,
      size: mapped.length,
    })
    chunk.set(mapped)
    return chunk
  }

  /**
   * Filter over the chunks in this chunk returning a new `Chunk` instance.
   * @return {Chunk}
   */
  filter(...args) {
    const filtered = Buffer.from(this.toArray().filter(...args))
    const chunk = new this.constructor(this.id, {
      ancestor: this,
      size: filtered.length,
    })
    chunk.set(filtered)
    return chunk
  }

  /**
   * Creates a new `Chunk` instance as a slice from this instance.
   * @return {Chunk}
   */
  slice(...args) {
    const sliced = Buffer.from(this.toArray().slice(...args))
    const chunk = new this.constructor(this.id, {
      ancestor: this,
      size: sliced.length,
    })
    chunk.set(sliced)
    return chunk
  }

  /**
   * Convert this instance into an `Array`.
   * @return {Array}
   */
  toArray() {
    return Array.from(this)
  }

  /**
   * Converts the `Chunk` to a `Buffer`, including the ID and size bytes.
   * @return {Buffer}
   */
  toBuffer() {
    const { data } = this
    const size = Buffer.alloc(4)
    // istanbul ignore next
    const pad = this.length % 2 && 0 == data[data.length - 1] ? -1 : 0
    const id = this.id.toBuffer()
    size.writeUIntBE(this.length + pad, 0, 4)
    return Buffer.concat([ id, size, data ])
  }
}

// inherit `Buffer`, working around 'DEP0005'
Object.setPrototypeOf(Chunk.prototype, Buffer.prototype)

/**
 * A `Chunk` iterator that implements the _Iterator Protocol_ and
 * satifies the _Iterable_ interface requirements.
 * @class ChunkIterator
 */
class ChunkIterator {

  /**
   * An alias to the `ChunkIterator` class constructor.
   * @static
   * @param {Buffer} buffer
   * @param {?(Number)} offset
   * @return {ChunkIterator}
   */
  static from(buffer, offset) {
    return new this(buffer, offset)
  }

  /**
   * `ChunkIterator` class constructor.
   * @private
   * @param {Buffer} buffer
   * @param {?(Number)} offset
   */
  // istanbul-ignore-next
  constructor(buffer, offset) {
    this.buffer = buffer
    this.offset = offset || 0
  }

  /**
   * `true` when the iterator is done.
   * @accessor
   * @type {Boolean}
   */
  get done() {
    return this.offset >= this.buffer.length
  }

  /**
   * A `Chunk` value for the current iteration.
   * @accessor
   * @type {?(Chunk)}
   */
  get value() {
    const { buffer, offset, done } = this
    return false === done ? Chunk.from(buffer.slice(offset)) : null
  }

  /**
   * Implements `@@iterator` for `for..of` support.
   * @return {Iterable}
   */
  [Symbol.iterator]() {
    return this
  }

  /**
   * Returns the next `value` and `done` state for this iteration.
   * @return {Object}
   */
  next() {
    const { value, done } = this
    if (value && !done) {
      this.offset += Math.min(value.length + 8, this.buffer.length)
    }
    return { value, done }
  }
}

/**
 * Module exports.
 */
module.exports = {
  Chunk,
  ChunkIterator,
}
