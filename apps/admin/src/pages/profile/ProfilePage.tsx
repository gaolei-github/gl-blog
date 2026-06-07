import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { uploadFile } from '../../api/files'
import {
  fetchUserProfile,
  updateUserProfile,
  type UpdateUserProfilePayload,
  type UserProfileData,
} from '../../api/profile'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import ToastNotice from '../../components/toast-notice/ToastNotice'
import {
  type AdminProfile,
  DEFAULT_PROFILE,
  readLocalProfile,
  saveLocalProfile,
} from '../../utils/profile'
import './profile-page.css'

type FormState = AdminProfile

const normalizeRemoteProfile = (
  profile: Partial<UserProfileData>
): AdminProfile => ({
  name:
    profile.nickname?.trim() ||
    profile.displayName?.trim() ||
    profile.username?.trim() ||
    DEFAULT_PROFILE.name,
  email: profile.email?.trim() || DEFAULT_PROFILE.email,
  phone: profile.phone || '',
  avatar: profile.avatar || '',
  sex: profile.sex === 1 || profile.sex === 2 || profile.sex === 3 ? profile.sex : '',
  birthday: profile.birthday || '',
  bio: profile.bio || '',
  githubUrl: profile.githubUrl || '',
  giteeUrl: profile.giteeUrl || '',
})

