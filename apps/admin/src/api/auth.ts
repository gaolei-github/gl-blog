import { postJson } from './http'

type SendCodePayload = {
  email: string
}

type ApiResponse<T> = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: T
}

type LoginPayload = {
  username: string
  password: string
}

type CodeLoginPayload = {
  username: string
  code: string
}

type TokenData = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

type RegisterPayload = {
  email: string
  code: string
  password: string
  confirmPassword: string
}

export const sendEmailCode = async (email: string) => {
  const payload: SendCodePayload = { email }
  const response = await postJson<ApiResponse<boolean>>(
    '/app/code/email',
    payload
  )

  if (!response.success) {
    throw new Error(response.errorMessage || '发送失败')
  }

  return response.data
}

export const passwordLogin = async (payload: LoginPayload) => {
  const response = await postJson<ApiResponse<TokenData>>(
    '/auth/password-login',
    payload
  )

  if (!response.success) {
    throw new Error(response.errorMessage || '登录失败')
  }

  return response.data
}

export const codeLogin = async (payload: CodeLoginPayload) => {
  const response = await postJson<ApiResponse<TokenData>>(
    '/auth/code-login',
    payload
  )

  if (!response.success) {
    throw new Error(response.errorMessage || '登录失败')
  }

  return response.data
}

export const registerUser = async (payload: RegisterPayload) => {
  const response = await postJson<ApiResponse<boolean>>(
    '/app/user/register',
    payload
  )

  if (!response.success) {
    throw new Error(response.errorMessage || '注册失败')
  }

  return response.data
}
