const { Group } = require('./group')
const { ID } = require('./id')

/**
 * A container for a properties (PROP).
 * @class Prop
 * @extends Group
 */
class Prop extends Group {

  /**
   * 4 byte ID for this type.
   * @static
   * @accessor
   * @type {ID}
   */
  static get ID() {
    return ID.from('PROP')
  }

  /**
   * `Prop` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super(Prop.ID, opts)
  }
}

/**
 * Module exports.
 */
module.exports = {
  Prop
}
