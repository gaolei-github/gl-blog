import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    status: 'published',
  },
  {
    id: 'post-002',
    title: '打造轻量级设计系统',
    content: '从色彩、字体到组件拆分，保持统一视觉语言并提升交付效率。',
    author: 'Liang Chen',
    tags: ['设计', '组件'],
    views: 946,
    createdAt: '2024-11-30',
    status: 'draft',
  },
  {
    id: 'post-003',
    title: '内容运营节奏拆解',
    content: '记录选题、排期、复盘流程，帮助持续输出高质量内容。',
    author: 'Yuki Wang',
    tags: ['运营', '策略'],
    views: 1320,
    createdAt: '2024-10-21',
    status: 'published',
  },
  {
    id: 'post-004',
    title: '数据化增长看板搭建',
    content: '从埋点到指标拆分，搭建业务增长监控面板。',
    author: 'Wen Li',
    tags: ['数据', '增长'],
    views: 1580,
    createdAt: '2024-09-12',
    status: 'published',
  },
  {
    id: 'post-005',
    title: '团队内容协作流程',
    content: '梳理角色分工与协作节奏，提升内容交付稳定性。',
    author: 'Jia Sun',
    tags: ['协作', '流程'],
    views: 1106,
    createdAt: '2024-08-28',
    status: 'draft',
  },
  {
    id: 'post-006',
    title: '多语言内容管理实践',
    content: '多语言站点的内容结构与翻译流程实践总结。',
    author: 'Nina Zhao',
    tags: ['国际化', '内容'],
    views: 920,
    createdAt: '2024-08-06',
    status: 'published',
  },
  {
    id: 'post-007',
    title: '效率工具链盘点',
    content: '选择与搭配编辑、审校、发布的工具组合。',
    author: 'Bo Yang',
    tags: ['工具', '效率'],
    views: 1432,
    createdAt: '2024-07-19',
    status: 'published',
  },
  {
    id: 'post-008',
    title: '增长实验复盘模板',
    content: '从假设到结论的标准化实验复盘模板。',
    author: 'Rui Chen',
    tags: ['实验', '增长'],
    views: 856,
    createdAt: '2024-06-30',
    status: 'draft',
  },
  {
    id: 'post-009',
    title: '专题栏目规划方法',
    content: '围绕主题体系构建持续更新的栏目矩阵。',
    author: 'Lan Hu',
    tags: ['栏目', '规划'],
    views: 1244,
    createdAt: '2024-06-11',
    status: 'published',
  },
  {
    id: 'post-010',
    title: '内容风格一致性检查',
    content: '建立写作风格与品牌调性的统一检查机制。',
    author: 'Ming Guo',
    tags: ['风格', '品牌'],
    views: 1012,
    createdAt: '2024-05-22',
    status: 'published',
  },
]

const statusOptions = [
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
]

