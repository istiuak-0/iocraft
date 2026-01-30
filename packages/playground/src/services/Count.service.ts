import { watch } from 'vue';
import { Provide } from 'vuedi';
import { Store } from 'vuedi/helpers';

@Provide()
export class CountStore extends Store({
  data: 10,
  name: 'Istiuak',
}) {
  unwatch = watch(this.select('data'), () => {



console.log();



  });
}
