/**
 * Vitest 类型声明
 * 扩展 Vitest 的 Assertion 接口以支持 @testing-library/jest-dom 的匹配器
 */

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers {}
}
