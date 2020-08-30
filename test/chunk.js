const { Chunk, ChunkIterator } = require('../chunk')
const test = require('tape')

test('new Chunk()', (t) => {
  {
    const chunk = new Chunk('FORM', { size: 32 })

    t.equal('FORM', chunk.id.toString())
    t.equal(32, chunk.length)
    t.equal(null, chunk.ancestor)
  }

  {
    const chunk = new Chunk('FORM', { size: 31 })

    t.equal('FORM', chunk.id.toString())
    t.equal(32, chunk.length) // accounts for padding
    t.equal(null, chunk.ancestor)
  }

  {
    const ancestor = new Chunk('LIST', { size: 32 })
    const chunk = Chunk.from(new Chunk('FORM', { ancestor, size: 16 }))
    const other = Chunk.from(chunk.toBuffer(), { ancestor })

    t.equal('FORM', chunk.id.toString())
    t.equal(16, chunk.length)
    t.equal(ancestor, chunk.ancestor)
    t.equal(ancestor, other.ancestor)
    t.deepEqual(chunk, other)
  }

  t.end()
})

test('Chunk.from()', (t) => {
  const ancestor = new Chunk('LIST', { size: 32 })
  const chunk = Chunk.from(Buffer.from('ping'), { size: 5, ancestor })
  chunk.set('HELLO')
  t.equal('ping', chunk.id.toString())
  t.equal('HELLO\x00', chunk.toString()) // padded with '0' byte
  t.deepEqual(chunk, Chunk.from(chunk.toBuffer()))

  chunk.set('HELLO!')

  t.equal('ping', chunk.id.toString())
  t.equal('HELLO!', chunk.toString())
  t.deepEqual(chunk, Chunk.from(chunk.toBuffer()))
  t.end()
})

test('Chunk.header()', (t) => {
  const chunk = Chunk.from(Buffer.from('ping'), { size: 8 })
  const header = Chunk.header(chunk.toBuffer())
  t.equal('ping', header.id.toString())
  t.equal(8, header.size)
  t.end()
})

test('chunk.map()', (t) => {
  const chunk = new Chunk('TEST', { size: 8 })
  chunk.set('helloooo')
  const upper = chunk.map((byte) => byte - 32)
  t.equal('HELLOOOO', upper.toString())
  t.equal(upper.ancestor, chunk)
  t.end()
})

test('chunk.filter()', (t) => {
  const chunk = new Chunk('TEST', { size: 8 })
  chunk.set('abcdefgh')
  const vowels = chunk.filter((byte) => [97, 101, 105, 111, 117].includes(byte))
  t.equal('ae', vowels.toString())
  t.equal(vowels.ancestor, chunk)
  t.end()
})

test('chunk.slice()', (t) => {
  const chunk = new Chunk('TEST', { size: 8 })
  chunk.set('aabbccdd')

  const first = chunk.slice(0, 4)
  const second = chunk.slice(4, 8)
  const aa = first.slice(0, 2)
  const bb = first.slice(2, 4)
  const cc = second.slice(0, 2)
  const dd = second.slice(2, 4)

  t.equal(first.ancestor, chunk)
  t.equal(second.ancestor, chunk)
  t.equal(aa.ancestor, first)
  t.equal(bb.ancestor, first)
  t.equal(cc.ancestor, second)
  t.equal(dd.ancestor, second)

  t.equal('aabb', first.toString())
  t.equal('ccdd', second.toString())

  t.equal('aa', aa.toString())
  t.equal('bb', bb.toString())
  t.equal('cc', cc.toString())
  t.equal('dd', dd.toString())
  t.end()
})

test('ChunkIterator.from()', (t) => {
  const chunks = [
    Chunk.from('ping', { size: 6 }),
    Chunk.from('pong', { size: 6 }),
  ]

  chunks[0].set('hello!')
  chunks[1].set('world!')

  const buffer = Buffer.concat(chunks.map((chunk) => chunk.toBuffer()))
  const iterator = ChunkIterator.from(buffer)

  t.deepEqual(iterator.next().value, chunks[0])
  t.deepEqual(iterator.next().value, chunks[1])
  t.ok(iterator.next().done)

  let i = 0
  for (const chunk of ChunkIterator.from(buffer)) {
    t.ok(chunk)
    t.deepEqual(chunk, chunks[i++])
  }

  t.end()
})
