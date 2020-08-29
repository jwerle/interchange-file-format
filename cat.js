const { Group } = require('./group')

/**
 * A container for a concatenation.
 * @class CAT
 * @extends Group
 */
class CAT extends Group {

  /**
   * `CAT` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super('CAT', opts)
  }

  /**
   * Append a `Group` or an array of Groups to the `CAT` instance.
   * @param {Buffer} buffer
   */
  append(chunk) {
    if (Array.isArray(chunk) && !chunk.toBuffer) {
      for (const ch of chunk) {
        this.append(ch)
      }
    } else if (chunk.append) {
      this.push(chunk)
    }
  }
}

/**
 * Module exports.
 */
module.exports = {
  CAT
}
