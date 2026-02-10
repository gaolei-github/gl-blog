import { useEffect, useMemo, useState } from 'react'
import {
  fetchPostDetail,
  fetchPostPage,
  fetchPostSummary,
  type PostRecord,
} from '../../api/posts'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import './home-page.css'

const stripHtml = (value: string) => {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const parseTagNames = (post: PostRecord | null) => {
  if (!post) {
    return []
  }

  if (Array.isArray(post.tags) && post.tags.length > 0) {
    return post.tags
      .map((tag) => (typeof tag === 'string' ? tag : tag.name || ''))
      .map((tagName) => tagName.trim())
      .filter(Boolean)
  }

  const candidates = [post.tagNames, post.tagNameList, post.tagList]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const tagNames = candidate.map((tagName) => String(tagName).trim()).filter(Boolean)
      if (tagNames.length > 0) {
        return tagNames
      }
      continue
    }

    if (typeof candidate === 'string') {
      const tagNames = candidate
        .split(/[，,、|]/)
        .map((tagName) => tagName.trim())
        .filter(Boolean)
      if (tagNames.length > 0) {
        return tagNames
      }
    }
  }

  return []
}

function HomePage() {
  const [postCount, setPostCount] = useState<number | null>(null)
  const [categoryCount, setCategoryCount] = useState<number | null>(null)
  const [tagCount, setTagCount] = useState<number | null>(null)
  const [topPost, setTopPost] = useState<PostRecord | null>(null)

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

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [summaryResponse, postPageResponse] = await Promise.all([
          fetchPostSummary(),
          fetchPostPage({
            pageNo: 1,
            pageSize: 1,
            keyword: '',
          }),
        ])

        if (summaryResponse.success && summaryResponse.data) {
          setCategoryCount(Number(summaryResponse.data.categoryCount ?? 0))
          setTagCount(Number(summaryResponse.data.tagCount ?? 0))
          const hottestPost = summaryResponse.data.hottestPost ?? null
          setTopPost(hottestPost)

          if (hottestPost?.id) {
            const detailResponse = await fetchPostDetail(String(hottestPost.id))
            if (detailResponse.success && detailResponse.data) {
              setTopPost({
                ...hottestPost,
                ...detailResponse.data,
              })
            }
          }
        }

        if (postPageResponse.success && postPageResponse.data) {
          setPostCount(Number(postPageResponse.data.total ?? 0))
        }
      } catch {
        // Home page should remain viewable even when summary request fails.
      }
    }

    void loadSummary()
  }, [])

  const topPostExcerpt = useMemo(() => {
    if (!topPost) {
      return '暂无内容'
    }

    const summaryText = topPost.summary?.trim()
    if (summaryText) {
      return summaryText
    }

    const contentText = stripHtml(topPost.content || topPost.renderedContent || '')
    return contentText || '暂无内容'
  }, [topPost])

  const topPostTags = useMemo(() => {
    return parseTagNames(topPost)
  }, [topPost])

  const topPostCategory = useMemo(() => {
    if (!topPost) {
      return '-'
    }

    if (topPost.categoryName?.trim()) {
      return topPost.categoryName.trim()
    }

    if (topPost.categoryId !== undefined && topPost.categoryId !== null) {
      return String(topPost.categoryId)
    }

    return '-'
  }, [topPost])

  return (
    <DashboardLayout>
      <section className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-label">内容概览</div>
          <div className="stats-grid">
            <div className="stats-item">
              <div className="stats-value">{postCount ?? '-'}</div>
              <div className="stats-label">帖子数</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{tagCount ?? '-'}</div>
              <div className="stats-label">标签数</div>
            </div>
            <div className="stats-item">
              <div className="stats-value">{categoryCount ?? '-'}</div>
              <div className="stats-label">分类数</div>
            </div>
          </div>
          <div className="card-note">累计帖子、标签与分类统计</div>
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
            <div className="feature-title">{topPost?.title || '-'}</div>
            <div className="feature-meta-line">
              <span>作者：{topPost?.authorName || '-'}</span>
              <span>发布时间：{topPost?.publishTime || '-'}</span>
              <span>类目：{topPostCategory}</span>
              <span>浏览：{topPost?.viewCount ?? '-'}</span>
            </div>
            <div className="feature-excerpt">{topPostExcerpt}</div>
          </div>
          {topPost?.coverUrl ? (
            <img className="feature-image" src={topPost.coverUrl} alt={topPost.title} />
          ) : (
            <div className="feature-image-placeholder">暂无封面</div>
          )}
        </div>
        <div className="feature-tags">
          {topPostTags.length > 0 ? (
            topPostTags.map((tag) => (
              <span key={tag} className="feature-tag">
                {tag}
              </span>
            ))
          ) : (
            <span className="feature-tag feature-tag-empty">暂无标签</span>
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}

export default HomePage
