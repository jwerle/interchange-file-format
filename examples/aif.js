const { Chunk } = require('../chunk')
const { Form } = require('../form')
const fs = require('fs')

Form.extensions.set('COMM', class CommonChunk extends Chunk {
  get numChannels() {
    return this.readInt16BE(0, 2)
  }

  get numSampleFrames() {
    return this.readInt32BE(2, 4)
  }

  get sampleSize() {
    return this.readInt16BE(6, 2)
  }

  get sampleRate() {
    const x = this.readUIntBE(8, 2)
    const y = this.readUIntBE(10, 1)
    const z = this.readUIntBE(11, 1)
    const pre = 16398
    const pad = x - pre
    const shifted = (y << 8) + z
    return shifted << pad
  }
})

Form.extensions.set('SSND', class SoundDataChunk extends Chunk {
  get offset() {
    return this.readUIntBE(0, 4)
  }

  get blockSize() {
    return this.readUIntBE(4, 4)
  }

  get soundData() {
    return this.slice(8)
  }
})

if (!process.argv[2]) {
  // | sox -V -t raw -b 16 -e signed -c 1 -r 44.1k - -t wav -r 16k - | mpv -
  console.error('usage: node %s <filename>', process.argv[1])
  console.error('example:\n  # node %s ./track.aif | sox -V -t raw -b 16 -e signed -c 1 -r 44.1k - -t wav -r 16k - | mpv -', process.argv[1])
  process.exit(2)
}
const buf = fs.readFileSync(process.argv[2])
const form = Form.from(buf)
console.error(form.type.toString());

for (const chunk of form) {
  console.error(chunk.id.toString());
  process.stdout.write(chunk)
  if (chunk.sampleRate) {
    console.error(chunk.numChannels, chunk.numSampleFrames, chunk.sampleSize, chunk.sampleRate);
  }

  if (chunk.soundData) {
    console.error(chunk.offset, chunk.blockSize, chunk.soundData);
  }
}
