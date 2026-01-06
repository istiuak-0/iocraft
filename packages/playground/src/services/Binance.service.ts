import { ref } from 'vue';
import { Register, type Disposable } from '@vuedi/core';

@Register({ in: 'app' })
export class BinanceService implements Disposable {
  public socket: WebSocket | null = null;
  public connected = ref(false);
  public lastMessage = ref<any>({});

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

    this.socket.onopen = () => {
      this.connected.value = true;
      console.log('[BinanceService] connected');
    };

    this.socket.onmessage = event => {
      this.lastMessage.value = JSON.parse(event.data);
    };

    this.socket.onerror = err => {
      console.error('[BinanceService] error', err);
    };

    this.socket.onclose = () => {
      this.connected.value = false;
      console.log('[BinanceService] closed');
    };
  }

  dispose(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;

      this.socket.close();
      this.socket = null;
    }
  }
}
