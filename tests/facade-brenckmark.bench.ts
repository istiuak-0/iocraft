import {createFacadeObj} from '../src/core/facade'
import { bench, describe } from 'vitest';




// example Services

class SmallService {
  prop1 = 'value1';
  prop2 = 'value2';
  prop3 = 'value3';
  prop4 = 'value4';
  prop5 = 'value5';
  
  method1() { return 'method1'; }
  method2() { return 'method2'; }
  method3() { return 'method3'; }
}

class MediumService {
  constructor() {
    for (let i = 1; i <= 15; i++) {
      this[`prop${i}`] = `value${i}`;
    }
  }
  
  method1() { return 'method1'; }
  method2() { return 'method2'; }
  method3() { return 'method3'; }
  method4() { return 'method4'; }
  method5() { return 'method5'; }
  method6() { return 'method6'; }
  method7() { return 'method7'; }
  method8() { return 'method8'; }
  method9() { return 'method9'; }
  method10() { return 'method10'; }
}

class LargeService {
  constructor() {
    for (let i = 1; i <= 30; i++) {
      this[`prop${i}`] = `value${i}`;
    }
  }
  
  method1() {} method2() {} method3() {} method4() {} method5() {}
  method6() {} method7() {} method8() {} method9() {} method10() {}
  method11() {} method12() {} method13() {} method14() {} method15() {}
  method16() {} method17() {} method18() {} method19() {} method20() {}
}

class BaseService {
  baseProp1 = 'base1';
  baseProp2 = 'base2';
  
  baseMethod1() { return 'base1'; }
  baseMethod2() { return 'base2'; }
}

class DerivedService extends BaseService {
  derivedProp1 = 'derived1';
  derivedProp2 = 'derived2';
  derivedProp3 = 'derived3';
  
  derivedMethod1() { return 'derived1'; }
  derivedMethod2() { return 'derived2'; }
  derivedMethod3() { return 'derived3'; }
}


// Benchmarks


describe('Facade Creation Performance', () => {
  bench('Small Service (5 props + 3 methods)', () => {
    const instance = new SmallService();
    createFacadeObj(instance);
  });

  bench('Medium Service (15 props + 10 methods)', () => {
    const instance = new MediumService();
    createFacadeObj(instance);
  });

  bench('Large Service (30 props + 20 methods)', () => {
    const instance = new LargeService();
    createFacadeObj(instance);
  });

  bench('Inherited Service (prototype chain)', () => {
    const instance = new DerivedService();
    createFacadeObj(instance);
  });
});

describe('Real-World Scenarios', () => {
  bench('Baseline: Create instance (no facade)', () => {
    new MediumService();
  });

  bench('Instance + Facade', () => {
    const instance = new MediumService();
    createFacadeObj(instance);
  });

  bench('Typical component (5 services)', () => {
    const instances = [
      new SmallService(),
      new SmallService(),
      new MediumService(),
      new MediumService(),
      new LargeService(),
    ];
    
    instances.forEach(instance => createFacadeObj(instance));
  });

  bench('Heavy component (15 services)', () => {
    const instances = Array.from({ length: 15 }, () => new MediumService());
    instances.forEach(instance => createFacadeObj(instance));
  });

  bench('Worst case: 5 services × 3 calls each (no caching)', () => {
    for (let i = 0; i < 5; i++) {
      const instance = new MediumService();
      createFacadeObj(instance);
      createFacadeObj(instance);
      createFacadeObj(instance);
    }
  });
});

describe('Comparison: Caching vs No Caching', () => {
  // Simulate caching
  const cache = new Map();

  bench('With caching (first call)', () => {
    const instance = new MediumService();
    if (!cache.has('test')) {
      cache.set('test', createFacadeObj(instance));
    }
  });

  bench('With caching (subsequent calls)', () => {
    const cached = cache.get('test');
    // Just retrieving from cache
  });

  bench('No caching (every call)', () => {
    const instance = new MediumService();
    createFacadeObj(instance);
  });
});

describe('60fps Performance Budget', () => {
  // 60fps = 16.67ms per frame
  // How many facades can we create in one frame?
  
  bench('Create 10 facades (should be << 16.67ms)', () => {
    for (let i = 0; i < 10; i++) {
      const instance = new MediumService();
      createFacadeObj(instance);
    }
  });

  bench('Create 50 facades (stress test)', () => {
    for (let i = 0; i < 50; i++) {
      const instance = new MediumService();
      createFacadeObj(instance);
    }
  });

  bench('Create 100 facades (extreme stress test)', () => {
    for (let i = 0; i < 100; i++) {
      const instance = new MediumService();
      createFacadeObj(instance);
    }
  });
});