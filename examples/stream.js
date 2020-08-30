const { Form } = require('../')
const fs = require('fs')

const form = new Form({ type: 'AIIF' })
const reader = fs.createReadStream(process.argv[2])
const writer = form.createWriteStream()

// echo
reader.pipe(writer).on('finish', () => {
  const other = Form.from(fs.readFileSync(process.argv[2]))
  console.error('%s %s', form.id, form.type);

  form.createReadStream().pipe(process.stdout)
})
