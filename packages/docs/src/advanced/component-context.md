# Component Context

iocraft provides mechanisms to share services between parent and child components through context.

## Sharing Services with Children

Use `exposeToContext()` to make a service available to child components:

```vue
<!-- ParentComponent.vue -->
<script setup>
import { obtain, exposeToContext } from 'iocraft';
import { DataService } from '../services/DataService';

// Create a service instance
const dataService = obtain(DataService);

// Expose it to child components
exposeToContext(dataService);

// You can also destructure and use in this component
const { data, loadData } = dataService;
</script>

<template>
  <div>
    <h2>Parent Component</h2>
    <p>Data loaded: {{ data.length }}</p>
    <button @click="loadData">Load Data</button>

    <!-- Child components will have access to the exposed service -->
    <ChildComponent />
  </div>
</template>
```

## Accessing Contextual Services

Use `obtainFromContext()` to get a service from the parent context:

```vue
<!-- ChildComponent.vue -->
<script setup>
import { obtainFromContext } from 'iocraft';
import { DataService } from '../services/DataService';

// Get the service from parent context
const dataService = obtainFromContext(DataService);

// Destructure with reactivity preserved
const { data, addItem } = dataService;
</script>

<template>
  <div class="child-component">
    <h3>Child Component</h3>
    <p>Items from parent service: {{ data.length }}</p>
    <button @click="addItem('Item from child')">Add Item from Child</button>
  </div>
</template>
```

## Context Limitations

- Context only flows from parent to child components
- Services exposed to context are not globally available
- Context is isolated to the component tree
- Multiple services can be exposed to the same context

## Use Cases

- Sharing state between related components
- Providing services to dynamic component trees
- Creating component-scoped services