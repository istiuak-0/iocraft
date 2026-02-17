<script setup lang="ts">
import { ref } from 'vue'
import { obtain } from 'iocraft'
import { TaskService } from '../services/Task.service'

const { createPost } = obtain(TaskService)

const title = ref('')
const body = ref('')
const userId = ref(1)

async function handleSubmit() {
  if (!title.value || !body.value) {
    alert('Please fill in all fields')
    return
  }

  try {
    await createPost.run(title.value, body.value, userId.value)
    // Reset form on success
    title.value = ''
    body.value = ''
    alert('Post created successfully!')
  } catch (err) {
    // Error handling done by task
    console.error('Create failed:', err)
  }
}

function resetForm() {
  title.value = ''
  body.value = ''
  createPost.clear()
}
</script>

<template>
  <div class="form-container">
    <h2>Create New Post</h2>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="userId">User ID</label>
        <input 
          id="userId"
          v-model.number="userId" 
          type="number" 
          min="1"
          :disabled="createPost.isLoading.value"
        />
      </div>

      <div class="form-group">
        <label for="title">Title</label>
        <input 
          id="title"
          v-model="title" 
          type="text" 
          placeholder="Enter post title"
          :disabled="createPost.isLoading.value"
        />
      </div>

      <div class="form-group">
        <label for="body">Body</label>
        <textarea 
          id="body"
          v-model="body" 
          rows="5"
          placeholder="Enter post content"
          :disabled="createPost.isLoading.value"
        ></textarea>
      </div>

      <!-- Error Display -->
      <div v-if="createPost.isError.value" class="error-message">
        ❌ {{ createPost.error.value?.message }}
      </div>

      <!-- Success Display -->
      <div v-if="createPost.isSuccess.value" class="success-message">
        ✅ Post created: "{{ createPost.data.value?.title }}"
      </div>

      <div class="form-actions">
        <button 
          type="submit" 
          :disabled="createPost.isLoading.value"
          class="btn-primary"
        >
          <span v-if="createPost.isLoading.value">Creating...</span>
          <span v-else>Create Post</span>
        </button>
        
        <button 
          type="button" 
          @click="resetForm"
          :disabled="createPost.isLoading.value"
          class="btn-secondary"
        >
          Reset
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input:disabled, textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover:not(:disabled) {
  background: #d5dbdb;
}

.error-message {
  padding: 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin: 15px 0;
}

.success-message {
  padding: 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  margin: 15px 0;
}
</style>