const extensions = require('../extensions')
const { Group } = require('../group')
const { Chunk } = require('../chunk')
const builtins = require('../builtins')
const test = require('tape')

test('Group.from()', (t) => {
  class TextChunk extends Chunk {
    get text() {
      return this.toString()
    }
  }

  class PingChunk extends Chunk { }
  class PongChunk extends Chunk { }

  extensions.set('NAME', TextChunk)
  extensions.set('AUTH', TextChunk)
  extensions.set('PING', PingChunk)
  extensions.set('PONG', PongChunk)

  const CAT = builtins.get('CAT')
  const FORM = builtins.get('FORM')

  const group = new Group('FORM', { type: 'TEST' })
  const ping = Chunk.from('PING', { size: 8 })
  const pong = Chunk.from('PONG', { size: 8 })
  const cat = new CAT({ type: 'TEST' })
  const form = new FORM({ type: 'TEST' })
  const name = new TextChunk('NAME', { size: 12 })
  const author = new TextChunk('AUTH', { size: 16 })

  name.set('joseph werle')
  author.set('some author name')
  form.append(name)
  form.unshift(author.toBuffer())

  ping.set('hello')
  pong.set('world')

  group.append([ ping, form, cat ])
  group.push(pong.toBuffer())

  t.deepEqual(group, Group.from(group.toBuffer()))
  t.deepEqual(group, Group.from(group))
  t.equal('joseph werle', group[1][1].toString())
  t.equal('some author name', group[1][0].toString())

  const doubled = group.concat(group)
  t.deepEqual(group.concat(group), doubled)

  const texts = group.filter(function filter(chunk) {
    if (chunk && chunk.id && ['NAME', 'AUTH'].includes(chunk.id.toString())) {
      return chunk
    } else if (Array.isArray(chunk) && chunk.filter) {
      const filtered = chunk.filter(filter)
      if (filtered.length) {
        return filtered
      }
    }
  })

  const expectedTexts = new Group('FORM', { type: 'TEXT' })
  expectedTexts.append(new FORM({ type: 'TEST' }))
  expectedTexts[0].push(author)
  expectedTexts[0].push(name)
  t.deepEqual(texts, expectedTexts)

  const expectedTextsCopy = expectedTexts.slice()
  t.deepEqual(expectedTexts, expectedTextsCopy)

  const expectedTextsUpperCased = expectedTexts.map((form) => {
    return form.map((text) => text.map((byte) => {
      return byte >= 65 && byte <= 122 ? byte - 32 : byte
    }))
  })

  t.equal('SOME AUTHOR NAME', expectedTextsUpperCased[0][0].toString())
  t.equal('JOSEPH WERLE', expectedTextsUpperCased[0][1].toString())

  t.deepEqual(form.shift(), author)
  t.deepEqual(form.pop(), name)

  form.append([ name, author ])
  t.deepEqual([ name, author ], form.toArray())
  t.deepEqual([ name ], form.splice(0, 1).toArray())
  t.deepEqual([ author ], form.splice(0, 1).toArray())
  t.deepEqual([ ], form.toArray())

  t.end()
})

test('new Group()', (t) => {
  const form = new Group('FORM', { type: 'TEST' })

  t.equal('FORM', form.id.toString())
  t.equal('TEST', form.type.toString())

  const ping = Chunk.from('ping', { size: 5 })
  const pong = Chunk.from('pong', { size: 5 })

  ping.set('hello')
  pong.set('world')

  t.equal(1, form.push(ping))
  t.equal(ping.size, form.size)
  t.equal(2, form.push(pong))
  t.equal(ping.size + pong.size, form.size)

  t.end()
})

test('ReadStream', (t) => {
  const form = new Group('FORM', { type: 'TEST' })

  t.equal('FORM', form.id.toString())
  t.equal('TEST', form.type.toString())

  const ping = Chunk.from('ping', { size: 5 })
  const pong = Chunk.from('pong', { size: 5 })

  ping.set('hello')
  pong.set('world')

  form.push(ping)
  form.push(pong)

  const chunks =  []
  form.createReadStream()
    .on('data', (chunk) => chunks.push(chunk))
    .on('end', () => {
      t.deepEqual(form, Group.from(Buffer.concat(chunks)))
      t.end()
    })
})

test('WriteStream', (t) => {
  const form = new Group('FORM', { type: 'TEST' })
  const copy = new Group('FORM', { type: 'TEST' })

  t.equal('FORM', form.id.toString())
  t.equal('TEST', form.type.toString())

  const ping = Chunk.from('ping', { size: 5 })
  const pong = Chunk.from('pong', { size: 5 })

  ping.set('hello')
  pong.set('world')

  form.push(ping)
  form.push(pong)

  const chunks =  []
  form.createReadStream().pipe(copy.createWriteStream())
    .on('finish', () => {
      t.deepEqual(form, copy)
      t.end()
    })
})
