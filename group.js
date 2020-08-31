const { Chunk, ChunkIterator } = require('./chunk')
const { Readable, Writable } = require('streamx')
const extensions = require('./extensions')
const builtins = require('./builtins')
const { ID } = require('./id')
const assert = require('nanoassert')

/**
 * `Group` instances will have this symbol defined
 */
const kIsGroup = Symbol('GroupType')

/**
 * Coerce a `Chunk` into a builtin or extension, if supported
 * @private
 * @param {Chunk|Mixed} chunk
 * @return {Chunk|Group|Mixed}
 */
function coerce(chunk) {
  if (!chunk.id) {
    chunk = Chunk.from(chunk)
  }

  const id = chunk.id.toString()
  const builtin = builtins.get(id) || builtins.get(id.trim())
  const extension = extensions.get(id) || extensions.get(id.trim())

  if ('function' === typeof builtin && 'function' === typeof builtin.from) {
    if (chunk instanceof builtin) {
      return chunk
    } else {
      return builtin.from(chunk.toBuffer())
    }
  } else if ('function' === typeof extension && 'function' === typeof extension.from) {
    if (chunk instanceof extension) {
      return chunk
    } else {
      return extension.from(chunk.toBuffer())
    }
  }

  return chunk
}

/**
 * Implements a `ReadStream` for `Group` types.
 * @class ReadStream
 * @extends streamx.Readable
 */
class ReadStream extends Readable {

  /**
   * Create a `ReadStream` from a `Group` instance.
   * @static
   * @return {WriteStream}
   */
  // istanbul ignore next
  static from(group) {
    return new this(group)
  }

  /**
   * `ReadStream` class constructor.
   * @param {Group} group
   */
  constructor(group) {
    super()
    this.group = group
    this.header = null
    this.iterator = group.iterator()
  }

  /**
   * Implements `_reaad()` for `Readable` stream.
   * @protected
   */
  _read(callback) {
    // send header first
    if (!this.header) {
      this.header = this.group.header
      this.push(this.header)
      callback(null)
      return
    }

    const { value, done } = this.iterator.next()

    if (done) {
      this.push(null)
    } else {
      // istanbul ignore next
      if (value && 'function' === typeof value.toBuffer) {
        this.push(value.toBuffer())
      } else {
        // istanbul ignore next
        this.push(value)
      }
    }

    callback(null)
  }
}

/**
 * Implements a `WriteStream` for `Group` types.
 * @class WriteStream
 * @extends streamx.Writable
 */
class WriteStream extends Writable {

  /**
   * Create a `WriteStream` from a `Group` instance.
   * @static
   * @return {WriteStream}
   */
  // istanbul ignore next
  static from(group) {
    return new this(group)
  }

  /**
   * `WriteStream` class constructor.
   * @param {Group} group
   */
  constructor(group) {
    super()
    this.cache = null
    this.group = group
    this.stream = null
    this.offset = 0
    this.header = null
  }

  /**
   * Implements `_write()` for `Writable` stream.
   * @protected
   */
  _write(buffer, callback) {
    if (!this.header) {
      // get group type from buffer if available
      const { type } = Group.from(buffer)

      // istanbul ignore next
      if (type.isValid) {
        this.group.type = type
      }

      this.header = Chunk.header(buffer)
      this.offset = buffer.length
      this.cache = Buffer.alloc(this.header.size + 8)

      // initial group configuration from first frame
      this.cache.set(buffer)
    } else {
      const offset = Math.min(this.header.size - this.offset, buffer.length)
      this.cache.set(buffer, this.offset)
      this.offset += offset

      // flush at the end
      if (this.header && this.offset >= this.header.size) {
        this.group.clear()
        this.group.push(...Group.from(this.cache))
        this.cache = null
      }
    }

    process.nextTick(callback)
  }

  /**
   * Implements `_write()` for `Writable` stream.
   * @protected
   */
  _destroy(callback) {
    this.cache = null
    process.nextTick(callback)
  }
}

/**
 * An abstract class for a container that contains many things, like Form
 * and List types
 * @class Group
 * @extends Array
 */
class Group extends Array {

  /**
   * Creates a new `Group` instance from a given buffer, loading types
   * and extensions based on parsed chunk IDs.
   * @param {Buffer}
   * @return {Group}
   */
  static from(buffer) {
    if (buffer instanceof Group || buffer[kIsGroup]) {
      return new this(buffer.id, buffer).concat(...buffer)
    }

    const id = ID.from(buffer.slice(0, 4))
    const size = buffer.readUIntBE(4, 4)
    const type = buffer.slice(8, 12)
    const group = new this(id, { type })
    const chunks = ChunkIterator.from(buffer.slice(12, 12 + size - 4))

    for (const chunk of chunks) {
      group.append(coerce(chunk))
    }

    return group
  }

  /**
   * `Group` class constructor.
   * @param {String|ID|Buffer} id
   * @param {?(Object)} opts
   */
  constructor(id, opts) {
    // istanbul ignore next
    if (!opts) {
      opts = {}
    }

    assert('object' === typeof opts, 'Expecting `options` to be an object')

    super()

    const type = ID.from(opts.type)
    id = ID.from(id)

    Object.defineProperties(this, {
      [kIsGroup]: { value: true , enumerable: false, writable: false },
      onlyGroups: { value: false, enumerable: false, writable: true },
      ancestor: { value: null, enumerable: false, writable: true },
      type: { value: type, writable: true, enumerable: false },
      id: { value: id, enumerable: false },
    })
  }

