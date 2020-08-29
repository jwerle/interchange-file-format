const varint = require('varint')

/**
 * The number of bytes needed for a `ID` instance.
 * @const
 * @public
 */
const BYTES = 4

function set(target, bytes) {
  return Buffer.prototype.set.call(target, Buffer.from(bytes))
}

/**
 * The `ID` class represents a container for 32 bits of characters, the
 * concatenation of four printable ASCII character in the range '  ' (SP, 0x20)
 * through '~' (0x7E). Spaces (0x20) cannot precede printing characters;
 * trailing spaces are allowed. Control characters are forbidden.
 * @class ID
 * @extends Buffer (Uint8Array)
 */
class ID extends Uint8Array {

  /**
   * Overloads `Buffer.alloc()` for `ID` instances.
   * @static
   * @return {ID}
   */
  static alloc() {
    return new this()
  }

  /**
   * Overloads `Buffer.from()` for `ID` instances.
   * @static
   * @return {ID}
   */
  static from(id) {
    return new this(id)
  }

  /**
   * Normalizes bytes based on type and final encoding. Extending classes
   * can overload this method for controlled normalization.
   * @static
   * @param {Buffer|String|Array|ID} bytes
   * @param {?(String)} encoding
   * @return {Buffer}
   */
  static normalize(bytes, encoding) {
    if ('number' === typeof bytes) {
      bytes = Buffer.from(bytes.toString(16), 'hex')
    }

    bytes = Buffer.from(bytes, encoding)

    if (bytes.length > BYTES) {
      bytes = Buffer.from(varint.decode(bytes).toString(16), 'hex')
    }

    return bytes
  }

  /**
   * Validate bytes for a `ID` instances. Extending classes
   * can overload this method for controlled validation.
   * @static
   * @param {Buffer|String|Array|ID} bytes
   * @param {?(String)} encoding
   * @return {Boolean}
   */
  static validate(bytes, encoding) {
    const { normalize } = this

    if (!bytes) {
      return false
    }

    if ('object' === typeof bytes) {
      if (null === Object.getPrototypeOf(bytes)) {
        return false
      }

      if (Object.prototype === Object.getPrototypeOf(bytes)) {
        return false
      }
    }

    if ('function' === typeof bytes) {
      return false
    }

    bytes = normalize.call(this, bytes, encoding)

    // must be 4 bytes
    if (BYTES !== bytes.length) {
      return false
    }

    // spaces may not proceed ASCII characters in bytes
    if (0x20 === bytes[0]) {
      return false
    }

    // in the range of 0x20 - 0x7e, or null byte
    for (const byte of bytes) {
      if (0 !== byte && (byte < 0x20 || byte > 0x7e)) {
        return false
      }
    }

    return true
  }

  /**
   * The number of bytes needed for a `ID` allocation.
   * @static
   * @accessor
   * @type {Number}
   */
  static get BYTES() {
    return BYTES
  }

  /**
   * `ID` class constructor.
   * @param {?(Buffer|String|ID)} id
   */
  constructor(id) {
    super(BYTES)

    this.set(id)
  }

  /**
   * Set id value on `ID` instances.
   * @param {?(String|Buffer|ID|Uint8Array|Number)} id
   * @return {Boolean}
   */
  set(id) {
    const { constructor } = this
    const { validate, normalize } = constructor

    if (validate.call(constructor, id)) {
      id = normalize.call(constructor, id)
      const tmp = Buffer.alloc(BYTES)
      id.copy(tmp)
      set(this, tmp)

      return true
    }

    return false
  }

  /**
   * Convert `ID` instance directly to `Buffer`, using the same internal
   * `ArrayBuffer` for this instance.
   * @return {Buffer}
   */
  toBuffer() {
    return Buffer.from(this.buffer) // `this.buffer` is the `ArrayBuffer`
  }
}

// inherit `Buffer`, working around 'DEP0005'
Object.setPrototypeOf(ID.prototype, Buffer.prototype)

/**
 * Encode a given `id` string or buffer.
 * @param {Buffer|String|Array|ID} bytes
 * @return {ID}
 */
function encode(id) {
  return ID.from(id)
}

/**
 * Decode a given `ID` instance into a id string.
 * @param {ID|Buffer} id
 * @return {String}
 */
function decode(id) {
  return id.toString('utf8')
}

/**
 * Returns the encoding length for a `ID` instance.
 * @return {Number}
 */
function encodingLength(id) {
  void id
  return BYTES
}

/**
 *  Module exports.
 */
module.exports = {
  BYTES, ID,
  encode, decode, encodingLength
}
