const builtins = require('../builtins')
const { ID } = require('../id')
const test = require('tape')

test('builtins', (t) => {
  t.ok('function' === typeof builtins.get(ID.from('CAT ')))
  t.ok('function' === typeof builtins.get(Buffer.from('FORM')))
  t.ok('function' === typeof builtins.get('LIST'))
  t.ok('function' === typeof builtins.get('PROP'))
  t.end()
})
