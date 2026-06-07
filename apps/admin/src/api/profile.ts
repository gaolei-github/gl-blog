import { getJson, putJson } from './http'

type ApiResponse<T> = {
  success: boolean
  errorCode: string | number | null
  errorMessage: string | null
  data: T
}

export type UserProfileData = {
  userId?: string | number
  nickname?: string
  phone?: string
  avatar?: string
  sex?: 1 | 2 | 3
  birthday?: string
  bio?: string
  githubUrl?: string
  giteeUrl?: string
  email?: string
  username?: string
  displayName?: string
}

export type UpdateUserProfilePayload = {
  nickname: string
  avatar?: string
  phone?: string
  sex?: 1 | 2 | 3
  birthday?: string
  bio: string
  githubUrl?: string
  giteeUrl?: string
}

export const fetchUserProfile = async () => {
  return getJson<ApiResponse<UserProfileData>>('app/user/profile')
}

export const updateUserProfile = async (
  payload: UpdateUserProfilePayload
) => {
  return putJson<ApiResponse<boolean>>('app/user/profile', payload)
}
