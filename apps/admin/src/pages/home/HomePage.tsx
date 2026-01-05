import { useMemo } from 'react'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import './home-page.css'

const postCount = 128
const tagCount = 36
const topPost = {
  title: '在 Vite + React 中打造高效博客后台',
  excerpt:
    '整理构建流程、性能优化与权限管理的实践笔记，覆盖路由设计与可视化指标。',
  image:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  tags: ['性能优化', '后台管理', '设计'],
}

function HomePage() {
  const today = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekdayIndex = now.getDay()
    const weekdayLabels = [
      '星期日',
      '星期一',
      '星期二',
      '星期三',
      '星期四',
      '星期五',
      '星期六',
    ]
    const weekday = weekdayLabels[weekdayIndex]

    return { year, month, day, weekday }
  }, [])

  return (
    <DashboardLayout>
      <section className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-label">内容概览</div>
          <div className="stats-grid">
            <div className="stats-item">
              <div className="stats-value">{postCount}</div>
              <div className="stats-label">帖子数</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{tagCount}</div>
              <div className="stats-label">标签数</div>
            </div>
          </div>
          <div className="card-note">累计发布与标签总计</div>
        </div>
        <div className="dashboard-card highlight">
          <div className="card-label">年月日</div>
          <div className="date-grid">
            <div className="date-item">
              <div className="date-value">{today.year}</div>
              <div className="date-label">年</div>
            </div>
            <div className="date-item">
              <div className="date-value">{today.month}</div>
              <div className="date-label">月</div>
            </div>
            <div className="date-item">
              <div className="date-value">{today.day}</div>
              <div className="date-label">日</div>
            </div>
            <div className="date-item date-weekday">
              <div className="date-value">{today.weekday}</div>
              <div className="date-label">星期</div>
            </div>
          </div>
        </div>
      </section>
      <section className="feature-card">
        <div className="feature-header">
          <div>
            <div className="card-label">阅读量最高</div>
            <div className="feature-title">{topPost.title}</div>
            <div className="feature-excerpt">{topPost.excerpt}</div>
          </div>
          <img
            className="feature-image"
            src={topPost.image}
            alt={topPost.title}
          />
        </div>
        <div className="feature-tags">
          {topPost.tags.map((tag) => (
            <span key={tag} className="feature-tag">
              {tag}
            </span>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}

export default HomePage
