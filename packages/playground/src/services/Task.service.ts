// services/Task.service.ts
import { Register } from "iocraft"
import { task } from "iocraft/common"

interface User {
  id: number
  name: string
  email: string
  username: string
}

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

@Register()
export class TaskService {

  users = task({
    fn: async () => {
      const res = await fetch('https://jsonplaceholder.typicode.com/users',)
      return await res.json() as User[]
    },
    onSuccess: (ctx) => {
      console.log('✅ Users loaded:', ctx.data.length)
    },
    onError: (ctx) => {
      console.error('❌ Failed to load users:', ctx.error.message)
    }
  })

  // Fetch single user by ID
  user = task({
    fn: async (id: number) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
      if (!res.ok) throw new Error(`User not found: ${id}`)
      return await res.json() as User
    },
    onSuccess: (ctx) => {
      const [id] = ctx.args
      console.log(`✅ User ${id} loaded:`, ctx.data.name)
    }
  })

  // Fetch posts for a user
  userPosts = task({
    fn: async (userId: number) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${userId}`)
      return await res.json() as Post[]
    }
  })


  createPost = task({
    fn: async (title: string, body: string, userId: number) => {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, userId })
      })
      return await res.json() as Post
    },
    onSuccess: (ctx) => {
      console.log('✅ Post created:', ctx.data.title)
    }
  })


  deletePost = task({
    fn: async (postId: number, signal: AbortSignal) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
        method: 'DELETE',
        signal
      })
      return { deleted: true, postId }
    },
    onSuccess: (ctx) => {
      const [postId] = ctx.args
      console.log(`✅ Post ${postId} deleted`)
    }
  })


  searchUsers = task({
    fn: async (query: string) => {
     
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const res = await fetch('https://jsonplaceholder.typicode.com/users')
      const users = await res.json() as User[]
      
      return users.filter(u => 
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase())
      )
    }
  })
}