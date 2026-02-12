# iocraft Project Context

## Project Overview

iocraft is a lightweight dependency injection (DI) container for Vue 3 that leverages the Composition API. It's designed to provide a simple and intuitive way to manage services and dependencies in Vue applications. The project is currently in beta and uses TypeScript for type safety.

The project follows a monorepo structure using pnpm workspaces with three main packages:
- `iocraft`: The core dependency injection library
- `playground`: A demo application showcasing library usage
- `docs`: Documentation website

## Architecture & Key Components

### Core Features
- **Decorator-based service registration** (`@Register()`)
- **Four service retrieval methods**:
  - `obtain(Service)` - Shared singleton instance with reactivity preservation
  - `obtainRaw(Service)` - Shared singleton without reactivity preservation
  - `obtainInstance(Service)` - New instance each time with reactivity preservation
  - `obtainRawInstance(Service)` - New instance each time without reactivity preservation
- **Vue lifecycle hook integration** for services
- **Component context sharing** (`exposeToContext`, `obtainFromContext`)
- **Circular dependency handling** via getters
- **Router integration** through the `Nav` helper service

### Core Implementation
The library is organized into:
- `src/core/` - Main DI container logic (registration, obtaining, plugin system)
- `src/helpers/` - Additional utilities like the Nav service for router integration
- Internal mechanisms using Symbols for metadata storage and registry management

### Build System
- Uses **tsup** for bundling (ESM/CJS formats)
- **TypeScript** for type checking
- **Vitest** for testing
- **pnpm** for monorepo management

## Building and Running

### Development Commands
```bash
# Install dependencies for all packages
pnpm i:all

# Build the main iocraft package
pnpm iocraft:build

# Run development mode for iocraft
pnpm iocraft:dev

# Run the playground demo
pnpm playground:dev

# Run tests
pnpm iocraft:test

# Run benchmarks
pnpm iocraft:bench

# Run documentation site
pnpm docs:dev
```

### Package Structure
- `packages/iocraft` - Main library source code
- `packages/playground` - Interactive demo application
- `packages/docs` - Documentation site
- `src/core/` - Core DI functionality
- `src/helpers/` - Helper services like Nav
- `tests/` - Unit tests and benchmarks

## Development Conventions

### TypeScript Usage
- Full TypeScript support with strict typing
- Export types alongside implementations
- Use interfaces for defining contracts (e.g., Nav interface)

### Service Registration Pattern
- Use `@Register()` decorator to mark classes as injectable services
- Services can implement Vue lifecycle hooks
- Support for cleanup via `OnUnRegister` interface

### Reactivity Handling
- Special attention to preserving Vue reactivity when destructuring services
- Different obtain methods for different reactivity needs
- Facade objects that maintain reactivity while allowing destructuring

### Testing Approach
- Unit tests using Vitest
- Benchmark tests for performance measurement
- Environment-specific configurations for development/testing

### Code Organization
- Modular architecture with clear separation of concerns
- Core functionality separated from helper utilities
- Internal constants and metadata management using Symbols
- Lifecycle hook binding mechanism for Vue integration

## Key Files and Directories
- `packages/iocraft/src/core.ts` - Main exports and facade creation
- `packages/iocraft/src/core/register.ts` - Service registration decorator
- `packages/iocraft/src/core/internals.ts` - Internal constants and registry
- `packages/iocraft/src/helpers/nav.ts` - Navigation helper service
- `packages/iocraft/tsup.config.ts` - Build configuration
- `pnpm-workspace.yaml` - Monorepo workspace definition
- `README.md` - Comprehensive usage documentation

## Best Practices Observed
- Clear separation between reactive and non-reactive service access patterns
- Proper handling of circular dependencies using getter functions
- Component context sharing for parent-child service communication
- Lifecycle-aware services that integrate with Vue's component lifecycle
- Type-safe API design with proper TypeScript generics
- Comprehensive documentation with examples for all major features