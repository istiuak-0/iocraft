<script setup lang="ts">
import { ref, watch } from 'vue'
import { obtain } from 'iocraft'
import { TaskService } from '../services/Task.service'

const { searchUsers } = obtain(TaskService)

const query = ref('')

// Watch query and trigger debounced search
watch(query, (newQuery) => {
  // Cancel previous search
  searchUsers.stop()
   searchUsers.run(newQuery)
})

function clearSearch() {
  query.value = ''
  searchUsers.clear()
}
</script>

<template>
  <div class="search-container">
    <h2>Search Users</h2>
    
    <div class="search-box">
      <input 
        v-model="query" 
        type="text" 
        placeholder="Search by name or email..."
        class="search-input"
      />
      <button 
        v-if="query" 
        @click="clearSearch"
        class="clear-btn"
      >
        ✕
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="searchUsers.isLoading.value" class="loading">
      <div class="spinner"></div>
      <p>Searching...</p>
    </div>

    <!-- Results -->
    <div v-else-if="searchUsers.isSuccess.value" class="results">
      <p class="results-count">
        Found {{ searchUsers.data.value?.length }} user(s)
      </p>
      
      <div v-if="searchUsers.data.value?.length === 0" class="no-results">
        No users found for "{{ query }}"
      </div>

      <div v-else class="user-list">
        <div 
          v-for="user in searchUsers.data.value" 
          :key="user.id"
          class="user-item"
        >
          <div class="user-avatar">{{ user.name[0] }}</div>
          <div class="user-info">
            <h4>{{ user.name }}</h4>
            <p>{{ user.email }}</p>
            <span class="username">@{{ user.username }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="searchUsers.isError.value" class="error">
      Error: {{ searchUsers.error.value?.message }}
    </div>

    <!-- Idle State -->
    <div v-else-if="query.length < 2" class="hint">
      Type at least 2 characters to search
    </div>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
}

.search-box {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 12px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #e0e0e0;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin: 0 auto 10px;
}

.results-count {
  color: #666;
  margin-bottom: 15px;
}

.user-list {
  display: grid;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.user-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.user-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.user-info p {
  margin: 0 0 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.username {
  color: #95a5a6;
  font-size: 12px;
}

.no-results, .hint {
  text-align: center;
  padding: 40px;
  color: #95a5a6;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>