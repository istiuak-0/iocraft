import { describe, it, expect, vi } from 'vitest';
import { obtain, obtainRaw, obtainInstance, obtainRawInstance, Register } from './../src/core';

describe('Circular Dependency Detection (Getter-Based Resolution)', () => {


  // SINGLETON WITH FACADE (obtain)

  describe('obtain() - Singleton with Facade', () => {

    it('should resolve circular dependency using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA);
        }

        getName() {
          return 'ServiceB';
        }

        getValueFromA() {
          return this.serviceA.getValue();
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');

      const serviceB = obtain(ServiceB);
      expect(serviceB.getValueFromA()).toBe('ServiceB');
    });

    it('should handle 3-way circular dependencies with getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        getName() {
          return 'A';
        }

        getFromB() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceC() {
          return obtain(ServiceC);
        }

        getName() {
          return 'B';
        }

        getFromC() {
          return this.serviceC.getName();
        }
      }

      @Register()
      class ServiceC {
        private get serviceA() {
          return obtain(ServiceA);
        }

        getName() {
          return 'C';
        }

        getFromA() {
          return this.serviceA.getName();
        }
      }

      const serviceA = obtain(ServiceA);
      const serviceB = obtain(ServiceB);
      const serviceC = obtain(ServiceC);

      expect(serviceA.getFromB()).toBe('B');
      expect(serviceB.getFromC()).toBe('C');
      expect(serviceC.getFromA()).toBe('A');
    });

    it('should throw error when using field initializer for circular dependency', () => {
      @Register()
      class ServiceA {
        private serviceB = obtain(ServiceB); // Field initializer

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private serviceA = obtain(ServiceA);


        getName() {
          return 'ServiceB';
        }
      }

      expect(() => obtain(ServiceA)).toThrow(
        '[IocRaft] Circular dependency detected on: ServiceA'
      );
    });

    it('should throw error when accessing circular dependency in constructor', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        data: string;

        constructor() {
          // Accessing circular dependency during construction
          this.data = this.serviceB.getName();
        }


        getName() {
          return 'ServiceA';
        }

      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA);
        }
        data: string;

        constructor() {
          this.data = this.serviceA.getName()
        }


        getName() {
          return 'ServiceB';
        }
      }

      expect(() => obtain(ServiceA)).toThrow(
        '[IocRaft] Circular dependency detected on: ServiceA'
      );
    });

    it('should work with properties and methods through getters', () => {
      @Register()
      class ServiceA {
        public name = 'ServiceA';

        private get serviceB() {
          return obtain(ServiceB);
        }

        getNameFromB() {
          return this.serviceB.name;
        }
      }

      @Register()
      class ServiceB {
        public name = 'ServiceB';

        private get serviceA() {
          return obtain(ServiceA);
        }

        getNameFromA() {
          return this.serviceA.name;
        }
      }

      const serviceA = obtain(ServiceA);
      const serviceB = obtain(ServiceB);

      expect(serviceA.getNameFromB()).toBe('ServiceB');
      expect(serviceB.getNameFromA()).toBe('ServiceA');
    });

    it('should handle property setters through getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        public value = 10;

        incrementB() {
          this.serviceB.value++;
        }

        getValueFromB() {
          return this.serviceB.value;
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA);
        }

        public value = 20;

        incrementA() {
          this.serviceA.value++;
        }
      }

      const serviceA = obtain(ServiceA);
      const serviceB = obtain(ServiceB);

      expect(serviceA.getValueFromB()).toBe(20);

      serviceA.incrementB();
      expect(serviceA.getValueFromB()).toBe(21);

      serviceB.incrementA();
      expect(serviceA.value).toBe(11);
    });

    it('should handle getters through circular getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        private _value = 100;

        get value() {
          return this._value;
        }

        getValueFromB() {
          return this.serviceB.value;
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA);
        }

        private _value = 200;

        get value() {
          return this._value;
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getValueFromB()).toBe(200);
    });
  });


  // SINGLETON RAW (obtainRaw)

  describe('obtainRaw() - Singleton without Facade', () => {

    it('should resolve circular dependency using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtainRaw(ServiceB);
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtainRaw(ServiceA);
        }

        getName() {
          return 'ServiceB';
        }

        getServiceA() {
          return this.serviceA;
        }
      }

      const serviceA = obtainRaw(ServiceA);
      const serviceB = obtainRaw(ServiceB);

      expect(serviceB.getServiceA()).toBe(serviceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });

    it('should return same instance on multiple calls (singleton)', () => {
      @Register()
      class ServiceA {
        public id = Math.random();
      }

      const instance1 = obtainRaw(ServiceA);
      const instance2 = obtainRaw(ServiceA);

      expect(instance1).toBe(instance2);
      expect(instance1.id).toBe(instance2.id);
    });

    it('should throw error with field initializer', () => {
      @Register()
      class ServiceA {
        private serviceB = obtainRaw(ServiceB); //  Field initializer

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private serviceA = obtainRaw(ServiceA);


        getName() {
          return 'ServiceB';
        }
      }

      expect(() => obtainRaw(ServiceA)).toThrow(
        '[IocRaft] Circular dependency detected on: ServiceA'
      );
    });
  });


  // MIXED FACADE AND RAW
  describe('Mixed obtain() and obtainRaw()', () => {

    it('should handle circular dependency with mixed facade and raw using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB); // Facade
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtainRaw(ServiceA); // Raw
        }

        getName() {
          return 'ServiceB';
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });

    it('should handle reverse mixed pattern', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtainRaw(ServiceB); // Raw
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA); // Facade
        }

        getName() {
          return 'ServiceB';
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });
  });


  // TRANSIENT WITH FACADE (obtainInstance)
  describe('obtainInstance() - Transient with Facade', () => {

    it('should resolve circular dependency in transient instances using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtainInstance(ServiceB);
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtainInstance(ServiceA);
        }

        getName() {
          return 'ServiceB';
        }
      }

      const serviceA = obtainInstance(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });

    it('should create different instances on each call (transient)', () => {
      @Register()
      class ServiceA {
        public id = Math.random();
      }

      const instance1 = obtainInstance(ServiceA);
      const instance2 = obtainInstance(ServiceA);

      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it('should handle transient circular with methods', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtainInstance(ServiceB);
        }

        doWork() {
          return this.serviceB.process();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtainInstance(ServiceA);
        }

        process() {
          return 'processed';
        }
      }

      const serviceA = obtainInstance(ServiceA);
      expect(serviceA.doWork()).toBe('processed');
    });

    it('should throw error with field initializer in transient', () => {
      @Register()
      class ServiceA {
        private serviceB = obtainInstance(ServiceB); //  Field initializer

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private serviceA = obtainInstance(ServiceA);


        getName() {
          return 'ServiceB';
        }
      }

      expect(() => obtainInstance(ServiceA)).toThrow(
        '[IocRaft] Circular dependency detected on: ServiceA'
      );
    });
  });


  // TRANSIENT RAW (obtainRawInstance)
  describe('obtainRawInstance() - Transient without Facade', () => {

    it('should resolve circular dependency in raw transient instances using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtainRawInstance(ServiceB);
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtainRawInstance(ServiceA);
        }

        getName() {
          return 'ServiceB';
        }
      }

      const serviceA = obtainRawInstance(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });

    it('should create different instances without facade', () => {
      @Register()
      class ServiceA {
        public id = Math.random();
      }

      const instance1 = obtainRawInstance(ServiceA);
      const instance2 = obtainRawInstance(ServiceA);

      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it('should throw error with field initializer', () => {
      @Register()
      class ServiceA {
        private serviceB = obtainRawInstance(ServiceB); // Field initializer

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private serviceA = obtainRawInstance(ServiceA);

        getName() {
          return 'ServiceB';
        }
      }

      expect(() => obtainRawInstance(ServiceA)).toThrow(
        '[IocRaft] Circular dependency detected on: ServiceA'
      );
    });
  });


  // MIXED SINGLETON AND TRANSIENT

  describe('Mixed Singleton and Transient', () => {

    it('should handle singleton depending on transient using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtainInstance(ServiceB); // Transient
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA); // Singleton - breaks cycle
        }

        getName() {
          return 'ServiceB';
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });

    it('should handle transient depending on singleton using getters', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtainInstance(ServiceA); // Transient
        }

        getName() {
          return 'ServiceB';
        }
      }

      const serviceA = obtainInstance(ServiceA);
      expect(serviceA.getValue()).toBe('ServiceB');
    });
  });



  // REAL-WORLD SCENARIOS
  describe('Real-World Scenarios', () => {

    it('should handle user service <-> auth service pattern', () => {
      @Register()
      class AuthService {
        private get userService() {
          return obtain(UserService);
        }

        login(username: string) {
          const user = this.userService.findByUsername(username);
          return { token: 'abc123', user };
        }
      }

      @Register()
      class UserService {
        private get authService() {
          return obtain(AuthService);
        }

        findByUsername(username: string) {
          return { id: 1, username };
        }

        getCurrentUser() {
          return this.findByUsername('current');
        }
      }

      const authService = obtain(AuthService);
      const result = authService.login('john');

      expect(result.user.username).toBe('john');
      expect(result.token).toBe('abc123');
    });

    it('should handle parent <-> child service pattern', () => {
      @Register()
      class ParentService {
        public name = 'Parent';

        private get childService() {
          return obtain(ChildService);
        }

        delegateToChild() {
          return this.childService.doWork();
        }

        getName() {
          return this.name;
        }
      }

      @Register()
      class ChildService {
        private get parentService() {
          return obtain(ParentService);
        }

        doWork() {
          return 'work done by ' + this.parentService.getName();
        }
      }

      const parent = obtain(ParentService);
      expect(parent.delegateToChild()).toBe('work done by Parent');
    });

    it('should handle deeply nested circular dependencies', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        getValue() {
          return this.serviceB.getValue() + 'A';
        }
      }

      @Register()
      class ServiceB {
        private get serviceC() {
          return obtain(ServiceC);
        }

        getValue() {
          return this.serviceC.getValue() + 'B';
        }
      }

      @Register()
      class ServiceC {
        private get serviceD() {
          return obtain(ServiceD);
        }

        getValue() {
          return this.serviceD.getValue() + 'C';
        }
      }

      @Register()
      class ServiceD {
        private get serviceA() {
          return obtain(ServiceA);
        }

        getValue() {
          return 'D';
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getValue()).toBe('DCBA');
    });

    it('should handle multiple circular paths to same service', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        private get serviceC() {
          return obtain(ServiceC);
        }

        getFromB() {
          return this.serviceB.getName();
        }

        getFromC() {
          return this.serviceC.getName();
        }
      }

      @Register()
      class ServiceB {
        private get serviceA() {
          return obtain(ServiceA);
        }

        getName() {
          return 'B';
        }
      }

      @Register()
      class ServiceC {
        private get serviceA() {
          return obtain(ServiceA);
        }

        getName() {
          return 'C';
        }
      }

      const serviceA = obtain(ServiceA);
      expect(serviceA.getFromB()).toBe('B');
      expect(serviceA.getFromC()).toBe('C');
    });
  });


  // ERROR HANDLING

  describe('Error Handling', () => {

    it('should throw clear error for field initializer circular dependency', () => {
      @Register()
      class ServiceA {
        private serviceB = obtain(ServiceB); // Field initializer

        getValue() {
          return this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private serviceA = obtain(ServiceA);


        getName() {
          return 'B';
        }
      }

      expect(() => obtain(ServiceA)).toThrow();
    });

    it('should throw error when accessing circular dependency in constructor', () => {
      @Register()
      class ServiceA {
        private get serviceB() {
          return obtain(ServiceB);
        }

        constructor() {
          // Accessing during construction
          this.serviceB.getName();
        }
      }

      @Register()
      class ServiceB {
        private serviceA = obtain(ServiceA);


        getName() {
          return 'B';
        }
      }

      expect(() => obtain(ServiceA)).toThrow(
        '[IocRaft] Circular dependency detected on: ServiceA'
      );
    });

    it('should allow non-circular field initializers', () => {
      @Register()
      class ServiceA {
        public value = 42; //  Non-circular field initializer
      }

      @Register()
      class ServiceB {
        private serviceA = obtain(ServiceA); //  Not circular

        getValue() {
          return this.serviceA.value;
        }
      }

      const serviceB = obtain(ServiceB);
      expect(serviceB.getValue()).toBe(42);
    });
  });
});