function ProfilePage() {
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const [formState, setFormState] = useState<FormState>(() =>
    readLocalProfile()
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isErrorOpen, setIsErrorOpen] = useState(false)
  const [noticeMessage, setNoticeMessage] = useState('')

  const avatarText = useMemo(() => {
    const sourceText = formState.name || formState.email || 'GL'
    return sourceText.slice(0, 1).toUpperCase()
  }, [formState.email, formState.name])

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetchUserProfile()

        if (response.success && response.data) {
          const nextProfile = normalizeRemoteProfile(response.data)
          setFormState(saveLocalProfile(nextProfile))
          return
        }

        setNoticeMessage(response.errorMessage || '资料读取失败，已使用本地资料')
        setIsErrorOpen(true)
      } catch {
        setNoticeMessage('资料读取失败，已使用本地资料')
        setIsErrorOpen(true)
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [])

  const updateField = (field: keyof FormState, value: FormState[keyof FormState]) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const validateForm = () => {
    if (!formState.name.trim()) {
      return '请填写昵称'
    }

    if (formState.name.trim().length > 50) {
      return '昵称不能超过50个字符'
    }

    if (formState.phone.trim().length > 20) {
      return '手机号码不能超过20个字符'
    }

    if (formState.bio.trim().length > 500) {
      return '个人简介不能超过500个字符'
    }

    return ''
  }

  const buildPayload = (): UpdateUserProfilePayload => {
    const nextSex = formState.sex === '' ? undefined : formState.sex

    return {
      nickname: formState.name.trim(),
      avatar: formState.avatar.trim() || undefined,
      phone: formState.phone.trim() || undefined,
      sex: nextSex,
      birthday: formState.birthday || undefined,
      bio: formState.bio.trim(),
      githubUrl: formState.githubUrl.trim() || undefined,
      giteeUrl: formState.giteeUrl.trim() || undefined,
    }
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]

    if (!file) {
      return
    }

    try {
      setIsAvatarUploading(true)
      const response = await uploadFile({ file, folder: 'user/avatar' })

      if (!response.success || !response.data?.objectUrl) {
        setNoticeMessage(response.errorMessage || '头像上传失败')
        setIsErrorOpen(true)
        return
      }

      updateField('avatar', response.data.objectUrl)
      setNoticeMessage('头像已上传，请保存资料')
      setIsSuccessOpen(true)
    } catch {
      setNoticeMessage('头像上传失败')
      setIsErrorOpen(true)
    } finally {
      setIsAvatarUploading(false)
      input.value = ''
    }
  }

  const onSave = async (event: FormEvent) => {
    event.preventDefault()
    const errorMessage = validateForm()

    if (errorMessage) {
      setNoticeMessage(errorMessage)
      setIsErrorOpen(true)
      return
    }

    const payload = buildPayload()

    try {
      setIsSubmitting(true)
      const response = await updateUserProfile(payload)

      if (!response.success || response.data !== true) {
        setNoticeMessage(response.errorMessage || '保存失败')
        setIsErrorOpen(true)
        return
      }

      const nextProfile = saveLocalProfile({
        ...formState,
        name: payload.nickname,
        phone: payload.phone || '',
        avatar: payload.avatar || '',
        sex: payload.sex || '',
        birthday: payload.birthday || '',
        bio: payload.bio,
        githubUrl: payload.githubUrl || '',
        giteeUrl: payload.giteeUrl || '',
      })

      setFormState(nextProfile)
      setNoticeMessage('资料已保存')
      setIsSuccessOpen(true)
    } catch {
      setNoticeMessage('保存失败')
      setIsErrorOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onReset = () => {
    setFormState(readLocalProfile())
    setNoticeMessage('已恢复最近保存的资料')
    setIsSuccessOpen(true)
  }

  return (
    <DashboardLayout>
      <section className="profile-page">
        <header className="profile-hero">
          <div className="profile-hero-copy">
            <span className="profile-eyebrow">账号设置</span>
            <h1 className="profile-title">编辑个人资料</h1>
            <p className="profile-desc">
              维护后台昵称、头像和博客资料，保存后会同步更新右上角资料卡。
            </p>
          </div>
          <div className="profile-preview" aria-label="Profile preview">
            {formState.avatar ? (
              <img
                className="profile-preview-avatar image"
                src={formState.avatar}
                alt={formState.name}
              />
            ) : (
              <div className="profile-preview-avatar" aria-hidden="true">
                {avatarText}
              </div>
            )}
            <div>
              <div className="profile-preview-name">
                {formState.name || '-'}
              </div>
              <div className="profile-preview-email">
                {formState.email || '-'}
              </div>
            </div>
          </div>
        </header>

        <form className="profile-form-card" onSubmit={onSave}>
          <div className="profile-form-header">
            <div>
              <div className="profile-section-title">基础资料</div>
              <div className="profile-section-note">
                {isLoading ? '正在读取资料...' : '邮箱由账号系统维护，此处只读展示'}
              </div>
            </div>
            <div className="profile-form-actions">
              <button
                className="profile-secondary-button"
                type="button"
                onClick={onReset}
                disabled={isSubmitting || isAvatarUploading}
              >
                重置
              </button>
              <button
                className="profile-primary-button"
                type="submit"
                disabled={isSubmitting || isAvatarUploading}
              >
                {isSubmitting ? '保存中...' : '保存资料'}
              </button>
            </div>
          </div>

          <div className="profile-avatar-uploader">
            <input
              ref={avatarInputRef}
              id="profileAvatar"
              className="profile-file-input"
              type="file"
              accept="image/*"
              disabled={isAvatarUploading || isSubmitting}
              onChange={handleAvatarChange}
            />
            <button
              className="profile-avatar-button"
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isAvatarUploading || isSubmitting}
            >
              {formState.avatar ? (
                <img src={formState.avatar} alt="头像预览" />
              ) : (
                <span>{avatarText}</span>
              )}
            </button>
            <div className="profile-avatar-copy">
              <div className="profile-label">头像</div>
              <div className="profile-section-note">
                {isAvatarUploading ? '头像上传中...' : '点击头像上传图片'}
              </div>
              {formState.avatar ? (
                <button
                  className="profile-link-button"
                  type="button"
                  onClick={() => updateField('avatar', '')}
                  disabled={isAvatarUploading || isSubmitting}
                >
                  移除头像
                </button>
              ) : null}
            </div>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field" htmlFor="profileName">
              <span className="profile-label">昵称</span>
              <input
                id="profileName"
                className="profile-input"
                type="text"
                value={formState.name}
                maxLength={50}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="请输入昵称"
              />
            </label>
            <label className="profile-field" htmlFor="profileEmail">
              <span className="profile-label">邮箱</span>
              <input
                id="profileEmail"
                className="profile-input"
                type="email"
                value={formState.email}
                disabled
                placeholder="邮箱由账号系统维护"
              />
            </label>
            <label className="profile-field" htmlFor="profilePhone">
              <span className="profile-label">手机号码</span>
              <input
                id="profilePhone"
                className="profile-input"
                type="tel"
                value={formState.phone}
                maxLength={20}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="请输入手机号码"
              />
            </label>
            <label className="profile-field" htmlFor="profileSex">
              <span className="profile-label">性别</span>
              <select
                id="profileSex"
                className="profile-input"
                value={String(formState.sex)}
                onChange={(event) => {
                  const nextValue = Number(event.target.value)
                  updateField(
                    'sex',
                    nextValue === 1 || nextValue === 2 || nextValue === 3
                      ? nextValue
                      : ''
                  )
                }}
              >
                <option value="">未设置</option>
                <option value="1">男</option>
                <option value="2">女</option>
                <option value="3">其他</option>
              </select>
            </label>
            <label className="profile-field" htmlFor="profileBirthday">
              <span className="profile-label">出生日期</span>
              <input
                id="profileBirthday"
                className="profile-input"
                type="date"
                value={formState.birthday}
                onChange={(event) =>
                  updateField('birthday', event.target.value)
                }
              />
            </label>
            <label className="profile-field" htmlFor="profileGithubUrl">
              <span className="profile-label">Github 主页</span>
              <input
                id="profileGithubUrl"
                className="profile-input"
                type="url"
                value={formState.githubUrl}
                maxLength={255}
                onChange={(event) =>
                  updateField('githubUrl', event.target.value)
                }
                placeholder="https://github.com/username"
              />
            </label>
            <label className="profile-field wide" htmlFor="profileGiteeUrl">
              <span className="profile-label">Gitee 主页</span>
              <input
                id="profileGiteeUrl"
                className="profile-input"
                type="url"
                value={formState.giteeUrl}
                maxLength={255}
                onChange={(event) =>
                  updateField('giteeUrl', event.target.value)
                }
                placeholder="https://gitee.com/username"
              />
            </label>
            <label className="profile-field wide" htmlFor="profileBio">
              <span className="profile-label">个人简介</span>
              <textarea
                id="profileBio"
                className="profile-textarea"
                value={formState.bio}
                maxLength={500}
                onChange={(event) => updateField('bio', event.target.value)}
                placeholder="写一句用于个人博客展示的简介"
              />
            </label>
          </div>
        </form>
      </section>

      <ToastNotice
        isOpen={isSuccessOpen}
        message={noticeMessage}
        onClose={() => setIsSuccessOpen(false)}
      />
      <ToastNotice
        isOpen={isErrorOpen}
        message={noticeMessage}
        tone="error"
        onClose={() => setIsErrorOpen(false)}
      />
    </DashboardLayout>
  )
}

export default ProfilePage
