import { ref } from 'vue';
import { Register, type UnMounted } from '@vuedi/core';

@Register({ in: 'root' })
export class BinanceService implements UnMounted {
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


  onUnmounted(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;

      this.socket.close();
      this.socket = null;
    }

    try {
      const logs = JSON.parse(localStorage.getItem('binanceServiceLogs') || '[]');
      logs.push({
        time: new Date().toISOString(),
        message: '[BinanceService] onUnmounted ran',
        connected: this.connected.value,
        lastMessage: this.lastMessage.value,
      });
      localStorage.setItem('binanceServiceLogs', JSON.stringify(logs));
    } catch (e) {
      console.error('[BinanceService] Failed to write logs to localStorage', e);
    }

    console.log('[BinanceService] onUnmounted finished and logged to localStorage');
  }
}
