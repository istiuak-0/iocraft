import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Type definitions


// UNIT TESTS
describe('addStaticProperties - Unit Tests', () => {


  describe('Static Methods', () => {

    it('should copy static methods to target object', () => {
      class TestService {
        static greet(name: string) {
          return `Hello, ${name}`;
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(typeof target.greet).toBe('function');
      expect((target.greet as Function)('World')).toBe('Hello, World');
    });


    it('should bind static methods to the original class', () => {
      class TestService {
        static value = 42;
        static getValue() {
          return this.value;
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect((target.getValue as Function)()).toBe(42);
      
      // Modify original class value
      TestService.value = 100;
      expect((target.getValue as Function)()).toBe(100);
    });


    it('should preserve method context when calling bound functions', () => {
      class TestService {
        static name = 'TestService';
        static getName() {
          return this.name;
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      const boundMethod = target.getName as Function;
      expect(boundMethod()).toBe('TestService');
    });

  });

  describe('Static Getters and Setters', () => {
    it('should copy static getters', () => {
      class TestService {
        static _value = 10;
        static get value() {
          return this._value * 2;
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(target.value).toBe(20);
    });

    it('should copy static setters', () => {
      class TestService {
        static _value = 10;
        static get value() {
          return this._value;
        }
        static set value(val: number) {
          this._value = val;
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      target.value = 50;
      expect(TestService._value).toBe(50);
      expect(target.value).toBe(50);
    });

    it('should handle getter-only properties', () => {
      class TestService {
        static get timestamp() {
          return Date.now();
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(typeof target.timestamp).toBe('number');
      expect(target.timestamp).toBeGreaterThan(0);
    });

    it('should handle setter-only properties', () => {
      class TestService {
        static _logs: string[] = [];
        static set log(message: string) {
          this._logs.push(message);
        }
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      target.log = 'test message';
      expect(TestService._logs).toContain('test message');
    });
  });

  describe('Static Properties (data properties)', () => {
    it('should copy static data properties with getter/setter', () => {
      class TestService {
        static apiKey = 'secret-key-123';
        static version = 1.0;
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(target.apiKey).toBe('secret-key-123');
      expect(target.version).toBe(1.0);
    });

    it('should create reactive getter/setter for data properties', () => {
      class TestService {
        static counter = 0;
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(target.counter).toBe(0);
      
      // Modify through target
      target.counter = 5;
      expect(TestService.counter).toBe(5);
      expect(target.counter).toBe(5);
    });

    it('should handle complex data types', () => {
      class TestService {
        static config = { debug: true, timeout: 3000 };
        static handlers = [1, 2, 3];
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(target.config).toEqual({ debug: true, timeout: 3000 });
      expect(target.handlers).toEqual([1, 2, 3]);
    });
  });

  describe('Excluded Properties', () => {

    // it('should exclude "length" property', () => {
    //   class TestService {
    //     constructor(public value: number) {}
    //   }

    //   const target: Record<PropertyKey, unknown> = {};
    //   addStaticProperties(TestService, target);

    //   expect(target.length).toBeUndefined();
    // });

    it('should exclude "name" property', () => {
      class TestService {}

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(target.name).toBeUndefined();
    });

    it('should exclude "prototype" property', () => {
      class TestService {}

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      expect(target.prototype).toBeUndefined();
    });
  });



  describe('Property Descriptors', () => {
    it('should make copied properties enumerable', () => {
      class TestService {
        static method() {}
        static value = 42;
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      const keys = Object.keys(target);
      expect(keys).toContain('method');
      expect(keys).toContain('value');
    });

    it('should make copied properties configurable', () => {
      class TestService {
        static method() {}
      }

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(TestService, target);

      const descriptor = Object.getOwnPropertyDescriptor(target, 'method');
      expect(descriptor?.configurable).toBe(true);
    });
  });


  describe('Edge Cases', () => {

    it('should handle empty class', () => {
      class EmptyService {}

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(EmptyService, target);

      const userKeys = Object.keys(target);
      expect(userKeys.length).toBe(0);
    });

    it('should handle class with only built-in properties', () => {
      class BasicService {}

      const target: Record<PropertyKey, unknown> = {};
      addStaticProperties(BasicService, target);

      expect(Object.keys(target).length).toBe(0);
    });

    it('should handle target object with existing properties', () => {
      class TestService {
        static newProp = 'new';
      }

      const target: Record<PropertyKey, unknown> = { existingProp: 'existing' };
      addStaticProperties(TestService, target);

      expect(target.existingProp).toBe('existing');
      expect(target.newProp).toBe('new');
    });

    it('should overwrite existing properties in target', () => {
      class TestService {
        static prop = 'from class';
      }

      const target: Record<PropertyKey, unknown> = { prop: 'original' };
      addStaticProperties(TestService, target);

      expect(target.prop).toBe('from class');
    });
  });
});

// ===========================
// INTEGRATION TESTS
// ===========================
describe('addStaticProperties - Integration Tests', () => {
  it('should handle a service class with mixed property types', () => {
    class ComplexService {
      static apiUrl = 'https://api.example.com';
      static timeout = 5000;
      
      static _authenticated = false;
      static get isAuthenticated() {
        return this._authenticated;
      }
      static set isAuthenticated(value: boolean) {
        this._authenticated = value;
      }

      static login(username: string) {
        this._authenticated = true;
        return `${username} logged in`;
      }

      static logout() {
        this._authenticated = false;
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ComplexService, target);

    // Test data properties
    expect(target.apiUrl).toBe('https://api.example.com');
    expect(target.timeout).toBe(5000);

    // Test getter/setter
    expect(target.isAuthenticated).toBe(false);
    target.isAuthenticated = true;
    expect(target.isAuthenticated).toBe(true);
    expect(ComplexService.isAuthenticated).toBe(true);

    // Test methods
    const loginResult = (target.login as Function)('testuser');
    expect(loginResult).toBe('testuser logged in');
    expect(target.isAuthenticated).toBe(true);

    (target.logout as Function)();
    expect(target.isAuthenticated).toBe(false);
  });

  it('should maintain proper references across multiple operations', () => {
    class CounterService {
      static count = 0;
      static increment() {
        this.count++;
        return this.count;
      }
      static reset() {
        this.count = 0;
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(CounterService, target);

    expect((target.increment as Function)()).toBe(1);
    expect((target.increment as Function)()).toBe(2);
    expect(target.count).toBe(2);
    
    (target.reset as Function)();
    expect(target.count).toBe(0);
    expect(CounterService.count).toBe(0);
  });
});

// ===========================
// MOCKING TESTS
// ===========================
describe('addStaticProperties - Mocking Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work with mocked static methods', () => {
    class ApiService {
      static fetchData(url: string) {
        return fetch(url).then(r => r.json());
      }
    }

    // Mock the static method
    const mockFetchData = vi.fn().mockResolvedValue({ data: 'mocked' });
    ApiService.fetchData = mockFetchData;

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ApiService, target);

    const fetchDataFn = target.fetchData as Function;
    expect(typeof fetchDataFn).toBe('function');
    
    fetchDataFn('https://api.test.com');
    expect(mockFetchData).toHaveBeenCalledWith('https://api.test.com');
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  it('should handle spy on getter', () => {
    class ConfigService {
      static _env = 'production';
      static get environment() {
        return this._env;
      }
    }

    const getSpy = vi.spyOn(ConfigService, 'environment', 'get');

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ConfigService, target);

    const _ = target.environment;
    expect(getSpy).toHaveBeenCalled();
  });

  it('should handle spy on setter', () => {
    class ConfigService {
      static _env = 'production';
      static get environment() {
        return this._env;
      }
      static set environment(val: string) {
        this._env = val;
      }
    }

    const setSpy = vi.spyOn(ConfigService, 'environment', 'set');

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ConfigService, target);

    target.environment = 'development';
    expect(setSpy).toHaveBeenCalledWith('development');
  });

  it('should work with mocked Object.getOwnPropertyNames', () => {
    class TestService {
      static method1() {}
      static method2() {}
    }

    const originalGetOwnPropertyNames = Object.getOwnPropertyNames;
    const spy = vi.spyOn(Object, 'getOwnPropertyNames').mockReturnValue(
      originalGetOwnPropertyNames(TestService)
    );

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(TestService, target);

    expect(spy).toHaveBeenCalledWith(TestService);
    expect(target.method1).toBeDefined();
    expect(target.method2).toBeDefined();
  });

  it('should work with mocked Object.defineProperty', () => {
    class TestService {
      static value = 100;
    }

    const definePropSpy = vi.spyOn(Object, 'defineProperty');

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(TestService, target);

    expect(definePropSpy).toHaveBeenCalledWith(
      target,
      'value',
      expect.objectContaining({
        enumerable: true,
        configurable: true,
      })
    );
  });
});

// ===========================
// TYPE TESTING
// ===========================
describe('addStaticProperties - Type Tests', () => {
  it('should maintain type safety for ServiceConstructor', () => {
    interface IService {
      execute(): void;
    }

    class TestService implements IService {
      static config = { enabled: true };
      execute() {}
    }

    const target: Record<PropertyKey, unknown> = {};
    
    // This should compile without errors
    const serviceClass: ServiceConstructor<IService> = TestService;
    addStaticProperties(serviceClass, target);

    expect(target.config).toBeDefined();
  });

  it('should handle generic class types', () => {
    class GenericService<T> {
      static defaultValue: any = null;
      static create<U>(value: U): U {
        return value;
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(GenericService, target);

    expect(target.defaultValue).toBeNull();
    expect(typeof target.create).toBe('function');
  });

  it('should work with abstract classes', () => {
    abstract class AbstractService {
      static serviceName = 'AbstractService';
      static getInfo() {
        return this.serviceName;
      }
      abstract execute(): void;
    }

    class ConcreteService extends AbstractService {
      execute() {}
      constructor(){
        super()
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ConcreteService as any, target);

    expect(target.serviceName).toBe('AbstractService');
  });

  it('should handle classes with Symbol properties', () => {
    const customSymbol = Symbol('custom');
    
    class SymbolService {
      static regularProp = 'regular';
      static [customSymbol] = 'symbol value';
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(SymbolService, target);

    // Symbol properties are not returned by getOwnPropertyNames
    expect(target.regularProp).toBe('regular');
    expect(target[customSymbol]).toBeUndefined();
  });
});

// ===========================
// PERFORMANCE TESTS
// ===========================
describe('addStaticProperties - Performance Tests', () => {
  it('should handle classes with many static properties efficiently', () => {
    class LargeService {
      static prop1 = 1;
      static prop2 = 2;
      static prop3 = 3;
      static prop4 = 4;
      static prop5 = 5;
      static method1() {}
      static method2() {}
      static method3() {}
      static method4() {}
      static method5() {}
    }

    const target: Record<PropertyKey, unknown> = {};
    const startTime = performance.now();
    
    addStaticProperties(LargeService, target);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    expect(Object.keys(target).length).toBe(10);
    expect(executionTime).toBeLessThan(10); // Should complete in less than 10ms
  });
});

// ===========================
// ERROR HANDLING TESTS
// ===========================
describe('addStaticProperties - Error Handling', () => {
  it('should handle properties that throw on access', () => {
    class ErrorService {
      static get throwingGetter() {
        throw new Error('Cannot access this property');
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ErrorService, target);

    expect(() => target.throwingGetter).toThrow('Cannot access this property');
  });

  it('should handle setters that throw errors', () => {
    class ErrorService {
      static set throwingSetter(value: any) {
        throw new Error('Cannot set this property');
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(ErrorService, target);

    expect(() => { target.throwingSetter = 'test'; }).toThrow('Cannot set this property');
  });
});

// ===========================
// SNAPSHOT TESTS
// ===========================
describe('addStaticProperties - Snapshot Tests', () => {
  it('should match snapshot for typical service class', () => {
    class SnapshotService {
      static apiVersion = '1.0.0';
      static timeout = 3000;
      static get baseUrl() {
        return 'https://api.example.com';
      }
      static request(endpoint: string) {
        return `Requesting ${endpoint}`;
      }
    }

    const target: Record<PropertyKey, unknown> = {};
    addStaticProperties(SnapshotService, target);

    const snapshot = {
      keys: Object.keys(target).sort(),
      apiVersion: target.apiVersion,
      timeout: target.timeout,
      baseUrl: target.baseUrl,
      requestResult: (target.request as Function)('/users'),
    };

    expect(snapshot).toMatchInlineSnapshot(`
      {
        "apiVersion": "1.0.0",
        "baseUrl": "https://api.example.com",
        "keys": [
          "apiVersion",
          "baseUrl",
          "request",
          "timeout",
        ],
        "requestResult": "Requesting /users",
        "timeout": 3000,
      }
    `);
  });
});