const extensions = require('../extensions')
const test = require('tape')

test('extensions', (t) => {
  t.ok(extensions instanceof Map)
  class PING {}
  class PONG {}
  extensions.set('PING', PING)
  extensions.set(Buffer.from('PONG'), PONG)
  t.equal(PING, extensions.get('PING'))
  t.equal(PONG, extensions.get('PONG'))
  t.equal(PONG, extensions.get(Buffer.from('PONG')))
  t.ok(extensions.has('PING'))
  t.ok(extensions.has(Buffer.from('PING')))

  extensions.delete('PING')
  extensions.delete(Buffer.from('PONG'))

  t.notOk(extensions.has('PING'))
  t.notOk(extensions.has('PONG'))
  t.end()
})
