# Getting Started

This guide will help you get started with iocraft in your Vue 3 application.

## Prerequisites

- Vue 3.x
- Node.js >= 18.0.0
- Basic understanding of Vue Composition API

## Installation

Install iocraft using your preferred package manager:

```bash
npm install iocraft
```

## Basic Usage

### 1. Create a Service

Create a service class and decorate it with `@Register()`:

```typescript
import { Register } from 'iocraft';

@Register()
export class UserService {
  users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ];

  getUsers() {
    return this.users;
  }

  addUser(name: string) {
    const newUser = { id: this.users.length + 1, name };
    this.users.push(newUser);
    return newUser;
  }
}
```

### 2. Use in Components

Get your service in any component:

```vue
<script setup>
import { onMounted } from 'vue';
import { obtain } from 'iocraft';
import { UserService } from './services/UserService';

// Get the service instance
const userService = obtain(UserService);

// Destructure with reactivity preserved
const { users, addUser } = userService;

onMounted(() => {
  console.log(users); // Works!
});
</script>

<template>
  <div>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    <button @click="addUser('New User')">Add User</button>
  </div>
</template>
```

That's it! You now have a working service that can be injected into any component.