  /**
   * Returns a concatenated buffer of all chunks in this group.
   * @accessor
   * @type {Buffer}
   */
  get chunks() {
    const chunks = []
    for (const chunk of this) {
      chunks.push(chunk.toBuffer())
    }
    return Buffer.concat(chunks)
  }

  /**
   * Returns the computed size of this `Group`.
   * @accessor
   * @type {Number}
   */
  get size() {
    return this.reduce((total, chunk) => total + chunk.size, 0)
  }

  /**
   * Returns the header portion of this `Group` as a `Buffer`.
   * @accessor
   * @type {Buffer}
   */
  get header() {
    const { chunks } = this
    const type = this.type.toBuffer()
    const size = Buffer.alloc(4)
    const id = this.id.toBuffer()
    size.writeUIntBE(type.length + chunks.length, 0 , 4)
    return Buffer.concat([ id, size, type ])
  }

  /**
   * Pushes a new `Chunk` into the group, setting this instance
   * as the chunks ancestor.
   * @param {...Chunk} chunks
   * @return {Number}
   */
  push(...chunks) {
    let pushed = 0
    for (let chunk of chunks) {
      chunk = coerce(chunk)
      chunk.ancestor = this
      pushed += super.push(chunk)
    }
    return pushed
  }

  /**
   * "Unshifts" or left pushes  a new `Chunk` into the group, setting this
   * instance as the chunks ancestor.
   * @param {...Chunk} chunks
   * @return {Number}
   */
  unshift(...chunks) {
    let unshifted = 0
    for (let chunk of chunks) {
      chunk = coerce(chunk)
      chunk.ancestor = this
      unshifted += super.unshift(chunk)
    }
    return unshifted
  }

  /**
   * Pop a chunk out of the group, removing a reference to this
   * instance as the ancestor.
   * @return {Chunk}
   */
  pop() {
    const chunk = super.pop()
    // istanbul ignore next
    if (chunk) {
      chunk.ancestor = null
    }
    return chunk
  }

  /**
   * Shift a chunk out of the group, removing a reference to this
   * instance as the ancestor.
   * @return {Chunk}
   */
  shift() {
    const chunk = super.shift()
    // istanbul ignore next
    if (chunk) {
      chunk.ancestor = null
    }
    return chunk
  }

  /**
   * Concats and returns a new `Group` instance with given chunks.
   * @return {...Group} chunks
   */
  concat(...chunks) {
    const { constructor, id } = this
    const group = new constructor(id, this)

    // initial chunks
    for (const chunk of this) {
      group.push(chunk)
    }

    return concat(chunks)

    function concat(chunks) {
      for (const chunk of chunks) {
        // flatten, except `Group` instances
        // istanbul ignore next
        if (
          Array.isArray(chunk) &&
          (false === chunk instanceof Group && !chunk[kIsGroup])
        ) {
          concat(chunk)
        } else {
          group.push(chunk)
        }
      }

      return group
    }
  }

  /**
   * Append a chunk or an array of chunks to the group
   * @param {Buffer|Chunk|Array<Buffer|Chunk>} buffer
   */
  append(chunk) {
    if (Array.isArray(chunk) && !chunk.toBuffer) {
      for (const buf of chunk) {
        this.append(buf)
      }
    } else if (false === this.onlyGroups || (true === this.onlyGroups && chunk[kIsGroup])) {
      this.push(chunk)
    }
  }

  /**
   * Map over the chunks in this group returning a new `Group` instance.
   * @return {Group}
   */
  map(...args) {
    const group = new this.constructor(this.type, this)
    return coerce(group.concat(this.toArray().map(...args)))
  }

  /**
   * Filter over the chunks in this group returning a new `Group` instance.
   * @return {Group}
   */
  filter(...args) {
    const group = new this.constructor(this.type, this)
    return coerce(group.concat(this.toArray().filter(...args)))
  }

  /**
   * Creates a new `Group` instance as a slice from this instance.
   * @return {Group}
   */
  slice(...args) {
    const group = new this.constructor(this.type, this)
    return coerce(group.concat(this.toArray().slice(...args)))
  }

  /**
   * Splice items from the group, returning a new `Group` instance
   * with them in it.
   * @return {Group}
   */
  splice(...args) {
    const items = this.toArray()
    const group = new this.constructor(this.type, this)
    const spliced = items.splice(...args)

    this.clear()
    this.push(...items)
    return coerce(group.concat(spliced))
  }

  /**
   * Clear the items from the `Group` instance returning the number
   * of items just cleared.
   * @return {Number}
   */
  clear() {
    const cleared = this.length
    this.length = 0
    return cleared
  }

  /**
   * Convert this instance into an `Array`.
   * @return {Array}
   */
  toArray() {
    return Array.from(this)
  }

  /**
   * Creates a buffer from this `Group` instance flattening all
   * chunks in the hierarchy.
   * @return {Buffer}
   */
  toBuffer() {
    const { chunks, header } = this
    return Buffer.concat([ header, chunks ])
  }

  /**
   * Returns a `Generator` for iteration over the `Group` instance.
   * @return {Generator}
   */
  *iterator() {
    for (const chunk of this) {
      yield chunk
    }

    return null
  }

  /**
   * Creates and returns `ReadStream` for this `Group` instance.
   * @return {ReadStream}
   */
  createReadStream() {
    return new ReadStream(this)
  }

  /**
   * Creates and returns `WriteStream` for this `Group` instance.
   * @return {WriteStream}
   */
  createWriteStream() {
    return new WriteStream(this)
  }
}

/**
 * Module exports.
 */
module.exports = {
  Group,
  ReadStream,
  WriteStream,
}
