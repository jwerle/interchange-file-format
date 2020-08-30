const { Group } = require('./group')
const { ID } = require('./id')

/**
 * A container for a form (FORM).
 * @class Form
 * @extends Group
 */
class Form extends Group {

  /**
   * 4 byte ID for this type.
   * @static
   * @accessor
   * @type {ID}
   */
  static get ID() {
    return ID.from('FORM')
  }

  /**
   * `Form` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super(Form.ID, opts)
  }
}

/**
 * Module exports.
 */
module.exports = {
  Form
}
