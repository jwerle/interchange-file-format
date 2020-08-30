const { Chunk } = require('../chunk')
const { Form } = require('../form')
const { CAT } = require('../cat')
const test = require('tape')

test('new CAT()', (t) => {
  {
    const cat = new CAT({ type: 'TEST' })
    const form = new Form({ type: 'TEST' })
    const ping = new Chunk('ping', { size: 5 }) // ping with 5 bytes of data
    const pong = new Chunk('pong', { size: 5 }) // pong with 5 bytes of data

    ping.set('hello')
    pong.set('world')

    cat.append([ ping, pong ]) // will ignore as CAT only access "group" like items
    form.append([ ping, pong ])
    cat.append(form)
    t.ok(1 === cat.length)
    t.deepEqual([ form ], cat.toArray())

    t.deepEqual(pong, Chunk.from(pong.toBuffer()))
    t.deepEqual(cat, CAT.from(cat.toBuffer()))
  }

  t.end()
})
