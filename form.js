const { Group } = require('./group')

/**
 * A container for a form (FORM).
 * @class Form
 * @extends Group
 */
class Form extends Group {

  /**
   * `Form` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super('FORM', opts)
  }
}

/**
 * Module exports.
 */
module.exports = {
  Form
}
