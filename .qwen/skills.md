# iocraft Skills

This document outlines the specific skills and capabilities available when working with the iocraft project.

## Project Overview
iocraft is a lightweight dependency injection (DI) container for Vue 3 applications that uses the Composition API. It provides a way to manage services and their dependencies in a clean, organized manner.

## Core Concepts

### 1. Service Registration
- Use the `@Register()` decorator to mark classes as services
- Services are registered with unique tokens for identification
- Supports singleton and instance-per-request patterns

### 2. Service Retrieval Methods
- `obtain(Service)` - Gets a shared singleton instance with reactivity preserved when destructured
- `obtainRaw(Service)` - Gets a shared singleton instance without reactivity preservation
- `obtainInstance(Service)` - Creates a new instance each time with reactivity preserved
- `obtainRawInstance(Service)` - Creates a new instance each time without reactivity preservation
- `obtainFromContext(Service)` - Retrieves service from component context
- `exposeToContext(service)` - Shares service with child components

### 3. Lifecycle Hooks Support
- Services can implement Vue lifecycle hooks (onMounted, onUnmounted, etc.)
- Hooks work when using `obtainInstance()` or `obtainRawInstance()` inside components
- Supports all major Vue lifecycle methods

### 4. Plugin System
- Integrates with Vue apps via the `iocraft` plugin
- Supports router integration for navigation services
- Allows eager loading of services

### 5. Helper Utilities
- `Nav` service for router functionality
- `Store` higher-order function for creating state management base classes
- Circular dependency resolution using getters

## Architecture Components

### Core Modules
- `facade.ts` - Creates reactive facades for services
- `register.ts` - Implements the @Register decorator
- `obtainers.ts` - Contains all service retrieval functions
- `internals.ts` - Manages registry, metadata, and lifecycle binding
- `utils.ts` - Utility functions for service management
- `types.d.ts` - Type definitions

### Helper Modules
- `Nav.service.ts` - Navigation service for router integration
- `store.ts` - Reactive state management utility

## Best Practices
- Use `@Register()` to mark service classes
- Use `obtain()` for shared services across the app
- Use `obtainInstance()` for unique instances per component
- Destructure with `obtain()`/`obtainInstance()` to keep reactivity
- Use getters for circular dependencies (never field initialization)
- Implement OnUnRegister interface for cleanup when services are unregistered

## Common Patterns
- Service-to-service communication using getters
- Component context sharing with exposeToContext/obtainFromContext
- Lifecycle-aware services with Vue hooks
- Reactive state management with the Store utility
- Router integration with Nav service