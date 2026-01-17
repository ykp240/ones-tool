# Task 16.1 Implementation Summary: 会话过期检测

## Overview
Implemented session expiration detection that monitors 401 errors, prompts users to re-login, and preserves current page state.

## Requirements Addressed
- **需求 1.5**: 用户会话过期或失效时提示用户重新登录
- **需求 8.5**: 会话过期时提示用户重新登录而不丢失当前页面状态
- **需求 8.6**: API 返回 401 未授权错误时清除本地认证信息并引导用户重新登录

## Implementation Details

### 1. GraphQL Client (src/services/graphqlClient.ts)
**Changes:**
- Enhanced `handleError()` method to detect 401 errors
- Dispatches `auth:expired` custom event when 401 is detected
- Clears authentication info from the client

**Code:**
```typescript
if (response.status === 401) {
  // 会话过期，清除认证信息
  this.clearAuth()
  
  // 触发会话过期事件（可以被其他模块监听）
  // 需求 1.5, 8.5: 提示用户重新登录并保留当前页面状态
  window.dispatchEvent(new CustomEvent('auth:expired'))
}
```

### 2. Auth Service (src/services/authService.ts)
**Changes:**
- Updated `initialize()` method to listen for `auth:expired` events
- Calls `logout()` to clear local authentication info
- Uses `errorHandler.getAuthHandler().redirectToLogin(true)` to redirect with state preservation

**Code:**
```typescript
window.addEventListener('auth:expired', () => {
  // 清除本地认证信息
  this.logout()
  
  // 使用错误处理器重定向到登录页，并保留当前页面状态
  // 需求 8.5: 保留当前页面状态
  errorHandler.getAuthHandler().redirectToLogin(true)
})
```

### 3. Auth Context (src/contexts/AuthContext.tsx)
**Changes:**
- Added new `useEffect` hook to listen for `auth:expired` events
- Updates UI state when session expires
- Sets error message to inform user

**Code:**
```typescript
useEffect(() => {
  const handleSessionExpired = () => {
    // 清除用户状态
    setUser(null)
    setError('登录已过期，请重新登录')
  }

  window.addEventListener('auth:expired', handleSessionExpired)

  return () => {
    window.removeEventListener('auth:expired', handleSessionExpired)
  }
}, [])
```

### 4. Login Page (src/pages/LoginPage.tsx)
**Changes:**
- Added `useNavigate` hook for programmatic navigation
- Added `useEffect` hook to handle redirect after successful login
- Checks `sessionStorage` for saved redirect path
- Restores user to their previous page after re-login

**Code:**
```typescript
useEffect(() => {
  if (isAuthenticated) {
    // 检查是否有保存的重定向路径
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    
    if (redirectPath) {
      // 清除保存的路径
      sessionStorage.removeItem('redirectAfterLogin')
      // 重定向到保存的页面
      navigate(redirectPath, { replace: true })
    } else {
      // 默认重定向到主页
      navigate('/', { replace: true })
    }
  }
}, [isAuthenticated, navigate])
```

### 5. Error Handler (src/services/errorHandler.ts)
**Existing Implementation Used:**
- `AuthErrorHandler.redirectToLogin(preserveState: boolean)` method
- Saves current path to `sessionStorage` when `preserveState` is true
- Redirects to `/login` page

**Code (already existed):**
```typescript
redirectToLogin(preserveState: boolean = true): void {
  // 需求 8.5: 保留当前页面状态
  if (preserveState) {
    const currentPath = window.location.pathname + window.location.search
    sessionStorage.setItem('redirectAfterLogin', currentPath)
  }

  // 需求 8.6: 清除本地认证信息
  window.location.href = '/login'
}
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User makes API request                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ GraphQL Client receives 401 error                               │
│ - Clears auth info                                              │
│ - Dispatches 'auth:expired' event                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Auth Service listens to 'auth:expired'                          │
│ - Calls logout() to clear localStorage                          │
│ - Calls errorHandler.redirectToLogin(true)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Error Handler redirects to login                                │
│ - Saves current path to sessionStorage                          │
│ - Redirects to /login                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Auth Context updates UI                                         │
│ - Clears user state                                             │
│ - Shows "登录已过期，请重新登录" message                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ User sees login page with error message                         │
│ - Enters credentials                                            │
│ - Submits login form                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Login Page after successful login                               │
│ - Checks sessionStorage for 'redirectAfterLogin'                │
│ - Navigates to saved path (or default to '/')                   │
│ - Clears saved path from sessionStorage                         │
└─────────────────────────────────────────────────────────────────┘
```

## Testing

Created comprehensive integration tests in `src/services/sessionExpiration.test.ts`:

1. **Test: Detect 401 error and trigger auth:expired event**
   - Verifies GraphQL client dispatches event on 401

2. **Test: Preserve current page state when session expires**
   - Verifies current path is saved to sessionStorage

3. **Test: Clear authentication info on session expiration**
   - Verifies localStorage is cleared on logout

4. **Test: Restore saved page after successful re-login**
   - Verifies LoginPage restores saved path after login

5. **Test: Handle 401 error in GraphQL client**
   - Verifies event handling flow

**Test Results:** ✅ All 5 tests passing

## Key Features

### ✅ 401 Error Detection
- GraphQL client automatically detects 401 responses
- Triggers centralized session expiration handling

### ✅ State Preservation
- Current page URL (including query parameters) is saved
- User returns to exact same page after re-login
- No data loss during session expiration

### ✅ User Notification
- Clear error message: "登录已过期，请重新登录"
- Displayed in AuthContext error state
- Visible on login page

### ✅ Clean Logout
- All authentication data cleared from localStorage
- GraphQL client auth headers cleared
- Proper cleanup of sensitive information

### ✅ Seamless Re-login
- User logs in normally
- Automatically redirected to saved page
- Saved path cleared after redirect

## Files Modified

1. `src/services/graphqlClient.ts` - Enhanced 401 error handling
2. `src/services/authService.ts` - Added session expiration listener
3. `src/contexts/AuthContext.tsx` - Added UI state update on expiration
4. `src/pages/LoginPage.tsx` - Added redirect restoration logic

## Files Created

1. `src/services/sessionExpiration.test.ts` - Integration tests
2. `TASK_16.1_IMPLEMENTATION_SUMMARY.md` - This document

## Verification

To verify the implementation works:

1. **Manual Testing:**
   - Log in to the application
   - Navigate to any page (e.g., `/tasks/query?status=in_progress`)
   - Manually expire the session (delete auth token from localStorage or wait for real expiration)
   - Make any API request
   - Verify you're redirected to login with error message
   - Log in again
   - Verify you're returned to the original page with query parameters intact

2. **Automated Testing:**
   ```bash
   npm test -- src/services/sessionExpiration.test.ts
   ```

## Next Steps

Task 16.1 is complete. The next task in the sequence is:

- **Task 16.2**: 实现自动登出
  - 会话过期时清除认证信息
  - 重定向到登录页

Note: Most of Task 16.2 is already implemented as part of Task 16.1, since the session expiration flow includes automatic logout and redirect.
