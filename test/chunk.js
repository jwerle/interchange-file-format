const { Chunk } = require('../chunk')
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

    t.equal('FORM', chunk.id.toString())
    t.equal(16, chunk.length)
    t.equal(ancestor, chunk.ancestor)
  }

  t.end()
})
