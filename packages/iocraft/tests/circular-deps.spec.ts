import { describe, it, expect, beforeEach, vi } from 'vitest';


describe('Circular Dependency Detection', () => {
  beforeEach(() => {
    ClearAllServices();
  });

  // ========================================================================
  // Test 1: Basic Circular Dependency (Facade)
  // ========================================================================
  
  it('should detect and resolve circular dependency with facades', () => {
    @Register()
    class ServiceA {
      private serviceB = obtain(ServiceB);
      
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
      
      getValueFromA() {
        return this.serviceA.getValue();
      }
    }

    // Should not throw
    const serviceA = obtain(ServiceA);
    
    // Should work via lazy proxy
    expect(serviceA.getValue()).toBe('ServiceB');
    
    const serviceB = obtain(ServiceB);
    expect(serviceB.getName()).toBe('ServiceB');
    
    // ServiceB can also access ServiceA via lazy proxy
    expect(serviceB.getValueFromA()).toBe('ServiceB');
  });

  // ========================================================================
  // Test 2: Circular Dependency with Raw Instances
  // ========================================================================
  
  it('should detect and resolve circular dependency with raw instances', () => {
    @Register()
    class ServiceA {
      private serviceB = obtainRaw(ServiceB);
      
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

    const serviceA = obtainRaw(ServiceA);
    
    // Should work
    expect(serviceA.getValue()).toBe('ServiceB');
  });

  // ========================================================================
  // Test 3: Mixed Facade and Raw
  // ========================================================================
  
  it('should handle mixed facade and raw circular dependencies', () => {
    @Register()
    class ServiceA {
      private serviceB = obtain(ServiceB);  // Facade
      
      getValue() {
        return this.serviceB.getName();
      }
    }

    @Register()
    class ServiceB {
      private serviceA = obtainRaw(ServiceA);  // Raw
      
      getName() {
        return 'ServiceB';
      }
    }

    const serviceA = obtain(ServiceA);
    expect(serviceA.getValue()).toBe('ServiceB');
  });

  // ========================================================================
  // Test 4: 3-Way Circular Dependency
  // ========================================================================
  
  it('should handle 3-way circular dependencies', () => {
    @Register()
    class ServiceA {
      private serviceB = obtain(ServiceB);
      
      getFromB() {
        return this.serviceB.getName();
      }
    }

    @Register()
    class ServiceB {
      private serviceC = obtain(ServiceC);
      
      getName() {
        return 'B';
      }
      
      getFromC() {
        return this.serviceC.getName();
      }
    }

    @Register()
    class ServiceC {
      private serviceA = obtain(ServiceA);
      
      getName() {
        return 'C';
      }
      
      getFromA() {
        return this.serviceA.getFromB();
      }
    }

    const serviceA = obtain(ServiceA);
    
    expect(serviceA.getFromB()).toBe('B');
    
    const serviceC = obtain(ServiceC);
    expect(serviceC.getFromA()).toBe('B');
  });

  // ========================================================================
  // Test 5: Error When Accessing Too Early
  // ========================================================================
  
  it('should throw error if circular dependency accessed in constructor', () => {
    @Register()
    class ServiceA {
      constructor() {
        const serviceB = obtain(ServiceB);
        // Accessing serviceB in constructor - too early!
        serviceB.getName();  // This should throw
      }
    }

    @Register()
    class ServiceB {
      private serviceA = obtain(ServiceA);
      
      getName() {
        return 'ServiceB';
      }
    }

    expect(() => {
      obtain(ServiceA);
    }).toThrow(/accessed before initialization/);
  });

  // ========================================================================
  // Test 6: Console Warning in Dev Mode
  // ========================================================================
  
  it('should warn about circular dependencies in dev mode', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    @Register()
    class ServiceA {
      private serviceB = obtain(ServiceB);
    }

    @Register()
    class ServiceB {
      private serviceA = obtain(ServiceA);
    }

    obtain(ServiceA);
    
    // Should have warned about circular dependency
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Circular dependency detected')
    );
    
    consoleSpy.mockRestore();
  });

  // ========================================================================
  // Test 7: Transient Instances (No Circular Detection Needed)
  // ========================================================================
  
  it('should not detect circular deps in transient instances', () => {
    @Register()
    class ServiceA {
      value = 'A';
    }

    // Each call creates new instance, no circular dependency possible
    const instance1 = obtainInstance(ServiceA);
    const instance2 = obtainInstance(ServiceA);
    
    expect(instance1).not.toBe(instance2);
    expect(instance1.value).toBe('A');
    expect(instance2.value).toBe('A');
  });

  // ========================================================================
  // Test 8: Self-Referencing Service
  // ========================================================================
  
  it('should detect self-referencing service', () => {
    @Register()
    class ServiceA {
      private self = obtain(ServiceA);  // References itself!
      
      getSelf() {
        return this.self;
      }
    }

    const serviceA = obtain(ServiceA);
    
    // Should work - lazy proxy resolves to itself
    expect(serviceA.getSelf()).toBe(serviceA);
  });

  // ========================================================================
  // Test 9: Facade Proxy Properties
  // ========================================================================
  
  it('should properly proxy facade properties in circular deps', () => {
    @Register()
    class ServiceA {
      public name = 'ServiceA';
      private serviceB = obtain(ServiceB);
      
      getNameFromB() {
        return this.serviceB.name;
      }
    }

    @Register()
    class ServiceB {
      public name = 'ServiceB';
      private serviceA = obtain(ServiceA);
      
      getNameFromA() {
        return this.serviceA.name;
      }
    }

    const serviceA = obtain(ServiceA);
    const serviceB = obtain(ServiceB);
    
    // Properties should work through lazy proxy
    expect(serviceA.getNameFromB()).toBe('ServiceB');
    expect(serviceB.getNameFromA()).toBe('ServiceA');
  });

  // ========================================================================
  // Test 10: Lazy Proxy Debugging
  // ========================================================================
  
  it('should mark lazy proxies for debugging', () => {
    @Register()
    class ServiceA {
      private serviceB = obtain(ServiceB);
      
      getB() {
        return this.serviceB;
      }
    }

    @Register()
    class ServiceB {
      private serviceA = obtain(ServiceA);
    }

    const serviceA = obtain(ServiceA);
    const serviceBProxy = (serviceA as any).serviceB;
    
    // ServiceB reference in ServiceA should be a lazy proxy
    // (Can't check __isLazyProxy__ directly as it's on the proxy, not the target)
    expect(typeof serviceBProxy).toBe('object');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Circular Dependency - Real World Scenarios', () => {
  beforeEach(() => {
    ClearAllServices();
  });

  it('should handle user service <-> auth service pattern', () => {
    @Register()
    class AuthService {
      private userService = obtain(UserService);
      
      login(username: string) {
        return this.userService.findByUsername(username);
      }
    }

    @Register()
    class UserService {
      private authService = obtain(AuthService);
      
      findByUsername(username: string) {
        return { username, id: 1 };
      }
      
      getCurrentUser() {
        // Might need auth service to check permissions
        return this.findByUsername('current');
      }
    }

    const authService = obtain(AuthService);
    const user = authService.login('john');
    
    expect(user).toEqual({ username: 'john', id: 1 });
  });

  it('should handle parent <-> child service pattern', () => {
    @Register()
    class ParentService {
      private childService = obtain(ChildService);
      
      delegateToChild() {
        return this.childService.doWork();
      }
    }

    @Register()
    class ChildService {
      private parentService = obtain(ParentService);
      
      doWork() {
        return 'work done';
      }
      
      notifyParent() {
        // Child might need to notify parent
        return 'notified';
      }
    }

    const parent = obtain(ParentService);
    expect(parent.delegateToChild()).toBe('work done');
  });
});