declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: typeof AudioWorkletProcessor
): void;

class AudioMatchProcessor extends AudioWorkletProcessor {
  private readonly bufferSize = 4096;
  private readonly buffer: Float32Array;
  private offset = 0;

  constructor() {
    super();
    this.buffer = new Float32Array(this.bufferSize);
  }

  process(inputs: Float32Array[][]): boolean {
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

export {};