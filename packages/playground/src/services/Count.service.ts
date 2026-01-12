import { Register, resolve } from '@vuedi/core';
import { computed, ref } from 'vue';

@Register()
export class CountService {
  date = ref<number>(0);
  data2 = this.date.value + 2; // this will break

  computed = computed(() => {
    return this.date.value + 4;
  }); // this will also have some issues

  plus() {
    console.log('before:', this.date.value);
    this.date.value++;
    console.log('after:', this.date.value);
  }

  minus() {
    this.date.value--;
  }
}

@Register()
export class Http {}

@Register()
export class Query {
  private http = resolve(Http);

  private datastates = {};

  //@ts-ignore
  res = this.http.query(() => ({
    queryKey: [],
    queryFn: () => fetch('asaaSD'),
  }));
}
