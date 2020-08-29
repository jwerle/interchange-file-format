const { Group } = require('./group')

/**
 * A container for a properties (PROP).
 * @class Prop
 * @extends Group
 */
class Prop extends Group {

  /**
   * `Prop` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super('PROP', opts)
  }
}

module.exports = {
  Prop
}
