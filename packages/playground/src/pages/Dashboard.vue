<script setup lang="ts">
import { ref } from 'vue'
import Search from './Search.vue';
import Post from './Post.vue';
import User from './User.vue';
import Task from './Task.vue';

const activeTab = ref<'list' | 'profile' | 'create' | 'search'>('list')
const selectedUserId = ref(1)
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Task Service Demo</h1>
      <p>Comprehensive examples of task-based state management</p>
    </header>

    <nav class="tabs">
      <button 
        @click="activeTab = 'list'" 
        :class="{ active: activeTab === 'list' }"
      >
        📋 Users List
      </button>
      <button 
        @click="activeTab = 'profile'" 
        :class="{ active: activeTab === 'profile' }"
      >
        👤 User Profile
      </button>
      <button 
        @click="activeTab = 'create'" 
        :class="{ active: activeTab === 'create' }"
      >
        ✍️ Create Post
      </button>
      <button 
        @click="activeTab = 'search'" 
        :class="{ active: activeTab === 'search' }"
      >
        🔍 Search
      </button>
    </nav>

    <main class="dashboard-content">
      <Task v-if="activeTab === 'list'" />
      <User v-else-if="activeTab === 'profile'" :user-id="selectedUserId" />
      <Post v-else-if="activeTab === 'create'" />
      <Search v-else-if="activeTab === 'search'" />
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.dashboard-header h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
}

.dashboard-header p {
  margin: 0;
  opacity: 0.9;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.tabs button {
  padding: 12px 24px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tabs button:hover {
  background: #e0e0e0;
}

.tabs button.active {
  background: #3498db;
  color: white;
}

.dashboard-content {
  padding: 20px;
}
</style>