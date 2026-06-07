import { REMEMBER_EMAIL_KEY } from '../constants/auth'

export type AdminProfile = {
  name: string
  email: string
  phone: string
  avatar: string
  sex: '' | 1 | 2 | 3
  birthday: string
  bio: string
  githubUrl: string
  giteeUrl: string
}

export const PROFILE_STORAGE_KEY = 'gl-blog:admin-profile'
export const PROFILE_UPDATED_EVENT = 'gl-blog:admin-profile-updated'

export const DEFAULT_PROFILE: AdminProfile = {
  name: 'Guolei Gao',
  email: 'guolei@example.com',
  phone: '',
  avatar: '',
  sex: '',
  birthday: '',
  bio: '',
  githubUrl: '',
  giteeUrl: '',
}

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value : ''

const normalizeSex = (value: unknown): AdminProfile['sex'] => {
  const numericValue = Number(value)

  if (numericValue === 1 || numericValue === 2 || numericValue === 3) {
    return numericValue
  }

  return ''
}

const normalizeProfile = (value: Partial<AdminProfile>): AdminProfile => ({
  name: normalizeText(value.name).trim() || DEFAULT_PROFILE.name,
  email:
    normalizeText(value.email).trim() ||
    localStorage.getItem(REMEMBER_EMAIL_KEY) ||
    DEFAULT_PROFILE.email,
  phone: normalizeText(value.phone),
  avatar: normalizeText(value.avatar),
  sex: normalizeSex(value.sex),
  birthday: normalizeText(value.birthday),
  bio: normalizeText(value.bio),
  githubUrl: normalizeText(value.githubUrl),
  giteeUrl: normalizeText(value.giteeUrl),
})

export const readLocalProfile = (): AdminProfile => {
  const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)

  if (!storedProfile) {
    return normalizeProfile(DEFAULT_PROFILE)
  }

  try {
    const parsedProfile = JSON.parse(storedProfile) as Partial<AdminProfile>
    return normalizeProfile(parsedProfile)
  } catch {
    return normalizeProfile(DEFAULT_PROFILE)
  }
}

export const saveLocalProfile = (profile: AdminProfile) => {
  const nextProfile = normalizeProfile(profile)
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT))

  return nextProfile
}
