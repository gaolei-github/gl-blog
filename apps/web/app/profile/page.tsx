'use client'

import Link from 'next/link'
import type { JSX } from 'react'
import styles from './page.module.css'
import { useBlogProfile } from '../portal-data'

const getSexLabel = (sex: number | undefined) => {
  if (sex === 1) {
    return '男'
  }

  if (sex === 2) {
    return '女'
  }

  if (sex === 3) {
    return '其他'
  }

  return '未公开'
}

const getProfileInitials = (nickname: string) => {
  const normalizedNickname = nickname.trim()
  if (!normalizedNickname) {
    return 'GL'
  }

  return normalizedNickname.slice(0, 2).toUpperCase()
}

const formatBirthdayMonth = (birthday: string | undefined) => {
  if (!birthday) {
    return '出生年月未公开'
  }

  const birthdayMatch = birthday.match(/^(\d{4})-(\d{2})/)
  if (!birthdayMatch) {
    return '出生年月未公开'
  }

  return `${birthdayMatch[1]}-${birthdayMatch[2]}`
}

const ProfilePage = (): JSX.Element => {
  const { profileData, isLoading, errorMessage } = useBlogProfile()
  const nickname = profileData?.nickname?.trim() || '个人资料'
  const bio = profileData?.bio?.trim() || '暂无个人简介'
  const birthdayMonth = formatBirthdayMonth(profileData?.birthday)
  const avatarUrl = profileData?.avatar?.trim() ?? ''
  const avatarStyle = avatarUrl
    ? {
        backgroundImage: `url(${avatarUrl})`,
      }
    : undefined
  const profileMeta = `${getSexLabel(profileData?.sex)} · ${birthdayMonth}`
  const profileLinkList = [
    {
      label: 'GitHub',
      value: profileData?.githubUrl?.trim() ?? '',
    },
    {
      label: 'Gitee',
      value: profileData?.giteeUrl?.trim() ?? '',
    },
  ].filter((item) => item.value)

  return (
    <main className={styles['profile-page']}>
      <section className={styles['profile-card']}>
        <header className={styles['profile-header']}>
          <div className={styles['breadcrumb']}>
            <Link href='/' className={styles['breadcrumb-link']}>
              首页
            </Link>
            <span className={styles['breadcrumb-separator']}>/</span>
            <span className={styles['breadcrumb-current']}>个人资料</span>
          </div>

          <div className={styles['profile-head']}>
            <div
              className={`${styles['profile-avatar']} ${avatarUrl ? styles['profile-avatar-image'] : ''}`}
              style={avatarStyle}
              aria-label={`${nickname}头像`}
            >
              {!avatarUrl ? getProfileInitials(nickname) : null}
            </div>
            <div className={styles['profile-summary']}>
              <h1 className={styles['profile-title']}>{nickname}</h1>
              <p className={styles['profile-meta']}>{profileMeta}</p>
              {!isLoading && !errorMessage ? <p className={styles['profile-content']}>{bio}</p> : null}

              {!isLoading && !errorMessage && profileLinkList.length > 0 ? (
                <div className={styles['profile-links']}>
                  {profileLinkList.map((item) => (
                    <a
                      key={item.label}
                      href={item.value}
                      target='_blank'
                      rel='noreferrer'
                      className={styles['profile-link']}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {isLoading ? <p className={styles['profile-status']}>个人资料加载中...</p> : null}
        {!isLoading && errorMessage ? <p className={styles['profile-error']}>{errorMessage}</p> : null}
      </section>
    </main>
  )
}

export default ProfilePage
