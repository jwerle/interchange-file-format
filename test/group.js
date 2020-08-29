const { Group } = require('../group')
const { Chunk } = require('../chunk')
const test = require('tape')

test('new Group()', (t) => {
  const form = new Group('FORM', { type: 'TEST' })

  t.equal('FORM', form.id.toString())
  t.equal('TEST', form.type.toString())

  const ping = Chunk.from('ping', { size: 5 })
  const pong = Chunk.from('pong', { size: 5 })

  ping.set('hello')
  pong.set('world')

  t.equal(1, form.push(ping))
  t.equal(2, form.push(pong))

  t.end()
})
