const { ID, encode, decode, encodingLength } = require('../id')
const varint = require('varint')
const test = require('tape')

const BYTES = 4

test('ID.BYTES', (t) => {
  t.equal(4, ID.BYTES)
  t.end()
})

test('new ID()', (t) => {
  const id = new ID()
  t.equal(4, id.length, '4 byte length')
  t.equal('00000000', id.toString('hex'), 'initial null bytes')
  t.end()
})

test('ID.alloc()', (t) => {
  const id = ID.alloc()
  t.equal(4, id.length, '4 byte length')
  t.equal('00000000', id.toString('hex'), 'initial null bytes')
  t.end()
})

test('ID.from()', (t) => {
  {
    const id = ID.from('FORM')
    t.equal(4, id.length, '4 byte length')
    t.equal('464f524d', id.toString('hex'), 'FORM as hex')
    t.ok(id.isValid)
  }

  {
    const id = ID.from(parseInt(Buffer.from('FORM').toString('hex'), 16))
    t.equal(4, id.length, '4 byte length')
    t.equal('464f524d', id.toString('hex'), 'FORM as hex')
    t.ok(id.isValid)
  }

  {
    const id = ID.from(0)
    t.equal(4, id.length, '4 byte length')
    t.equal('00000000', id.toString('hex'), '0 as hex')
    t.notOk(id.isValid)
  }

  {
    const id = ID.from(null)
    t.equal(4, id.length, '4 byte length')
    t.equal('00000000', id.toString('hex'), '0 as hex')
    t.notOk(id.isValid)
  }

  t.end()
})

test('ID.EMPTY()', (t) => {
  t.deepEqual(ID.EMPTY, ID.from('00000000'))
  t.notOk(ID.EMPTY.isValid)
  t.end()
})

test('ID.validate()', (t) => {
  t.notOk(ID.validate(0))
  t.notOk(ID.validate(null))
  t.notOk(ID.validate(false))
  t.notOk(ID.validate([]))
  t.notOk(ID.validate([0, 0, 0]))
  t.notOk(ID.validate([0, 0x20 - 1, 0x20, 0x21]))
  t.notOk(ID.validate([0, 0x20, 0x20, 0x7e + 1]))
  t.notOk(ID.validate(''))
  t.notOk(ID.validate('foo'))
  t.notOk(ID.validate(' foo'))
  t.notOk(ID.validate(function () {}))
  t.notOk(ID.validate({}))
  t.notOk(ID.validate(Object.create(null)))
  t.notOk(ID.validate(Buffer.alloc(3)))

  t.ok(ID.validate(Buffer.alloc(4)))
  t.ok(ID.validate('form'))
  t.ok(ID.validate('foo '))
  t.ok(ID.validate(ID.from('form')))
  t.ok(ID.validate(Uint8Array.from('form')))
  t.ok(ID.validate(parseInt(Buffer.from('form').toString('hex'), 16)))
  t.ok(ID.validate(varint.encode(parseInt(Buffer.from('form').toString('hex'), 16))))
  t.ok(ID.validate(Buffer.from('form').toString('hex'), 'hex'))
  t.ok(ID.validate(Buffer.from('form').toString('binary'), 'binary'))
  t.ok(ID.validate(Buffer.from('form').toString('utf8')))

  t.equal('form', ID.from('form').toBuffer().toString())

  t.end()
})

test('encode()', (t) => {
  const id = encode('FORM')
  t.equal(4, id.length, '4 byte length')
  t.equal('464f524d', id.toString('hex'), 'FORM as hex')
  t.end()
})

test('decode()', (t) => {
  const id = encode('FORM')
  t.equal('FORM', decode(id))
  t.end()
})

test('encodingLength()', (t) => {
  t.equal(BYTES, encodingLength())
  t.end()
})
