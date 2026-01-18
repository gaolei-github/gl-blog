import {
  ACCESS_TOKEN_KEY,
  EXPIRES_IN_KEY,
  REFRESH_TOKEN_KEY,
} from '../constants/auth'

const getStoredAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY) ||
  sessionStorage.getItem(ACCESS_TOKEN_KEY)

export const getAuthToken = () => getStoredAccessToken()

const getStoredRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN_KEY) ||
  sessionStorage.getItem(REFRESH_TOKEN_KEY)

export const getRefreshToken = () => getStoredRefreshToken()

const resolveTokenStorage = (preferLocal?: boolean) => {
  if (preferLocal === true) {
    return localStorage
  }
  if (preferLocal === false) {
    return sessionStorage
  }
  if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
    return localStorage
  }
  if (sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
    return sessionStorage
  }
  if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
    return localStorage
  }
  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    return sessionStorage
  }
  return localStorage
}

export const saveAuthTokens = (
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  },
  preferLocal?: boolean
) => {
  const storage = resolveTokenStorage(preferLocal)
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  storage.setItem(EXPIRES_IN_KEY, String(tokens.expiresIn))

  if (storage === localStorage) {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(EXPIRES_IN_KEY)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_IN_KEY)
  }
}

export const hasAuthToken = () => Boolean(getStoredAccessToken())

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_IN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(EXPIRES_IN_KEY)
}
