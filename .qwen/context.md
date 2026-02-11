# iocraft Project Context

## Project Information
- **Name**: iocraft
- **Description**: A lightweight dependency injection container for Vue 3
- **Version**: 0.2.5
- **Status**: Beta
- **Repository**: https://github.com/istiuak-0/iocraft

## Project Structure
```
iocraft/
├── .gitignore
├── package.json (monorepo root)
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
├── release-please-config.json
├── tsconfig.base.json
├── packages/
│   ├── docs/ (documentation site)
│   ├── iocraft/ (main library)
│   │   ├── src/
│   │   │   ├── core/ (core DI functionality)
│   │   │   ├── helpers/ (helper utilities)
│   │   │   ├── core.ts (main exports)
│   │   │   └── helpers.ts (helper exports)
│   │   ├── tests/ (unit tests)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts (build configuration)
│   │   └── vitest.config.ts (test configuration)
│   └── playground/ (development playground)
└── .qwen/ (Qwen Code configuration)
```

## Core Architecture

### 1. Core Modules
- **facade.ts**: Creates reactive facades for services that preserve reactivity when destructured
- **register.ts**: Implements the @Register decorator for service registration
- **obtainers.ts**: Contains all service retrieval functions (obtain, obtainRaw, obtainInstance, etc.)
- **internals.ts**: Manages the RootRegistry, creation stack for circular dependency detection, and lifecycle hook binding
- **utils.ts**: Utility functions for service metadata management
- **types.d.ts**: TypeScript type definitions

### 2. Helper Modules
- **Nav.service.ts**: Provides navigation service that integrates with Vue Router
- **store.ts**: Implements a Store higher-order function that creates base classes with common state management methods

### 3. Key Concepts
- **Dependency Injection**: Services are registered with @Register() and retrieved using obtain functions
- **Reactive Facades**: Services can be destructured while maintaining reactivity
- **Lifecycle Hooks**: Services can implement Vue lifecycle hooks
- **Context Sharing**: Services can be shared between parent and child components
- **Circular Dependency Resolution**: Uses getters to avoid circular dependency issues

## API Reference

### Decorators
- `@Register()`: Marks a class as a service

### Service Retrieval Functions
- `obtain(ServiceClass)`: Gets a shared singleton instance with reactivity preserved when destructured
- `obtainRaw(ServiceClass)`: Gets a shared singleton instance without reactivity preservation
- `obtainInstance(ServiceClass)`: Creates a new instance each time with reactivity preserved
- `obtainRawInstance(ServiceClass)`: Creates a new instance each time without reactivity preservation
- `obtainFromContext(ServiceClass)`: Gets service from current component context
- `exposeToContext(serviceInstance)`: Shares a service with child components

### Utility Functions
- `hasService(ServiceClass)`: Checks if a service exists in the registry
- `unRegister(serviceInstance)`: Removes a service from the registry
- `clearRegistry()`: Clears all services from the registry

### Interfaces
- `OnUnRegister`: Interface for implementing cleanup when a service is unregistered
- Vue lifecycle interfaces: `OnMounted`, `OnUnmounted`, `OnUpdated`, etc.

## Build System
- **Package Manager**: pnpm
- **Build Tool**: tsup
- **Language**: TypeScript
- **Target**: ES2024
- **Formats**: ESM and CJS
- **Peer Dependencies**: Vue 3, Vue Router 4

## Development Scripts
- `pnpm iocraft:build`: Builds the iocraft package
- `pnpm iocraft:dev`: Starts development watcher for iocraft
- `pnpm iocraft:test`: Runs unit tests
- `pnpm iocraft:bench`: Runs benchmarks
- `pnpm playground:dev`: Starts the development playground
- `pnpm docs:dev`: Starts documentation site development server

## Testing
- **Testing Framework**: Vitest
- **Test Location**: `packages/iocraft/tests/`

## Key Files to Understand
1. `packages/iocraft/src/core/obtainers.ts` - Main service retrieval logic
2. `packages/iocraft/src/core/facade.ts` - Reactive facade creation
3. `packages/iocraft/src/core/internals.ts` - Registry and lifecycle management
4. `packages/iocraft/src/helpers/store.ts` - State management utility
5. `packages/iocraft/src/helpers/Nav.service.ts` - Router integration

## Common Use Cases
1. Creating services with business logic
2. Managing application state with Store higher-order function base classes
3. Handling component lifecycle with service hooks
4. Sharing services between parent and child components
5. Integrating with Vue Router for navigation
6. Resolving circular dependencies between services

## Best Practices
- Always use `@Register()` to mark service classes
- Use `obtain()` for singleton services shared across the app
- Use `obtainInstance()` when you need a new instance per component
- Destructure services with `obtain()`/`obtainInstance()` to maintain reactivity
- Use getters instead of field initialization for circular dependencies
- Implement `OnUnRegister` interface for cleanup when services are unregistered
- Use `exposeToContext()` and `obtainFromContext()` for parent-child component communication
- Use the Store higher-order function to create base classes with common state management methods