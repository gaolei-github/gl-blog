import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deletePost, fetchPostDetail, fetchPostPage, type PostRecord } from '../../api/posts'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import DetailModal from '../../components/detail-modal/DetailModal'
import ToastNotice from '../../components/toast-notice/ToastNotice'
import './posts-page.css'

type PostStatus = '' | '0' | '1' | '2' | '3' | '4'

const statusOptions: Array<{ value: PostStatus; label: string }> = [
  { value: '', label: '全部' },
  { value: '0', label: '草稿' },
  { value: '1', label: '已发布' },
  { value: '2', label: '定时发布' },
  { value: '3', label: '已归档' },
  { value: '4', label: '已下线' },
]

const statusLabelMap: Record<string, string> = {
  '0': '草稿',
  '1': '已发布',
  '2': '定时发布',
  '3': '已归档',
  '4': '已下线',
}

const visibilityLabelMap: Record<string, string> = {
  '0': '公开',
  '1': '私密',
  '2': '不公开（仅链接访问）',
  '3': '密码访问',
}

const normalizeTagNames = (value: unknown): string[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const record = item as { name?: unknown; tagName?: unknown; label?: unknown }
          if (typeof record.name === 'string') {
            return record.name.trim()
          }
          if (typeof record.tagName === 'string') {
            return record.tagName.trim()
          }
          if (typeof record.label === 'string') {
            return record.label.trim()
          }
        }

        return String(item).trim()
      })
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return []
    }

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        return normalizeTagNames(parsed)
      } catch {
        // keep fallback splitting below
      }
    }

    return trimmed
      .split(/[，,、|]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const parseTagText = (post: PostRecord) => {
  const postRecord = post as unknown as Record<string, unknown>

  const directCandidates: unknown[] = [
    postRecord.tagNames,
    postRecord.tagNameList,
    postRecord.tags,
    postRecord.tagList,
    postRecord.tag_names,
    postRecord.tag_name_list,
  ]

  for (const candidate of directCandidates) {
    const names = normalizeTagNames(candidate)
    if (names.length > 0) {
      return Array.from(new Set(names)).join('、')
    }
  }

  if (typeof postRecord.extJson === 'string' && postRecord.extJson.trim()) {
    try {
      const ext = JSON.parse(postRecord.extJson) as Record<string, unknown>
      const extCandidates: unknown[] = [
        ext.tagNames,
        ext.tagNameList,
        ext.tags,
        ext.tagList,
      ]
      for (const candidate of extCandidates) {
        const names = normalizeTagNames(candidate)
        if (names.length > 0) {
          return Array.from(new Set(names)).join('、')
        }
      }
    } catch {
      // ignore invalid extJson
    }
  }

  return '-'
}

function PostsPage() {
  const navigate = useNavigate()
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingStatus, setPendingStatus] = useState<PostStatus>('')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchStatus, setSearchStatus] = useState<PostStatus>('')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [pendingDeletePost, setPendingDeletePost] = useState<PostRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailPost, setDetailPost] = useState<PostRecord | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isErrorOpen, setIsErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [pageSize, totalCount])

  const selectedStatusLabel =
    statusOptions.find((option) => option.value === pendingStatus)?.label ?? '全部'

  const handleSearch = () => {
    setSearchTitle(pendingTitle.trim())
    setSearchStatus(pendingStatus)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setPendingTitle('')
    setPendingStatus('')
    setSearchTitle('')
    setSearchStatus('')
    setCurrentPage(1)
  }

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetchPostPage({
        pageNo: currentPage,
        pageSize,
        keyword: searchTitle,
        status: searchStatus ? Number(searchStatus) : undefined,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '帖子列表加载失败')
        setIsErrorOpen(true)
        return
      }

      const data = response.data
      setPosts(data?.records ?? [])
      setTotalCount(Number(data?.total ?? 0))
    } catch {
      setErrorMessage('帖子列表加载失败')
      setIsErrorOpen(true)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchStatus, searchTitle])

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

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    setPendingPage(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

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

  const handleOpenDelete = (post: PostRecord) => {
    setPendingDeletePost(post)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeletePost || isDeleting) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await deletePost(String(pendingDeletePost.id))

      if (!response.success) {
        setErrorMessage(response.errorMessage || '删除失败')
        setIsErrorOpen(true)
        return
      }

      setIsDeleteOpen(false)
      setPendingDeletePost(null)

      if (posts.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await fetchPosts()
      }

      setSuccessMessage('帖子删除成功')
      setIsSuccessOpen(true)
    } catch {
      setErrorMessage('删除失败')
      setIsErrorOpen(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenDetail = async (post: PostRecord) => {
    try {
      setIsDetailOpen(true)
      setIsDetailLoading(true)
      const response = await fetchPostDetail(String(post.id))

      if (!response.success) {
        setErrorMessage(response.errorMessage || '详情加载失败')
        setIsErrorOpen(true)
        setIsDetailOpen(false)
        return
      }

      setDetailPost(response.data)
    } catch {
      setErrorMessage('详情加载失败')
      setIsErrorOpen(true)
      setIsDetailOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setDetailPost(null)
  }

  return (
    <DashboardLayout>
      <section className="posts-card">
        <div className="posts-header">
          <div>
            <div className="card-label">帖子管理</div>
            <div className="posts-title">帖子列表</div>
          </div>
          <button
            type="button"
            className="posts-create-button"
            onClick={() => navigate('/posts/create')}
          >
            发布新帖
          </button>
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
                  onClick={() => setIsStatusOpen((current) => !current)}
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
                        key={option.value || 'all'}
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
          </div>
        </div>

        <div className="posts-table">
          <div className="posts-row posts-head">
            <span>标题</span>
            <span>标识</span>
            <span>作者</span>
            <span>状态</span>
            <span>发布时间</span>
            <span>浏览量</span>
            <span>操作</span>
          </div>
          {loading ? (
            <div className="posts-empty">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="posts-empty">暂无数据</div>
          ) : (
            posts.map((post) => (
              <div className="posts-row" key={post.id}>
                <span className="post-title">{post.title}</span>
                <span className="post-content">{post.slug}</span>
                <span>{post.authorName || '-'}</span>
                <span>
                  <span className="post-status-chip">
                    {statusLabelMap[String(post.status ?? '')] || '-'}
                  </span>
                </span>
                <span>{post.publishTime || '-'}</span>
                <span>{post.viewCount ?? 0}</span>
                <span className="post-actions">
                  <button
                    type="button"
                    className="post-action-button"
                    onClick={() => {
                      void handleOpenDetail(post)
                    }}
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    className="post-action-button"
                    onClick={() => navigate(`/posts/edit/${post.id}`)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="post-action-button post-action-button-danger"
                    onClick={() => handleOpenDelete(post)}
                  >
                    删除
                  </button>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="posts-pagination">
          <div className="pagination-info">
            第 {currentPage} / {totalPages} 页 · 共 {totalCount} 条
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

        <DetailModal
          isOpen={isDetailOpen}
          title="帖子详情"
          cardClassName="posts-detail-modal-card"
          bodyClassName="posts-detail-modal-body"
          onClose={handleCloseDetail}
        >
          {isDetailLoading ? (
            <div className="posts-detail-loading">详情加载中...</div>
          ) : detailPost ? (
            <div className="posts-detail-grid">
              <div><strong>ID：</strong>{detailPost.id}</div>
              <div><strong>标题：</strong>{detailPost.title}</div>
              <div><strong>slug：</strong>{detailPost.slug}</div>
              <div><strong>作者：</strong>{detailPost.authorName || '-'}</div>
              <div><strong>状态：</strong>{statusLabelMap[String(detailPost.status ?? '')] || '-'}</div>
              <div>
                <strong>可见性：</strong>
                {visibilityLabelMap[String(detailPost.visibility ?? '')] || '-'}
              </div>
              <div><strong>发布时间：</strong>{detailPost.publishTime || '-'}</div>
              <div><strong>浏览量：</strong>{detailPost.viewCount ?? 0}</div>
              <div><strong>精选：</strong>{detailPost.featured === 1 ? '是' : '否'}</div>
              <div><strong>置顶：</strong>{detailPost.pinned === 1 ? '是' : '否'}</div>
              <div><strong>分类：</strong>{detailPost.categoryName || detailPost.categoryId || '-'}</div>
              <div><strong>标签：</strong>{parseTagText(detailPost)}</div>
              <div className="posts-detail-section">
                <strong>摘要：</strong>
                <div>{detailPost.summary || '-'}</div>
              </div>
              <div className="posts-detail-section">
                <strong>封面：</strong>
                {detailPost.coverUrl ? (
                  <a
                    href={detailPost.coverUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="posts-detail-cover-link"
                  >
                    <img
                      src={detailPost.coverUrl}
                      alt="帖子封面"
                      className="posts-detail-cover-image"
                    />
                  </a>
                ) : (
                  <div>-</div>
                )}
              </div>
              <div className="posts-detail-section">
                <strong>正文：</strong>
                {detailPost.content || detailPost.renderedContent ? (
                  <div
                    className="posts-detail-article"
                    dangerouslySetInnerHTML={{
                      __html: detailPost.content || detailPost.renderedContent || '',
                    }}
                  />
                ) : (
                  <div>-</div>
                )}
              </div>
            </div>
          ) : null}
        </DetailModal>

        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="删除帖子"
          message={`确认删除帖子「${pendingDeletePost?.title || ''}」吗？`}
          description="删除后不可恢复，请谨慎操作。"
          confirmLabel={isDeleting ? '删除中...' : '确认删除'}
          cancelLabel="取消"
          confirmTone="danger"
          onCancel={() => {
            if (isDeleting) {
              return
            }
            setIsDeleteOpen(false)
            setPendingDeletePost(null)
          }}
          onConfirm={() => {
            void handleConfirmDelete()
          }}
        />

        <ToastNotice
          isOpen={isSuccessOpen}
          message={successMessage}
          tone="success"
          onClose={() => setIsSuccessOpen(false)}
        />
        <ToastNotice
          isOpen={isErrorOpen}
          message={errorMessage}
          tone="error"
          onClose={() => setIsErrorOpen(false)}
        />
      </section>
    </DashboardLayout>
  )
}

export default PostsPage
