import { computed, ref } from 'vue';




class BaseService {
  baseData = ref(100);
}

@Service()
export class CountService extends BaseService {
  data = ref<number>(0);

  computedData = computed(() => {
    return this.data.value + this.baseData.value;
  });

  plus() {
    console.log('before:', this.data.value);
    this.data.value++;
    console.log('after:', this.data.value);
  }

  minus() {
    console.log('before:', this.data.value);
    this.data.value--;
    console.log('after:', this.data.value);
  }





}
