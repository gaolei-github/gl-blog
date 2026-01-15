import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog'
import DetailModal from '../../components/detail-modal/DetailModal'
import './tags-page.css'

interface TagItem {
  id: string
  name: string
  description: string
  status: 'enabled' | 'disabled'
  slug: string
}

const tagList: TagItem[] = [
  {
    id: 'tag-001',
    name: '增长',
    description: '增长策略与实验复盘的核心标签',
    status: 'enabled',
    slug: 'growth',
  },
  {
    id: 'tag-002',
    name: '设计系统',
    description: '组件库、视觉规范与设计系统规划',
    status: 'enabled',
    slug: 'design-system',
  },
  {
    id: 'tag-003',
    name: '内容运营',
    description: '选题、排期与内容增长运营方法',
    status: 'enabled',
    slug: 'content-ops',
  },
  {
    id: 'tag-004',
    name: '协作流程',
    description: '跨团队协作与流程优化的经验沉淀',
    status: 'disabled',
    slug: 'collaboration',
  },
  {
    id: 'tag-005',
    name: '数据分析',
    description: '看板搭建、指标拆解与洞察挖掘',
    status: 'enabled',
    slug: 'data-insights',
  },
  {
    id: 'tag-006',
    name: '品牌表达',
    description: '品牌调性与写作风格统一',
    status: 'disabled',
    slug: 'brand-voice',
  },
  {
    id: 'tag-007',
    name: '效率工具',
    description: '内容生产与交付效率工具',
    status: 'enabled',
    slug: 'productivity-tools',
  },
]

