class AudioMatchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0];

    if (!input || input.length === 0) {
      return true;
    }

    const channel = input[0];

    if (!channel || channel.length === 0) {
      return true;
    }

    for (let i = 0; i < channel.length; i += 1) {
      this.buffer[this.offset] = channel[i];
      this.offset += 1;

      if (this.offset >= this.bufferSize) {
        const chunk = new Float32Array(this.bufferSize);
        chunk.set(this.buffer);

        this.port.postMessage(chunk, [chunk.buffer]);

        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-match-processor', AudioMatchProcessor);
