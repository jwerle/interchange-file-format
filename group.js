const { Chunk, ChunkIterator } = require('./chunk')
const { ID } = require('./id')
const assert = require('nanoassert')

/**
 * `Group` instances will have this symbol defined
 */
const kIsGroup = Symbol('GroupType')

/**
 * A public mapping of extensions to ID strings.
 * @public
 */
const extensions = new Map()

/**
 * A public mapping of built in types to ID strings.
 * @public
 */
const builtins = Object.assign(new Map(), {
  load() {
    if (false === builtins.has('FORM')) {
      // lazy load built ins
      builtins.set('CAT', require('./cat').CAT)
      builtins.set('FORM', require('./form').Form)
      builtins.set('LIST', require('./list').List)
      builtins.set('PROP', require('./prop').Prop)
    }

    return builtins
  }
})

/**
 * An abstract class for a container that contains many things, like Form
 * and List types
 * @class Group
 * @extends Array
 */
class Group extends Array {

  /**
   * Returns a pointer to an extension map
   * @static
   * @accessor
   * @type {Map}
   */
  static get extensions() {
    return extensions
  }

  /**
   * Returns a pointer to an extension map
   * @static
   * @accessor
   * @type {Map}
   */
  static get builtins() {
    return builtins.load()
  }

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

    builtins.load()

    const id = ID.from(buffer.slice(0, 4))
    const size = buffer.readUIntBE(4, 4)
    const type = buffer.slice(8, 12)
    const group = new this(id, { type })
    const chunks = ChunkIterator.from(buffer.slice(12, 12 + size - 4))

    for (const chunk of chunks) {
      const id = chunk.id.toString()
      const builtin = builtins.get(id)
      const extension = extensions.get(id)

      if (builtin && 'function' === typeof builtin.from) {
        group.append(builtin.from(chunk.toBuffer()))
      } else if (extension && 'function' === typeof extension.from) {
        group.append(extension.from(chunk.toBuffer()))
      } else {
        group.append(chunk)
      }
    }

    return group
  }

  /**
   * `Group` class constructor.
   * @param {String|ID|Buffer} id
   * @param {Object} opts
   */
  constructor(id, opts) {
    assert(opts && 'object' === typeof opts, 'Expecting `options` to be an object')

    super()

    const type = ID.from(opts.type)
    id = ID.from(id)

    Object.defineProperties(this, {
      [kIsGroup]: { value: true , enumerable: false, writable: false },
      ancestor: { value: null, enumerable: false, writable: true },
      type: { value: type, enumerable: false },
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
   * Pushes a new `Chunk` into the group, setting this instance
   * as the chunks ancestor.
   * @param {...Chunk} chunks
   * @return {Number}
   */
  push(...chunks) {
    let pushed = 0
    for (let chunk of chunks) {
      if (false === chunk instanceof Chunk && !chunk.toBuffer) {
        chunk = Chunk.from(chunk)
      }
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
      if (false === chunk instanceof Chunk && !chunk.toBuffer) {
        chunk = Chunk.from(chunk)
      }
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
    } else {
      this.push(chunk)
    }
  }

  /**
   * Map and over the chunks in this group returning a new `Group` instance.
   * @return {Group}
   */
  map(...args) {
    const group = new this.constructor(this.type, this)
    return group.concat([ ...this ].map(...args))
  }

  /**
   * Creates a new `Group` instance as a slice from this instance.
   * @return {Group}
   */
  slice(...args) {
    const group = new this.constructor(this.type, this)
    return group.concat([ ...this ].slice(...args))
  }

  /**
   * Convert this instance into an `Array`.
   * @return {Array}
   */
  toArray() {
    return [ ...this ]
  }

  /**
   * Creates a buffer from this `Group` instance flattening all
   * chunks in the hierarchy.
   * @return {Buffer}
   */
  toBuffer() {
    const { chunks } = this
    const type = this.type.toBuffer()
    const size = Buffer.alloc(4)
    const id = this.id.toBuffer()
    size.writeUIntBE(type.length + chunks.length, 0 , 4)
    return Buffer.concat([ id, size, type, chunks ])
  }
}

/**
 * Module exports.
 */
module.exports = {
  Group,
  extensions
}
