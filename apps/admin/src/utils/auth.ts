import {
  ACCESS_TOKEN_KEY,
  EXPIRES_IN_KEY,
  REFRESH_TOKEN_KEY,
} from '../constants/auth'

const getStoredAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN_KEY) ||
  sessionStorage.getItem(ACCESS_TOKEN_KEY)

export const hasAuthToken = () => Boolean(getStoredAccessToken())

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_IN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(EXPIRES_IN_KEY)
}
