import { Register, type UnMounted } from '@vuedi/core';
import { ref } from 'vue';

@Register({
  in: 'root',
})
export class AppService implements UnMounted {
  isUnmounted = ref(false);
  onUnmounted(): void {
    console.log('applcaiton unmounted');
  }
}
