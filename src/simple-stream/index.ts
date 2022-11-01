import { EventEmitter } from 'events';

export declare interface SimpleStream<T> {
  on(event: 'data', listener: (data: T) => void): this;
  on(event: 'end', listener: () => void): this;
  on(event: string, listener: Function): this;
}

export class SimpleStream<T> extends EventEmitter {
  emitData(data: T): void {
    this.emit('data', data);
  }

  emitEnd(): void {
    this.emit('end');
  }
}
