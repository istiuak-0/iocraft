<script setup lang="ts">
import { onMounted } from 'vue'
import { obtain } from 'iocraft'
import { TaskService } from '../services/Task.service'

const { users } = obtain(TaskService)

// Load data on mount
onMounted(() => {
  users.run()
})
</script>

<template>
  <div class="card">
    <h2>Users List</h2>
    
    <!-- Loading State -->
    <div v-if="users.isLoading.value" class="loading">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="users.isError.value" class="error">
      <p>❌ Error: {{ users.error.value?.message }}</p>
      <button @click="users.run()">Retry</button>
    </div>
    
    <!-- Success State -->
    <div v-else-if="users.isSuccess.value" class="success">
      <pre>{{ users.data.value }}</pre>
      <button @click="users.run()">Refresh</button>
    </div>
    
    <!-- Idle State -->
    <div v-else>
      <p>No data loaded yet</p>
      <button @click="users.run()">Load Users</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
  padding: 20px;
  background: #ffebee;
  border-radius: 4px;
}

.success {
  color: #27ae60;
}

button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background: #2980b9;
}
</style>