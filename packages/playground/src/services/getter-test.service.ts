import { ref } from 'vue';
import { Provide } from 'vuedi';

export const INTERNAL_SYMBOL = Symbol('internal');
export const USER_SYMBOL = Symbol('user');

class BaseService {
  baseRef = ref(0);
  basePlain = 'base';

  get baseComputed() {
    return this.baseRef.value * 2;
  }

  set baseComputed(v: number) {
    this.baseRef.value = v / 2;
  }

  baseMethod() {
    return 'base method';
  }

  [INTERNAL_SYMBOL] = 'base internal';
  [USER_SYMBOL] = ref('base user symbol');
}

class MiddleService extends BaseService {
  middleRef = ref(10);
  override basePlain = 'middle'; // shadowing

  get middleComputed() {
    return this.middleRef.value + this.baseRef.value;
  }

  middleMethod() {
    return 'middle method';
  }

  override [USER_SYMBOL] = ref('middle user symbol');
}

@Provide()
export class GetterTestService extends MiddleService {
  instanceRef = ref(100);
  private _private = 'secret';
  readonly readOnly = 'readonly';

  constructor() {
    super();
    Object.defineProperty(this, 'nonEnum', {
      value: ref(999),
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }

  get doubleInstance() {
    return this.instanceRef.value * 2;
  }

  set doubleInstance(v: number) {
    this.instanceRef.value = v / 2;
  }

  complexMethod(a: number, b: string) {
    return `${a}-${b}`;
  }

  static staticRef = ref(500);
  static staticPlain = 'static plain';

  static get staticDouble() {
    return this.staticRef.value * 2;
  }

  static set staticDouble(v: number) {
    this.staticRef.value = v / 2;
  }

  static staticMethod() {
    return 'static method';
  }

  static [INTERNAL_SYMBOL] = { token: 'complex-service' };
  static [USER_SYMBOL] = 'static user symbol';

  static get lockedStatic() {
    return 'locked';
  }
}

Object.defineProperty(GetterTestService, 'lockedStatic', {
  configurable: false,
});
