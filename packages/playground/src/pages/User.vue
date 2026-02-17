<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { obtain } from 'iocraft'
import { TaskService } from '../services/Task.service'

const props = defineProps<{
  userId: number
}>()

const { user, userPosts } = obtain(TaskService)

onMounted(() => {
  loadUserData()
})

async function loadUserData() {
  try {
    // Load user first
    await user.run(props.userId)
    // Then load their posts
    userPosts.run(props.userId)
  } catch (err) {
    console.error('Failed to load user data')
  }
}

function refresh() {
  user.clear()
  userPosts.clear()
  loadUserData()
}
</script>

<template>
  <div class="profile">
    <div class="header">
      <h2>User Profile</h2>
      <button @click="refresh" :disabled="user.isLoading.value">
        🔄 Refresh
      </button>
    </div>

    <!-- User Info -->
    <div v-if="user.isLoading.value" class="skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>

    <div v-else-if="user.isError.value" class="error">
      <p>Failed to load user: {{ user.error.value?.message }}</p>
      <button @click="user.run(userId)">Retry</button>
    </div>

    <div v-else-if="user.isSuccess.value" class="user-card">
      <h3>{{ user.data.value?.name }}</h3>
      <p>📧 {{ user.data.value?.email }}</p>
      <p>👤 @{{ user.data.value?.username }}</p>
    </div>

    <!-- User Posts -->
    <div class="posts-section">
      <h3>Posts</h3>
      
      <div v-if="userPosts.isLoading.value" class="loading">
        Loading posts...
      </div>

      <div v-else-if="userPosts.isSuccess.value">
        <div v-if="userPosts.data.value?.length === 0">
          No posts yet
        </div>
        <div v-else class="posts-list">
          <div 
            v-for="post in userPosts.data.value" 
            :key="post.id" 
            class="post-card"
          >
            <h4>{{ post.title }}</h4>
            <p>{{ post.body }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.user-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.posts-section {
  margin-top: 30px;
}

.posts-list {
  display: grid;
  gap: 15px;
}

.post-card {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 6px;
}

.post-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.skeleton {
  padding: 20px;
}

.skeleton-line {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 10px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>