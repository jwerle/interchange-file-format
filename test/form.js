const { Chunk } = require('../chunk')
const { Form } = require('../form')
const test = require('tape')

test('new Form()', (t) => {
  {
    const form = new Form({ type: 'TEST' })
    const ping = new Chunk('ping', { size: 5 }) // ping with 5 bytes of data
    const pong = new Chunk('pong', { size: 5 }) // pong with 5 bytes of data

    ping.set('hello')
    pong.set('world')

    form.append([ ping, pong ])

    t.deepEqual(pong, Chunk.from(pong.toBuffer()))
    t.deepEqual(form, Form.from(form.toBuffer()))
  }

  t.end()
})
