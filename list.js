const { Chunk, ChunkIterator } = require('./chunk')
const { Group } = require('./group')
const { Form } = require('./form')
const { Prop } = require('./prop')
const { ID } = require('./id')

/**
 * A container for a list (LIST) and its items.
 * @class List
 * @extends Group
 */
class List extends Group {

  /**
   * 4 byte ID for this type.
   * @static
   * @accessor
   * @type {ID}
   */
  static get ID() {
    return ID.from('LIST')
  }

  /**
   * `List` class constructor
   */
  constructor(opts, optionsWhenAssumedGroup) {
    if (optionsWhenAssumedGroup) {
      opts = optionsWhenAssumedGroup
    }

    super(List.ID, opts)
  }

  /**
   * An accessor for all PROP items in this list.
   * @accessor
   * @type {Array<Mixed>}
   */
  get props() {
    return this.toArray().filter((item) => {
      const id = (item && item.id && item.id.toString && item.id.toString())
      return 'PROP' === id
    })
  }
}

/**
 * Module exports.
 */
module.exports = {
  List
}
