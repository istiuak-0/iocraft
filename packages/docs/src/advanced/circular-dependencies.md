# Circular Dependencies

Handling circular dependencies between services is a common challenge in dependency injection systems. iocraft provides a clean solution using getters.

## The Problem

Direct circular dependencies cause runtime errors:

```typescript
// DON'T DO THIS - causes error
@Register()
export class UserService {
  authService = obtain(AuthService); // Circular dependency error
  
  getCurrentUser() {
    return this.authService.getToken();
  }
}

@Register()
export class AuthService {
  userService = obtain(UserService); // Circular dependency error
  
  login() {
    return this.userService.getCurrentUser();
  }
}
```

## The Solution: Use Getters

Instead of field initialization, use getters to defer resolution:

```typescript
@Register()
export class UserService {
  // Use getter to avoid circular dependency error
  private get authService() {
    return obtain(AuthService);
  }

  getCurrentUser() {
    return this.authService.getToken();
  }
}

@Register()
export class AuthService {
  private get userService() {
    return obtain(UserService);
  }

  login() {
    return this.userService.getCurrentUser();
  }
}
```

## Why Getters Work

- Getters are evaluated lazily when accessed
- This delays the dependency resolution until the property is actually used
- Prevents circular instantiation during service registration
- Maintains the proper dependency relationship

## Best Practices

- Always use getters for circular dependencies
- Never use field initialization for interdependent services
- Document circular dependencies in your code for clarity