import Link from 'next/link'
import type { JSX } from 'react'
import styles from './page.module.css'

const ProfilePage = (): JSX.Element => {
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
            <span className={styles['profile-avatar']}>GL</span>
            <div>
              <h1 className={styles['profile-title']}>个人资料</h1>
              <p className={styles['profile-meta']}>gl docs · content reader</p>
            </div>
          </div>
        </header>

        <p className={styles['profile-content']}>
          这里是个人资料页入口，后续可以继续扩展头像上传、账户信息、阅读偏好等模块。
        </p>
      </section>
    </main>
  )
}

export default ProfilePage
