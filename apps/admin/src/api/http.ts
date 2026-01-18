import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  saveAuthTokens,
} from '../utils/auth'

const DEFAULT_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'http://localhost:9000'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

type ApiResponse<T> = {
  success: boolean
  errorCode: string | number | null
  errorMessage: string | null
  data: T
}

type RefreshTokenPayload = {
  refreshToken: string
}

type RefreshTokenData = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string | null
  scope: string | null
}

type RefreshTokenResponse = ApiResponse<RefreshTokenData>

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = API_BASE_URL.replace(/\/$/, '')
  const next = path.replace(/^\//, '')
  return `${base}/${next}`
}

const redirectToLogin = () => {
  clearAuthTokens()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

const getAuthErrorCode = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const candidate = payload as { errorCode?: string | number | null }
  return candidate.errorCode ?? null
}

const parseJson = <T>(text: string): T | null => {
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

let refreshPromise: Promise<boolean> | null = null

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return false
  }

  refreshPromise = (async () => {
    try {
      const payload: RefreshTokenPayload = { refreshToken }
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      const data = parseJson<RefreshTokenResponse>(text)

      if (!response.ok || !data || !data.success || !data.data) {
        return false
      }

      saveAuthTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expiresIn,
      })

      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

type InternalOptions = RequestOptions & {
  isRetry?: boolean
}

const request = async <T>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
    signal,
    isRetry = false,
  }: InternalOptions = {}
): Promise<T> => {
  const authToken = getAuthToken()
  const nextHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (authToken && !nextHeaders.Authorization) {
    nextHeaders.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: nextHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await response.text()
  const data = parseJson<T>(text)

  const errorCode = getAuthErrorCode(data)
  const isUnauthorized =
    response.status === 401 || errorCode === 401 || errorCode === '401'
  const isRefreshRequest = path.includes('/auth/refresh')

  if (isUnauthorized) {
    if (!isRetry && !isRefreshRequest) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return request<T>(path, {
          method,
          body,
          headers,
          signal,
          isRetry: true,
        })
      }
    }

    redirectToLogin()
    throw new Error('Request failed: 401')
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  if (!text || data === null) {
    return undefined as T
  }
  return data as T
}

export const postJson = async <T>(
  path: string,
  body: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> =>
  request<T>(path, {
    ...options,
    method: 'POST',
    body,
  })

export const putJson = async <T>(
  path: string,
  body: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> =>
  request<T>(path, {
    ...options,
    method: 'PUT',
    body,
  })

export const deleteJson = async <T>(
  path: string,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> =>
  request<T>(path, {
    ...options,
    method: 'DELETE',
  })

export const patchJson = async <T>(
  path: string,
  body: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> =>
  request<T>(path, {
    ...options,
    method: 'PATCH',
    body,
  })
