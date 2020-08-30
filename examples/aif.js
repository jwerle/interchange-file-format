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

const buf = fs.readFileSync('/home/werle/Documents/OP-1/AIF/8-22-20-92bpm/tape/track_1.aif')
const form = Form.from(buf)
console.log(form.type.toString());

for (const chunk of form) {
  console.log(chunk.id.toString());
  if (chunk.sampleRate) {
    console.log(chunk.numChannels, chunk.numSampleFrames, chunk.sampleSize, chunk.sampleRate);
  }

  if (chunk.soundData) {
    console.log(chunk.offset, chunk.blockSize, chunk.soundData);
  }
}
