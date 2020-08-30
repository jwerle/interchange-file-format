const { Chunk } = require('../chunk')
const { Prop } = require('../prop')
const { Form } = require('../form')
const { List } = require('../list')
const test = require('tape')

test('new List()', (t) => {
  {
    const list = new List({ type: 'TEST' })
    const form = new Form({ type: 'TEST' })
    const prop = new Prop({ type: 'TEST' })

    const ping = new Chunk('ping', { size: 5 }) // ping with 5 bytes of data
    const pong = new Chunk('pong', { size: 5 }) // pong with 5 bytes of data

    ping.set(Buffer.from('hello'))
    pong.set(Buffer.from('world'))

    form.append([ ping, pong, prop ])
    prop.append(pong)
    list.append([ form, prop ])

    t.deepEqual(form, Form.from(form.toBuffer()))
    t.deepEqual(prop, Prop.from(prop.toBuffer()))
    t.deepEqual(list, List.from(list.toBuffer()))

    t.deepEqual([ prop ], list.props)
  }

  t.end()
})
