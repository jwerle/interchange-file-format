const assert = require('nanoassert')

/**
 * Normalize a key into a string.
 * @private
 */
function normalizeKey(key) {
  if (key && 'string' !== typeof key && 'function' === typeof key.toString) {
    key = key.toString()
  }

  // istanbul ignore next
  if ('string' === typeof key) {
    key = key.trim()
  }

  return key
}

/**
 * A special map of built in types.
 * @class BuiltIns
 * @extends Map
 */
class BuiltIns {

  /**
   * `CAT` builtin type.
   * @static
   * @accessor
   * @type {CAT}
   */
  static get CAT() {
    return require('./cat').CAT
  }

  /**
   * `FORM` builtin type.
   * @static
   * @accessor
   * @type {Form}
   */
  static get FORM() {
    return require('./form').Form
  }

  /**
   * `LIST` builtin type.
   * @static
   * @accessor
   * @type {List}
   */
  static get LIST() {
    return require('./list').List
  }

  /**
   * `PROP` builtin type.
   * @static
   * @accessor
   * @type {Prop}
   */
  static get PROP() {
    return require('./prop').Prop
  }

  /**
   * Guarded `Map.prototype.get()`
   * @param {String|Buffer|ID} key
   * @return {Mixed}
   */
  get(key) {
    key = normalizeKey(key)
    return BuiltIns[key]
  }
}

/**
 * Module exports.
 */
module.exports = Object.assign(new BuiltIns(), {
  BuiltIns
})
