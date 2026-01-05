import { useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import './posts-page.css'

const postList = [
  {
    id: 'post-001',
    title: '用 Turborepo 管理多应用',
    content: '从任务编排到缓存策略，分享多应用项目协作的实战经验。',
    author: 'Guolei Gao',
    tags: ['构建', '协作'],
    views: 1824,
    createdAt: '2024-12-18',
  },
  {
    id: 'post-002',
    title: '打造轻量级设计系统',
    content: '从色彩、字体到组件拆分，保持统一视觉语言并提升交付效率。',
    author: 'Liang Chen',
    tags: ['设计', '组件'],
    views: 946,
    createdAt: '2024-11-30',
  },
  {
    id: 'post-003',
    title: '内容运营节奏拆解',
    content: '记录选题、排期、复盘流程，帮助持续输出高质量内容。',
    author: 'Yuki Wang',
    tags: ['运营', '策略'],
    views: 1320,
    createdAt: '2024-10-21',
  },
]

function PostsPage() {
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingAuthor, setPendingAuthor] = useState('')
  const [pendingStartDate, setPendingStartDate] = useState('')
  const [pendingEndDate, setPendingEndDate] = useState('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [searchStartDate, setSearchStartDate] = useState('')
  const [searchEndDate, setSearchEndDate] = useState('')

  const handleSearch = () => {
    setSearchTitle(pendingTitle)
    setSearchAuthor(pendingAuthor)
    setSearchStartDate(pendingStartDate)
    setSearchEndDate(pendingEndDate)
  }

  const handleReset = () => {
    setPendingTitle('')
    setPendingAuthor('')
    setPendingStartDate('')
    setPendingEndDate('')
    setSearchTitle('')
    setSearchAuthor('')
    setSearchStartDate('')
    setSearchEndDate('')
  }

  const filteredPosts = useMemo(() => {
    const normalizedTitle = searchTitle.trim().toLowerCase()
    const normalizedAuthor = searchAuthor.trim().toLowerCase()

    return postList.filter((post) => {
      const matchesTitle = normalizedTitle
        ? post.title.toLowerCase().includes(normalizedTitle)
        : true
      const matchesAuthor = normalizedAuthor
        ? post.author.toLowerCase().includes(normalizedAuthor)
        : true
      const postDate = post.createdAt
      const matchesStart = searchStartDate
        ? postDate >= searchStartDate
        : true
      const matchesEnd = searchEndDate ? postDate <= searchEndDate : true

      return matchesTitle && matchesAuthor && matchesStart && matchesEnd
    })
  }, [searchAuthor, searchEndDate, searchStartDate, searchTitle])

  return (
    <DashboardLayout>
      <section className="posts-card">
        <div className="posts-header">
          <div>
            <div className="card-label">帖子管理</div>
            <div className="posts-title">帖子列表</div>
          </div>
          <div className="posts-count">共 {filteredPosts.length} 条</div>
        </div>
        <div className="posts-filters">
          <div className="filter-item filter-title">
            <label className="filter-label" htmlFor="post-title">
              标题
            </label>
            <input
              id="post-title"
              type="text"
              className="filter-input"
              placeholder="搜索标题"
              value={pendingTitle}
              onChange={(event) => setPendingTitle(event.target.value)}
            />
          </div>
          <div className="filter-item filter-author">
            <label className="filter-label" htmlFor="post-author">
              作者
            </label>
            <input
              id="post-author"
              type="text"
              className="filter-input"
              placeholder="搜索作者"
              value={pendingAuthor}
              onChange={(event) => setPendingAuthor(event.target.value)}
            />
          </div>
          <div className="filter-item filter-range-item">
            <label className="filter-label" htmlFor="post-start">
              时间范围
            </label>
            <div className="filter-range">
              <input
                id="post-start"
                type="date"
                className="filter-input"
                value={pendingStartDate}
                onChange={(event) => setPendingStartDate(event.target.value)}
              />
              <span className="filter-separator">-</span>
              <input
                id="post-end"
                type="date"
                className="filter-input"
                value={pendingEndDate}
                onChange={(event) => setPendingEndDate(event.target.value)}
              />
            </div>
          </div>
          <div className="filter-item filter-action">
            <span className="filter-label">操作</span>
            <div className="filter-actions">
              <button
                type="button"
                className="filter-button"
                onClick={handleSearch}
              >
                查询
              </button>
              <button
                type="button"
                className="filter-button ghost"
                onClick={handleReset}
              >
                重置
              </button>
            </div>
          </div>
        </div>
        <div className="posts-table">
          <div className="posts-row posts-head">
            <span>标题</span>
            <span>内容</span>
            <span>作者</span>
            <span>标签</span>
            <span>浏览量</span>
            <span>创建时间</span>
          </div>
          {filteredPosts.map((post) => (
            <div className="posts-row" key={post.id}>
              <span className="post-title">{post.title}</span>
              <span className="post-content">
                {post.content.length > 10
                  ? `${post.content.slice(0, 10)}..`
                  : post.content}
              </span>
              <span>{post.author}</span>
              <span className="post-tags">{post.tags.join('、')}</span>
              <span>{post.views}</span>
              <span>{post.createdAt}</span>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}

export default PostsPage
