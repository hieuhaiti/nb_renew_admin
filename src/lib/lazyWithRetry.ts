import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'Failed to load module script',
]

function isDynamicImportFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern))
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
  retryKey: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    const hasRefreshed = sessionStorage.getItem(retryKey) === 'true'

    try {
      const module = await importer()
      sessionStorage.removeItem(retryKey)
      return module
    } catch (error) {
      if (!hasRefreshed && isDynamicImportFetchError(error)) {
        sessionStorage.setItem(retryKey, 'true')
        window.location.reload()
        return new Promise<never>(() => {
          // Keep suspense pending until reload happens.
        })
      }

      sessionStorage.removeItem(retryKey)
      throw error
    }
  })
}