function TagsPage() {
  const [pendingName, setPendingName] = useState('')
  const [searchName, setSearchName] = useState('')
  const [tags, setTags] = useState<TagItem[]>(tagList)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [activeTag, setActiveTag] = useState<TagItem | null>(null)
  const [pendingDeleteTag, setPendingDeleteTag] = useState<TagItem | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftKey, setDraftKey] = useState('')
  const [draftStatus, setDraftStatus] = useState<TagItem['status']>('enabled')

  const handleSearch = () => {
    setSearchName(pendingName)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setPendingName('')
    setSearchName('')
    setCurrentPage(1)
  }

  const filteredTags = useMemo(() => {
    const normalizedName = searchName.trim().toLowerCase()

    return tags.filter((tag) =>
      normalizedName
        ? tag.name.toLowerCase().includes(normalizedName)
        : true
    )
  }, [searchName, tags])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTags.length / pageSize))
  }, [filteredTags.length, pageSize])

  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize

    return filteredTags.slice(startIndex, endIndex)
  }, [currentPage, filteredTags, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    setPendingPage(String(currentPage))
  }, [currentPage])

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

  const handleToggleStatus = (tagId: string) => {
    setTags((current) =>
      current.map((tag) =>
        tag.id === tagId
          ? {
              ...tag,
              status: tag.status === 'enabled' ? 'disabled' : 'enabled',
            }
          : tag
      )
    )
  }

  const handleOpenDelete = (tag: TagItem) => {
    setPendingDeleteTag(tag)
    setIsDeleteOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteOpen(false)
    setPendingDeleteTag(null)
  }

  const handleConfirmDelete = () => {
    if (!pendingDeleteTag) {
      return
    }

    setTags((current) =>
      current.filter((tag) => tag.id !== pendingDeleteTag.id)
    )
    handleCloseDelete()
  }

  const handleOpenDetail = (tag: TagItem) => {
    setActiveTag(tag)
    setIsEditMode(false)
    setIsDetailOpen(true)
  }

  const handleOpenEdit = (tag: TagItem) => {
    setActiveTag(tag)
    setDraftName(tag.name)
    setDraftDescription(tag.description)
    setDraftKey(tag.slug || '')
    setDraftStatus(tag.status)
    setIsEditMode(true)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setIsEditMode(false)
    setActiveTag(null)
    resetDraft()
  }

  const resetDraft = () => {
    setDraftName('')
    setDraftDescription('')
    setDraftKey('')
    setDraftStatus('enabled')
  }

  const handleCloseCreate = () => {
    setIsCreateOpen(false)
    resetDraft()
  }

  const handleCreateTag = () => {
    const nextName = draftName.trim()

    if (!nextName) {
      return
    }

    const nextDescription = draftDescription.trim()
    const nextKey = draftKey.trim()
    const nextId = `tag-${Date.now()}`

    setTags((current) => [
      {
        id: nextId,
        name: nextName,
        description: nextDescription,
        status: draftStatus,
        slug: nextKey,
      },
      ...current,
    ])
    setPendingName('')
    setSearchName('')
    setCurrentPage(1)
    handleCloseCreate()
  }

  const handleSaveEdit = () => {
    if (!activeTag) {
      return
    }

    const nextName = draftName.trim()

    if (!nextName) {
      return
    }

    const nextDescription = draftDescription.trim()
    const nextKey = draftKey.trim()

    setTags((current) =>
      current.map((tag) =>
        tag.id === activeTag.id
          ? {
              ...tag,
              name: nextName,
              description: nextDescription,
              slug: nextKey,
              status: draftStatus,
            }
          : tag
      )
    )
    handleCloseDetail()
  }

  return (
    <DashboardLayout>
      <section className="tags-card">
        <div className="tags-header">
          <div>
            <div className="card-label">标签管理</div>
            <div className="tags-title">标签列表</div>
          </div>
        </div>
        <div className="tags-filters">
          <div className="filters-row">
            <div className="filter-item filter-name">
              <label className="filter-label" htmlFor="tag-name">
                标签名
              </label>
              <input
                id="tag-name"
                type="text"
                className="filter-input"
                placeholder="搜索标签名称"
                value={pendingName}
                onChange={(event) => setPendingName(event.target.value)}
              />
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
        <div className="tags-toolbar">
          <button
            type="button"
            className="tag-create-button"
            onClick={() => setIsCreateOpen(true)}
          >
            <span className="tag-create-icon">+</span>
            新增标签
          </button>
        </div>
        <div className="tags-table">
          <div className="tags-row tags-head">
            <span>标签名称</span>
            <span>标签描述</span>
            <span>是否启用</span>
            <span>操作</span>
          </div>
          {paginatedTags.length === 0 ? (
            <div className="tags-empty">暂无匹配标签</div>
          ) : (
            paginatedTags.map((tag) => (
              <div className="tags-row" key={tag.id}>
                <span className="tag-name">{tag.name}</span>
                <span className="tag-description">{tag.description}</span>
                <span>
                  <span
                    className={`tag-status ${
                      tag.status === 'enabled' ? 'enabled' : 'disabled'
                    }`}
                  >
                    {tag.status === 'enabled' ? '启用' : '禁用'}
                  </span>
                </span>
                <span className="tag-actions">
                  <button
                    type="button"
                    className="tag-action-button"
                    onClick={() => handleOpenDetail(tag)}
                  >
                    查看
                  </button>
                  <button
                    type="button"
                    className="tag-action-button"
                    onClick={() => handleOpenEdit(tag)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="tag-action-button danger"
                    onClick={() => handleOpenDelete(tag)}
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    className="tag-action-button"
                    onClick={() => handleToggleStatus(tag.id)}
                  >
                    {tag.status === 'enabled' ? '禁用' : '启用'}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
        <div className="tags-pagination">
          <div className="pagination-info">
            第 {currentPage} / {totalPages} 页 · 共 {filteredTags.length} 条
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
            <label className="pagination-label" htmlFor="tag-page-size">
              每页
            </label>
            <select
              id="tag-page-size"
              className="pagination-select"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="pagination-unit">条</span>
            <label className="pagination-label" htmlFor="tag-page-jump">
              跳至
            </label>
            <input
              id="tag-page-jump"
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
        {isCreateOpen ? (
          <div className="tags-modal-mask">
            <div className="tags-modal-card" role="dialog" aria-modal="true">
              <div className="tags-modal-header">
                <span>新增标签</span>
                <button
                  type="button"
                  className="tags-modal-close"
                  onClick={handleCloseCreate}
                >
                  关闭
                </button>
              </div>
              <div className="tags-modal-body">
                <label className="tags-modal-field" htmlFor="tag-name-input">
                  <span className="tags-modal-label">标签名</span>
                  <input
                    id="tag-name-input"
                    type="text"
                    className="tags-modal-input"
                    placeholder="输入标签名称"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                </label>
                <label
                  className="tags-modal-field"
                  htmlFor="tag-description-input"
                >
                  <span className="tags-modal-label">标签描述</span>
                  <textarea
                    id="tag-description-input"
                    className="tags-modal-input tags-modal-textarea"
                    placeholder="补充标签用途或备注"
                    value={draftDescription}
                    onChange={(event) =>
                      setDraftDescription(event.target.value)
                    }
                  />
                </label>
                <label className="tags-modal-field" htmlFor="tag-key-input">
                  <span className="tags-modal-label">标签标识</span>
                  <input
                    id="tag-key-input"
                    type="text"
                    className="tags-modal-input"
                    placeholder="输入标签标识"
                    value={draftKey}
                    onChange={(event) => setDraftKey(event.target.value)}
                  />
                </label>
                <div className="tags-modal-field">
                  <span className="tags-modal-label">是否启用</span>
                  <div className="tags-modal-radio-group">
                    <label className="tags-modal-radio">
                      <input
                        type="radio"
                        name="tag-status"
                        value="enabled"
                        checked={draftStatus === 'enabled'}
                        onChange={() => setDraftStatus('enabled')}
                      />
                      启用
                    </label>
                    <label className="tags-modal-radio">
                      <input
                        type="radio"
                        name="tag-status"
                        value="disabled"
                        checked={draftStatus === 'disabled'}
                        onChange={() => setDraftStatus('disabled')}
                      />
                      禁用
                    </label>
                  </div>
                </div>
              </div>
              <div className="tags-modal-footer">
                <button
                  type="button"
                  className="tags-modal-secondary"
                  onClick={handleCloseCreate}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="tags-modal-primary"
                  onClick={handleCreateTag}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <DetailModal
          isOpen={isDetailOpen && Boolean(activeTag)}
          title={isEditMode ? '编辑标签' : '标签详情'}
          mode={isEditMode ? 'edit' : 'view'}
          onClose={handleCloseDetail}
          onSave={handleSaveEdit}
        >
          {activeTag ? (
            <>
              <label className="detail-modal-field" htmlFor="tag-detail-name">
                <span className="detail-modal-label">标签名</span>
                <input
                  id="tag-detail-name"
                  type="text"
                  className="detail-modal-input"
                  value={isEditMode ? draftName : activeTag.name}
                  readOnly={!isEditMode}
                  onChange={
                    isEditMode
                      ? (event) => setDraftName(event.target.value)
                      : undefined
                  }
                />
              </label>
              <label
                className="detail-modal-field"
                htmlFor="tag-detail-description"
              >
                <span className="detail-modal-label">标签描述</span>
                <textarea
                  id="tag-detail-description"
                  className="detail-modal-input detail-modal-textarea"
                  value={isEditMode ? draftDescription : activeTag.description}
                  readOnly={!isEditMode}
                  onChange={
                    isEditMode
                      ? (event) => setDraftDescription(event.target.value)
                      : undefined
                  }
                />
              </label>
              <label className="detail-modal-field" htmlFor="tag-detail-key">
                <span className="detail-modal-label">标签标识</span>
                <input
                  id="tag-detail-key"
                  type="text"
                  className="detail-modal-input"
                  value={isEditMode ? draftKey : activeTag.slug || activeTag.id}
                  readOnly={!isEditMode}
                  onChange={
                    isEditMode
                      ? (event) => setDraftKey(event.target.value)
                      : undefined
                  }
                />
              </label>
              <div className="detail-modal-field">
                <span className="detail-modal-label">是否启用</span>
                <div className="detail-modal-radio-group">
                  <label className="detail-modal-radio">
                    <input
                      type="radio"
                      name="tag-detail-status"
                      value="enabled"
                      checked={
                        isEditMode
                          ? draftStatus === 'enabled'
                          : activeTag.status === 'enabled'
                      }
                      onChange={
                        isEditMode
                          ? () => setDraftStatus('enabled')
                          : undefined
                      }
                      disabled={!isEditMode}
                    />
                    启用
                  </label>
                  <label className="detail-modal-radio">
                    <input
                      type="radio"
                      name="tag-detail-status"
                      value="disabled"
                      checked={
                        isEditMode
                          ? draftStatus === 'disabled'
                          : activeTag.status === 'disabled'
                      }
                      onChange={
                        isEditMode
                          ? () => setDraftStatus('disabled')
                          : undefined
                      }
                      disabled={!isEditMode}
                    />
                    禁用
                  </label>
                </div>
              </div>
            </>
          ) : null}
        </DetailModal>
        <ConfirmDialog
          isOpen={isDeleteOpen && Boolean(pendingDeleteTag)}
          title="删除确认"
          message="确认删除该标签？"
          description={
            pendingDeleteTag
              ? `将删除「${pendingDeleteTag.name}」标签，操作不可恢复。`
              : undefined
          }
          confirmLabel="删除"
          cancelLabel="取消"
          confirmTone="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDelete}
        />
      </section>
    </DashboardLayout>
  )
}

export default TagsPage
