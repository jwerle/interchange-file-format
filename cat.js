const { Group } = require('./group')
const { ID } = require('./id')

/**
 * A container for a concatenation.
 * @class CAT
 * @extends Group
 */
class CAT extends Group {

  /**
   * 4 byte ID for this type.
   * @static
   * @accessor
   * @type {ID}
   */
  static get ID() {
    return ID.from('CAT ')
  }

  /**
   * `CAT` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super(CAT.ID, opts)
    this.onlyGroups = true
  }
}

/**
 * Module exports.
 */
module.exports = {
  CAT
}
