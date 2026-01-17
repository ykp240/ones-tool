/**
 * GraphQL 客户端使用示例
 * 
 * 这个文件展示了如何使用 GraphQLClient
 */

import { graphqlClient } from './graphqlClient'

/**
 * 示例 1: 设置认证信息
 */
export function exampleSetAuth() {
  const userId = 'user-uuid-123'
  const authToken = 'auth-token-456'
  
  // 设置认证信息
  graphqlClient.setAuth(userId, authToken)
  
  console.log('认证信息已设置')
}

/**
 * 示例 2: 执行 GraphQL 查询
 */
export async function exampleQuery() {
  // 定义查询
  const query = `
    query GetTasks($userId: String!) {
      tasks(filter: { assign_in: [$userId] }) {
        uuid
        name
        status
      }
    }
  `
  
  // 执行查询
  const result = await graphqlClient.query<{
    tasks: Array<{
      uuid: string
      name: string
      status: string
    }>
  }>(query, { userId: 'user-uuid-123' })
  
  console.log('查询结果:', result)
  return result
}

/**
 * 示例 3: 执行 GraphQL 变更
 */
export async function exampleMutation() {
  // 定义变更
  const mutation = `
    mutation UpdateTaskStatus($taskId: String!, $status: String!) {
      updateTask(uuid: $taskId, status: $status) {
        uuid
        status
      }
    }
  `
  
  // 执行变更
  const result = await graphqlClient.mutate<{
    updateTask: {
      uuid: string
      status: string
    }
  }>(mutation, {
    taskId: 'task-uuid-789',
    status: 'in_progress'
  })
  
  console.log('变更结果:', result)
  return result
}

/**
 * 示例 4: 清除认证信息
 */
export function exampleClearAuth() {
  // 清除认证信息
  graphqlClient.clearAuth()
  
  console.log('认证信息已清除')
}

/**
 * 示例 5: 完整的使用流程
 */
export async function exampleFullFlow() {
  try {
    // 1. 设置认证信息
    graphqlClient.setAuth('user-uuid-123', 'auth-token-456')
    
    // 2. 执行查询
    const tasks = await exampleQuery()
    console.log('获取到任务:', tasks)
    
    // 3. 执行变更
    const updatedTask = await exampleMutation()
    console.log('更新任务:', updatedTask)
    
    // 4. 登出时清除认证信息
    graphqlClient.clearAuth()
    
  } catch (error) {
    console.error('操作失败:', error)
  }
}
