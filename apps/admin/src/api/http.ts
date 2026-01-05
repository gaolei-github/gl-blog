const DEFAULT_BASE_URL = 'http://localhost:9000'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = API_BASE_URL.replace(/\/$/, '')
  const next = path.replace(/^\//, '')
  return `${base}/${next}`
}

const request = async <T>(
  path: string,
  { method = 'GET', body, headers, signal }: RequestOptions = {}
): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
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
