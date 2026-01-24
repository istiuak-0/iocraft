import { computed, ref } from 'vue';
import { obtain, Service } from 'vuedi';
import { RouterService } from 'vuedi/helpers';


class BaseService {
  baseData = ref(100);
}

@Service()
export class CountService extends BaseService {
  private router=obtain(RouterService)
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


navigate(){

this.router.push('/')
}



}