function PostsPage() {
  const navigate = useNavigate()
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingAuthor, setPendingAuthor] = useState('')
  const [pendingStartDate, setPendingStartDate] = useState('')
  const [pendingEndDate, setPendingEndDate] = useState('')
  const [pendingStatus, setPendingStatus] = useState('published')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [searchStartDate, setSearchStartDate] = useState('')
  const [searchEndDate, setSearchEndDate] = useState('')
  const [searchStatus, setSearchStatus] = useState('published')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const handleSearch = () => {
    setSearchTitle(pendingTitle)
    setSearchAuthor(pendingAuthor)
    setSearchStartDate(pendingStartDate)
    setSearchEndDate(pendingEndDate)
    setSearchStatus(pendingStatus)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setPendingTitle('')
    setPendingAuthor('')
    setPendingStartDate('')
    setPendingEndDate('')
    setPendingStatus('published')
    setSearchTitle('')
    setSearchAuthor('')
    setSearchStartDate('')
    setSearchEndDate('')
    setSearchStatus('published')
    setCurrentPage(1)
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
      const matchesStatus = searchStatus ? post.status === searchStatus : true

      return (
        matchesTitle &&
        matchesAuthor &&
        matchesStart &&
        matchesEnd &&
        matchesStatus
      )
    })
  }, [
    searchAuthor,
    searchEndDate,
    searchStartDate,
    searchTitle,
    searchStatus,
  ])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredPosts.length / pageSize))
  }, [filteredPosts.length, pageSize])

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize

    return filteredPosts.slice(startIndex, endIndex)
  }, [currentPage, filteredPosts, pageSize])

  const visibleRange = useMemo(() => {
    if (filteredPosts.length === 0) {
      return { start: 0, end: 0 }
    }

    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(filteredPosts.length, currentPage * pageSize)

    return { start, end }
  }, [currentPage, filteredPosts.length, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    setPendingPage(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    if (!isStatusOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isStatusOpen])

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSize = Number(event.target.value)
    setPageSize(nextSize)
    setCurrentPage(1)
  }

  const handleJumpPage = () => {
    const nextPage = Number(pendingPage)

    if (Number.isNaN(nextPage)) {
      setPendingPage(String(currentPage))
      return
    }

    const clampedPage = Math.min(Math.max(nextPage, 1), totalPages)
    setCurrentPage(clampedPage)
  }

  const selectedStatusLabel =
    statusOptions.find((option) => option.value === pendingStatus)
      ?.label ?? '已发布'

  return (
    <DashboardLayout>
      <section className="posts-card">
        <div className="posts-header">
          <div>
            <div className="card-label">帖子管理</div>
            <div className="posts-title">帖子列表</div>
          </div>
        </div>
        <div className="posts-filters">
          <div className="filters-row">
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
            <div className="filter-item filter-status">
              <span className="filter-label">状态</span>
              <div className="filter-select" ref={statusMenuRef}>
                <button
                  type="button"
                  id="post-status"
                  className="filter-select-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isStatusOpen}
                  aria-controls="post-status-listbox"
                  onClick={() =>
                    setIsStatusOpen((current) => !current)
                  }
                >
                  <span>{selectedStatusLabel}</span>
                  <span className="filter-select-icon" aria-hidden="true">
                    ▼
                  </span>
                </button>
                {isStatusOpen && (
                  <div
                    className="filter-select-menu"
                    role="listbox"
                    id="post-status-listbox"
                  >
                    {statusOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`filter-select-option ${
                          pendingStatus === option.value ? 'active' : ''
                        }`}
                        role="option"
                        aria-selected={pendingStatus === option.value}
                        onClick={() => {
                          setPendingStatus(option.value)
                          setIsStatusOpen(false)
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="filter-item filter-action">
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
            <div className="filter-item filter-toggle">
              <button
                type="button"
                className={`filter-toggle-button ${isAdvancedOpen ? 'open' : ''}`}
                onClick={() => setIsAdvancedOpen((current) => !current)}
              >
                高级筛选
                <span className="filter-toggle-icon" aria-hidden="true">
                  {isAdvancedOpen ? '▲' : '▼'}
                </span>
              </button>
            </div>
          </div>
          {isAdvancedOpen && (
            <div className="filters-row">
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
            </div>
          )}
        </div>
        <div className="posts-toolbar">
          <button
            type="button"
            className="posts-create-button"
            onClick={() => navigate('/posts/create')}
          >
            发布新帖
          </button>
        </div>
        <div className="posts-table">
          <div className="posts-row posts-head">
            <span>标题</span>
            <span>内容</span>
            <span>作者</span>
            <span>标签</span>
            <span>浏览量</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          {paginatedPosts.length === 0 ? (
            <div className="posts-empty">暂无数据</div>
          ) : (
            paginatedPosts.map((post) => (
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
                <span className="post-actions">
                  <button type="button" className="post-action-button">
                    详情
                  </button>
                  <button type="button" className="post-action-button">
                    编辑
                  </button>
                  <button type="button" className="post-action-button">
                    删除
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
        <div className="posts-pagination">
          <div className="pagination-info">
            第 {currentPage} / {totalPages} 页 · 共 {filteredPosts.length} 条
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
            >
              上一页
            </button>
            <button
              type="button"
              className="pagination-button"
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              下一页
            </button>
          </div>
          <div className="pagination-settings">
            <label className="pagination-label" htmlFor="page-size">
              每页
            </label>
            <select
              id="page-size"
              className="pagination-select"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="pagination-unit">条</span>
            <label className="pagination-label" htmlFor="page-jump">
              跳至
            </label>
            <input
              id="page-jump"
              type="number"
              className="pagination-input"
              min={1}
              max={totalPages}
              value={pendingPage}
              onChange={(event) => setPendingPage(event.target.value)}
            />
            <span className="pagination-unit">页</span>
            <button
              type="button"
              className="pagination-button ghost"
              onClick={handleJumpPage}
            >
              确定
            </button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}

export default PostsPage
