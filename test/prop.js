const { Prop } = require('../prop')
const test = require('tape')

test('new Prop()', (t) => {
  {
    const prop = new Prop({ type: 'TEST' })
  }

  t.end()
})
