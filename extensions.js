const assert = require('nanoassert')

/**
 * Normalize a key into a string.
 * @private
 */
function normalizeKey(key) {
  if (key && 'string' !== typeof key && 'function' === typeof key.toString) {
    key = key.toString()
  }

  return key
}

/**
 * A special `Map` for extensions.
 * @class Extensions
 * @extends Map
 */
class Extensions extends Map {

  /**
   * Overloads `Map.prototype.set()` to handle `ID` and  `Buffer` like
   * inputs as `key`.
   * @param {Mixed} key
   * @param {Mixed} extension
   */
  set(key, extension) {
    key = normalizeKey(key)
    assert(key && 4 === key.length, 'invalid extension key length')
    return super.set(key, extension)
  }

  /**
   * Overloads `Map.prototype.get()` to handle `ID` and  `Buffer` like
   * inputs as `key`.
   * @param {Mixed} key
   */
  get(key) {
    return super.get(normalizeKey(key))
  }

  /**
   * Overloads `Map.prototype.delete()` to handle `ID` and  `Buffer` like
   * inputs as `key`.
   * @param {Mixed} key
   */
  delete(key) {
    key = normalizeKey(key)
    assert(key && 4 === key.length, 'invalid extension key length')
    return super.delete(key)
  }

  /**
   * Overloads `Map.prototype.has()` to handle `ID` and  `Buffer` like
   * inputs as `key`.
   * @param {Mixed} key
   */
  has(key) {
    return super.has(normalizeKey(key))
  }
}

/**
 * Module exports.
 */
module.exports = Object.assign(new Extensions(), {
  Extensions
})
