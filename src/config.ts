/**
 * 应用配置
 */

export const config = {
  // ONES API 基础 URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://your-ones-instance.com',
  
  // 团队 ID
  teamId: import.meta.env.VITE_TEAM_ID || '',
  
  // GraphQL API 端点
  get graphqlEndpoint() {
    return `${this.apiBaseUrl}/project/api/project/team/${this.teamId}/items/graphql`
  },
  
  // 登录 API 端点
  get loginEndpoint() {
    return `${this.apiBaseUrl}/project/api/project/auth/login`
  },
}
