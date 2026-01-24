import { computed, ref } from 'vue';
import { obtain, Service } from 'vuedi';
import { RouteService } from 'vuedi/router';

class BaseService {
  baseData = ref(100);
}

@Service()
export class CountService extends BaseService {
  private route = obtain(RouteService);
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


getCurrentRoute(){
this.route.

}

}
