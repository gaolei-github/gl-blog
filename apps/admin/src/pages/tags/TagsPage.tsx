import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createTag,
  deleteTag,
  fetchTagPage,
  updateTag,
  updateTagEnabled,
} from '../../api/tags'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog'
import { DataCard, DataCardGrid } from '../../components/data-card-grid/DataCardGrid'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import DetailModal from '../../components/detail-modal/DetailModal'
import ToastNotice from '../../components/toast-notice/ToastNotice'
import './tags-page.css'

interface TagItem {
  id: string
  name: string
  description: string
  status: 'enabled' | 'disabled'
  slug: string
}

type TagAction = 'view' | 'edit' | 'delete' | null

const statusLabels: Record<TagItem['status'], string> = {
  enabled: '启用',
  disabled: '禁用',
}

const actionLabels: Record<Exclude<TagAction, null>, string> = {
  view: '查看',
  edit: '编辑',
  delete: '删除',
}

type TagPageResponse = Awaited<ReturnType<typeof fetchTagPage>>

const pendingTagPageRequests = new Map<
  string,
  Promise<TagPageResponse>
>()

function TagsPage() {
  const [pendingName, setPendingName] = useState('')
  const [searchName, setSearchName] = useState('')
  const [tags, setTags] = useState<TagItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isErrorOpen, setIsErrorOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTag, setActiveTag] = useState<TagItem | null>(null)
  const [pendingDeleteTag, setPendingDeleteTag] = useState<TagItem | null>(null)
  const [pendingToggleTag, setPendingToggleTag] = useState<TagItem | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<TagAction>(null)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftKey, setDraftKey] = useState('')
  const [draftStatus, setDraftStatus] = useState<TagItem['status']>('enabled')
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTags = useCallback(
    async (pageNo: number, size: number, keyword: string) => {
      try {
        const normalizedKeyword = keyword.trim()
        const requestKey = `${pageNo}:${size}:${normalizedKeyword}`
        const cachedRequest = pendingTagPageRequests.get(requestKey)
        const requestPromise =
          cachedRequest ??
          fetchTagPage({
            keyword: normalizedKeyword,
            pageNo,
            pageSize: size,
          }).finally(() => {
            pendingTagPageRequests.delete(requestKey)
          })

        if (!cachedRequest) {
          pendingTagPageRequests.set(requestKey, requestPromise)
        }

        const response = await requestPromise

        if (!response.success) {
          setErrorMessage(response.errorMessage || '请求失败')
          setIsErrorOpen(true)
          return
        }

        const records = response.data?.records ?? []
        const responseTotal = response.data?.total ?? 0
        const nextTags = records.map((record) => {
          const nextId = String(record.id)
          const nextSlug = record.slug || record.tagCode || nextId

          return {
            id: nextId,
            name: record.name,
            description: record.description,
            status: record.enabled === 1 ? 'enabled' : 'disabled',
            slug: nextSlug,
          }
        })

        setTags(nextTags)
        setTotalCount(
          responseTotal > 0 ? responseTotal : records.length
        )
      } catch {
        return
      }
    },
    []
  )

  const handleSearch = () => {
    setSearchName(pendingName)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setPendingName('')
    setSearchName('')
    setCurrentPage(1)
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [pageSize, totalCount])

  const selectedTag = useMemo(() => {
    if (!selectedTagId) {
      return null
    }

    return tags.find((tag) => tag.id === selectedTagId) ?? null
  }, [selectedTagId, tags])

  const selectionMessage = useMemo(() => {
    if (selectedTag && pendingAction) {
      return `已选：${selectedTag.name} · ${actionLabels[pendingAction]}`
    }

    if (selectedTag) {
      return `已选：${selectedTag.name}`
    }

    if (pendingAction) {
      return `请点击卡片以${actionLabels[pendingAction]}`
    }

    return '选择标签后操作'
  }, [pendingAction, selectedTag])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])


  useEffect(() => {
    void fetchTags(currentPage, pageSize, searchName)
  }, [currentPage, fetchTags, pageSize, searchName])

  useEffect(() => {
    setPendingPage(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    if (
      selectedTagId &&
      !tags.some((tag) => tag.id === selectedTagId)
    ) {
      setSelectedTagId(null)
    }
  }, [selectedTagId, tags])

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

  const handleToggleStatus = async (tag: TagItem) => {
    if (togglingId === tag.id) {
      return
    }

    const nextEnable = tag.status === 'enabled' ? 0 : 1

    try {
      setTogglingId(tag.id)
      const response = await updateTagEnabled(tag.id, {
        enable: nextEnable,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      await fetchTags(currentPage, pageSize, searchName)
      setSelectedTagId(null)
      setSuccessMessage(
        nextEnable === 1 ? '标签已启用' : '标签已禁用'
      )
      setIsSuccessOpen(true)
    } catch {
      setErrorMessage('操作失败')
      setIsErrorOpen(true)
    } finally {
      setTogglingId(null)
    }
  }

  const handleSelectTag = (tagId: string) => {
    const nextSelectedId = selectedTagId === tagId ? null : tagId

    setSelectedTagId(nextSelectedId)

    if (!nextSelectedId) {
      return
    }

    const nextTag = tags.find((tag) => tag.id === nextSelectedId)

    if (!nextTag) {
      return
    }

    if (pendingAction === 'view') {
      handleOpenDetail(nextTag)
      setPendingAction(null)
    }

    if (pendingAction === 'edit') {
      handleOpenEdit(nextTag)
      setPendingAction(null)
    }
  }

  const handleOpenDelete = (tag: TagItem) => {
    setPendingDeleteTag(tag)
    setIsDeleteOpen(true)
  }

  const handleOpenView = () => {
    if (!selectedTag) {
      setPendingAction((current) =>
        current === 'view' ? null : 'view'
      )
      return
    }

    handleOpenDetail(selectedTag)
    setPendingAction(null)
  }

  const handleOpenEditAction = () => {
    if (!selectedTag) {
      setPendingAction((current) =>
        current === 'edit' ? null : 'edit'
      )
      return
    }

    handleOpenEdit(selectedTag)
    setPendingAction(null)
  }

  const handleOpenDeleteAction = () => {
    if (!selectedTag) {
      setPendingAction((current) =>
        current === 'delete' ? null : 'delete'
      )
      return
    }

    handleOpenDelete(selectedTag)
    setPendingAction(null)
  }

  const handleOpenToggle = () => {
    if (!selectedTag) {
      return
    }

    setPendingToggleTag(selectedTag)
    setIsToggleOpen(true)
  }

  const handleCloseToggle = () => {
    setIsToggleOpen(false)
    setPendingToggleTag(null)
  }

  const handleConfirmToggle = () => {
    if (!pendingToggleTag || togglingId === pendingToggleTag.id) {
      return
    }

    handleToggleStatus(pendingToggleTag)
    handleCloseToggle()
  }

  const handleCloseDelete = () => {
    setIsDeleteOpen(false)
    setPendingDeleteTag(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteTag || isDeleting) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await deleteTag(pendingDeleteTag.id)

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseDelete()
      setSelectedTagId(null)
      await fetchTags(currentPage, pageSize, searchName)
      setSuccessMessage('标签删除成功')
      setIsSuccessOpen(true)
    } finally {
      setIsDeleting(false)
    }
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
    setSelectedTagId(null)
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

  const handleCreateTag = async () => {
    const nextName = draftName.trim()

    if (!nextName || isCreating) {
      return
    }

    const nextDescription = draftDescription.trim()
    const nextKey = draftKey.trim()
    const nextEnabled = draftStatus === 'enabled' ? 1 : 0

    try {
      setIsCreating(true)
      const response = await createTag({
        name: nextName,
        slug: nextKey,
        description: nextDescription,
        enabled: nextEnabled,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseCreate()
      await fetchTags(currentPage, pageSize, searchName)
      setSuccessMessage('标签添加成功')
      setIsSuccessOpen(true)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!activeTag || isSaving) {
      return
    }

    const nextName = draftName.trim()

    if (!nextName) {
      return
    }

    const nextDescription = draftDescription.trim()
    const nextKey = draftKey.trim()
    const nextEnabled = draftStatus === 'enabled' ? 1 : 0

    try {
      setIsSaving(true)
      const response = await updateTag(activeTag.id, {
        name: nextName,
        slug: nextKey,
        description: nextDescription,
        enabled: nextEnabled,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseDetail()
      await fetchTags(currentPage, pageSize, searchName)
      setSuccessMessage('标签更新成功')
      setIsSuccessOpen(true)
    } finally {
      setIsSaving(false)
    }
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
        <div className="tags-selection">
          <div className="tags-selection-info">{selectionMessage}</div>
          <div className="tags-selection-actions">
            <button
              type="button"
              className={`tags-action-button ${
                pendingAction === 'view' ? 'active' : ''
              }`}
              onClick={handleOpenView}
            >
              查看
            </button>
            <button
              type="button"
              className={`tags-action-button ${
                pendingAction === 'edit' ? 'active' : ''
              }`}
              onClick={handleOpenEditAction}
            >
              编辑
            </button>
            <button
              type="button"
              className={`tags-action-button danger ${
                pendingAction === 'delete' ? 'active' : ''
              }`}
              onClick={handleOpenDeleteAction}
            >
              删除
            </button>
            <button
              type="button"
              className="tags-action-button"
              disabled={!selectedTag || togglingId === selectedTag?.id}
              onClick={handleOpenToggle}
            >
              {togglingId === selectedTag?.id
                ? '处理中'
                : selectedTag?.status === 'enabled'
                ? '禁用'
                : '启用'}
            </button>
          </div>
        </div>
        <DataCardGrid
          isEmpty={tags.length === 0}
          emptyMessage="暂无匹配标签"
          className="tags-grid"
        >
          {tags.map((tag) => (
            <DataCard
              key={tag.id}
              title={tag.name}
              description={tag.description}
              statusLabel={statusLabels[tag.status]}
              statusTone={tag.status}
              className="tags-card-item"
              meta={
                <span className="data-card-chip">
                  {tag.slug || tag.id}
                </span>
              }
              onClick={() => handleSelectTag(tag.id)}
              isSelected={selectedTagId === tag.id}
              ariaPressed={selectedTagId === tag.id}
              useButton={false}
            />
          ))}
        </DataCardGrid>
        <div className="tags-pagination">
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
                  disabled={isCreating}
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
        <ConfirmDialog
          isOpen={isToggleOpen && Boolean(pendingToggleTag)}
          title="状态确认"
          message={
            pendingToggleTag?.status === 'enabled'
              ? '确认禁用该标签？'
              : '确认启用该标签？'
          }
          description={
            pendingToggleTag ? `标签：${pendingToggleTag.name}` : undefined
          }
          confirmLabel={
            pendingToggleTag?.status === 'enabled' ? '禁用' : '启用'
          }
          cancelLabel="取消"
          onConfirm={handleConfirmToggle}
          onCancel={handleCloseToggle}
        />
        <ToastNotice
          isOpen={isSuccessOpen}
          message={successMessage || '操作成功'}
          onClose={() => setIsSuccessOpen(false)}
        />
        <ToastNotice
          isOpen={isErrorOpen}
          message={errorMessage || '系统异常'}
          tone="error"
          onClose={() => setIsErrorOpen(false)}
        />
      </section>
    </DashboardLayout>
  )
}

export default TagsPage
