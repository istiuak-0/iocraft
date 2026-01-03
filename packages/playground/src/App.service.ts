import { Register, type UnMounted } from '@vuedi/core';
import { ref } from 'vue';

@Register({
  in: 'component',
  eger: false,
})
export class AppService implements UnMounted {
  constructor() {
    console.log('app service initialzed');
  }

  public data = ref('data');

  onUnmounted(): void {
    console.log('service is unmounted');
  }
}
