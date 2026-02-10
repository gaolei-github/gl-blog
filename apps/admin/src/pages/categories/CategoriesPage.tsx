import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  fetchCategoryPage,
  updateCategory,
  updateCategoryEnabled,
} from '../../api/categories'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog'
import { DataCard, DataCardGrid } from '../../components/data-card-grid/DataCardGrid'
import DetailModal from '../../components/detail-modal/DetailModal'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import ToastNotice from '../../components/toast-notice/ToastNotice'
import './categories-page.css'

type CategoryLevel = '1' | '2' | '3'

interface CategoryItem {
  id: string
  name: string
  description: string
  status: 'enabled' | 'disabled'
  postCount: number
  updatedAt: string
  slug: string
  level?: CategoryLevel
  parentId?: string | null
}

type StatusFilter = 'all' | CategoryItem['status']

type CategoryAction = 'view' | 'edit' | 'delete' | null

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'enabled', label: '启用' },
  { value: 'disabled', label: '停用' },
]

const levelOptions: Array<{ value: CategoryLevel; label: string }> = [
  { value: '1', label: '一级' },
  { value: '2', label: '二级' },
  { value: '3', label: '三级' },
]

const actionLabels: Record<Exclude<CategoryAction, null>, string> = {
  view: '查看',
  edit: '编辑',
  delete: '删除',
}

const statusLabels: Record<CategoryItem['status'], string> = {
  enabled: '启用',
  disabled: '停用',
}

const DEFAULT_USER_ID = '10001'

function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewCategory, setViewCategory] = useState<CategoryItem | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  )
  const [draftName, setDraftName] = useState('')
  const [draftSlug, setDraftSlug] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftLevel, setDraftLevel] = useState<CategoryLevel>('1')
  const [draftParentId, setDraftParentId] = useState('none')
  const [draftStatus, setDraftStatus] =
    useState<CategoryItem['status']>('enabled')
  const [query, setQuery] = useState('')
  const [pendingQuery, setPendingQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [parentOptions, setParentOptions] = useState<
    Array<{ value: string; label: string }>
  >([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [pendingAction, setPendingAction] = useState<CategoryAction>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [pendingDeleteCategory, setPendingDeleteCategory] =
    useState<CategoryItem | null>(null)
  const [pendingToggleCategory, setPendingToggleCategory] =
    useState<CategoryItem | null>(null)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const statusSelectRef = useRef<HTMLDivElement | null>(null)
  const [isLevelOpen, setIsLevelOpen] = useState(false)
  const [isParentOpen, setIsParentOpen] = useState(false)
  const levelSelectRef = useRef<HTMLDivElement | null>(null)
  const parentSelectRef = useRef<HTMLDivElement | null>(null)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isErrorOpen, setIsErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [pageSize, totalCount])
  useMemo(() => {
    return categories.filter((category) => category.status === 'enabled')
        .length
  }, [categories]);
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) {
      return null
    }

    return categories.find(
      (category) => category.id === selectedCategoryId
    )
  }, [categories, selectedCategoryId])

  const activeStatusLabel = useMemo(() => {
    const activeOption = statusOptions.find(
      (option) => option.value === statusFilter
    )

    return activeOption ? activeOption.label : '全部'
  }, [statusFilter])

  const activeLevelLabel = useMemo(() => {
    const activeOption = levelOptions.find(
      (option) => option.value === draftLevel
    )
    return activeOption ? activeOption.label : '一级'
  }, [draftLevel])

  const activeParentLabel = useMemo(() => {
    if (draftLevel === '1' || draftParentId === 'none') {
      return '无'
    }
    const activeOption = parentOptions.find(
      (option) => option.value === draftParentId
    )
    return activeOption ? activeOption.label : '无'
  }, [draftLevel, draftParentId, parentOptions])

  const selectionMessage = useMemo(() => {
    if (activeCategory && pendingAction) {
      return `已选：${activeCategory.name} · ${actionLabels[pendingAction]}`
    }

    if (activeCategory) {
      return `已选：${activeCategory.name}`
    }

    if (pendingAction) {
      return `请点击卡片以${actionLabels[pendingAction]}`
    }

    return '选择分类后操作'
  }, [activeCategory, pendingAction])

  const fetchCategories = useCallback(
    async (
      pageNo: number,
      size: number,
      keyword: string,
      status: StatusFilter
    ) => {
      try {
        const normalizedKeyword = keyword.trim()
        const payload = {
          keyword: normalizedKeyword,
          pageNo,
          pageSize: size,
          status:
            status === 'enabled' ? 1 : status === 'disabled' ? 0 : undefined,
        }
        const response = await fetchCategoryPage(payload)

        if (!response.success) {
          setErrorMessage(response.errorMessage || '请求失败')
          setIsErrorOpen(true)
          return
        }

        const records = response.data?.records ?? []
        const responseTotal = Number(response.data?.total ?? 0)
        const nextCategories = records.map((record) => {
          const nextId = String(record.id)
          const nextParentId =
            record.parentId === 0 ? null : String(record.parentId)
          const nextLevel = String(record.level) as CategoryLevel
          const enabledValue = Number(record.enabled)

          return {
            id: nextId,
            name: record.name,
            description: record.description,
            status: enabledValue === 1 ? 'enabled' : 'disabled',
            postCount: record.postCount,
            updatedAt: record.updateTime,
            slug: record.slug || record.categoryCode || nextId,
            level: nextLevel,
            parentId: nextParentId,
          }
        })

        setCategories(nextCategories)
        setTotalCount(
          responseTotal > 0 ? responseTotal : records.length
        )
      } catch {
        setErrorMessage('请求失败')
        setIsErrorOpen(true)
      }
    },
    []
  )

  const fetchParentOptions = useCallback(async () => {
    try {
      const response = await fetchCategoryPage({
        status: 1,
        keyword: '',
        level: 1,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '请求失败')
        setIsErrorOpen(true)
        return
      }

      const records = response.data?.records ?? []
      setParentOptions(
        records.map((record) => ({
          value: String(record.id),
          label: record.name,
        }))
      )
    } catch {
      setErrorMessage('请求失败')
      setIsErrorOpen(true)
    }
  }, [])

  const handleSearch = () => {
    setQuery(pendingQuery)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setPendingQuery('')
    setQuery('')
    setStatusFilter('all')
    setCurrentPage(1)
    setIsStatusOpen(false)
  }

  useEffect(() => {
    if (!isStatusOpen && !isLevelOpen && !isParentOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        isStatusOpen &&
        statusSelectRef.current &&
        !statusSelectRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false)
      }
      if (
        isLevelOpen &&
        levelSelectRef.current &&
        !levelSelectRef.current.contains(event.target as Node)
      ) {
        setIsLevelOpen(false)
      }
      if (
        isParentOpen &&
        parentSelectRef.current &&
        !parentSelectRef.current.contains(event.target as Node)
      ) {
        setIsParentOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [isLevelOpen, isParentOpen, isStatusOpen])

  useEffect(() => {
    if (
      selectedCategoryId &&
      !categories.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(null)
    }
  }, [categories, selectedCategoryId])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    void fetchCategories(currentPage, pageSize, query, statusFilter)
  }, [currentPage, fetchCategories, pageSize, query, statusFilter])

  useEffect(() => {
    setPendingPage(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    if (draftLevel === '1') {
      setDraftParentId('none')
      setIsParentOpen(false)
      setParentOptions([])
      return
    }
  }, [draftLevel])

  useEffect(() => {
    if (
      !isFormOpen ||
      draftLevel === '1' ||
      !isParentOpen ||
      parentOptions.length > 0
    ) {
      return
    }

    void fetchParentOptions()
  }, [
    draftLevel,
    fetchParentOptions,
    isFormOpen,
    isParentOpen,
    parentOptions.length,
  ])

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
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

  const handleSelectCategory = (categoryId: string) => {
    const nextSelectedId =
      selectedCategoryId === categoryId ? null : categoryId

    setSelectedCategoryId(nextSelectedId)

    if (nextSelectedId && pendingAction === 'view') {
      const nextCategory = categories.find(
        (category) => category.id === nextSelectedId
      )

      if (nextCategory) {
        openViewModal(nextCategory)
      }
      setPendingAction(null)
    }

    if (nextSelectedId && pendingAction === 'edit') {
      const nextCategory = categories.find(
        (category) => category.id === nextSelectedId
      )

      if (nextCategory) {
        openEditModal(nextCategory)
      }
      setPendingAction(null)
    }
  }

  const handleOpenView = () => {
    if (!activeCategory) {
      setPendingAction((current) =>
        current === 'view' ? null : 'view'
      )
      return
    }

    openViewModal(activeCategory)
    setPendingAction(null)
  }

  const handleOpenDelete = () => {
    if (!activeCategory) {
      setPendingAction((current) =>
        current === 'delete' ? null : 'delete'
      )
      return
    }

    setPendingDeleteCategory(activeCategory)
    setIsDeleteOpen(true)
    setPendingAction(null)
  }

  const handleCloseDelete = () => {
    setIsDeleteOpen(false)
    setPendingDeleteCategory(null)
  }

  const handleOpenToggle = () => {
    if (!activeCategory) {
      return
    }

    setPendingToggleCategory(activeCategory)
    setIsToggleOpen(true)
  }

  const handleCloseToggle = () => {
    setIsToggleOpen(false)
    setPendingToggleCategory(null)
  }

  const handleConfirmToggle = async () => {
    if (!pendingToggleCategory || togglingId === pendingToggleCategory.id) {
      return
    }

    const nextEnable = pendingToggleCategory.status === 'enabled' ? 0 : 1

    try {
      setTogglingId(pendingToggleCategory.id)
      const response = await updateCategoryEnabled(
        pendingToggleCategory.id,
        { enable: nextEnable }
      )

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseToggle()
      setSelectedCategoryId(null)
      await fetchCategories(currentPage, pageSize, query, statusFilter)
      setSuccessMessage(
        nextEnable === 1 ? '分类已启用' : '分类已禁用'
      )
      setIsSuccessOpen(true)
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteCategory || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await deleteCategory(pendingDeleteCategory.id)

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseDelete()
      setSelectedCategoryId(null)
      await fetchCategories(currentPage, pageSize, query, statusFilter)
      setSuccessMessage('分类删除成功')
      setIsSuccessOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetDraft = () => {
    setDraftName('')
    setDraftSlug('')
    setDraftDescription('')
    setDraftLevel('1')
    setDraftParentId('none')
    setDraftStatus('enabled')
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setIsEditMode(false)
    setEditingCategoryId(null)
    setSelectedCategoryId(null)
    resetDraft()
  }

  const handleOpenCreate = () => {
    resetDraft()
    setEditingCategoryId(null)
    setIsEditMode(false)
    setIsFormOpen(true)
    setIsViewOpen(false)
    setViewCategory(null)
    setPendingAction(null)
  }

  const openViewModal = (category: CategoryItem) => {
    setIsFormOpen(false)
    setIsEditMode(false)
    setEditingCategoryId(null)
    setViewCategory(category)
    setIsViewOpen(true)
  }

  const openEditModal = (category: CategoryItem) => {
    setIsViewOpen(false)
    setViewCategory(null)
    setDraftName(category.name)
    setDraftSlug(category.slug)
    setDraftDescription(category.description)
    setDraftLevel(category.level ?? '1')
    setDraftParentId(
      category.parentId && category.parentId !== '0'
        ? category.parentId
        : 'none'
    )
    setDraftStatus(category.status)
    setEditingCategoryId(category.id)
    setIsEditMode(true)
    setIsFormOpen(true)
    setPendingAction(null)
  }

  const handleCloseView = () => {
    setIsViewOpen(false)
    setViewCategory(null)
    setSelectedCategoryId(null)
  }

  const handleOpenEdit = () => {
    if (!activeCategory) {
      setPendingAction((current) =>
        current === 'edit' ? null : 'edit'
      )
      return
    }

    openEditModal(activeCategory)
  }

  const handleCreateCategory = async () => {
    const nextName = draftName.trim()
    const nextSlug = draftSlug.trim()
    const nextDescription = draftDescription.trim()
    const nextParentId =
      draftLevel === '1' || draftParentId === 'none'
        ? '0'
        : draftParentId

    if (!nextName || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await createCategory({
        name: nextName,
        slug: nextSlug || nextName,
        parentId: nextParentId,
        level: Number(draftLevel),
        sortNo: 0,
        description: nextDescription,
        enabled: draftStatus === 'enabled' ? 1 : 0,
        userId: DEFAULT_USER_ID,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseForm()
      await fetchCategories(currentPage, pageSize, query, statusFilter)
      setSuccessMessage('分类添加成功')
      setIsSuccessOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || isSubmitting) {
      return
    }

    const nextName = draftName.trim()
    const nextSlug = draftSlug.trim()
    const nextDescription = draftDescription.trim()
    const nextParentId =
      draftLevel === '1' || draftParentId === 'none'
        ? '0'
        : draftParentId

    if (!nextName) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await updateCategory(editingCategoryId, {
        name: nextName,
        slug: nextSlug || nextName,
        parentId: nextParentId,
        level: Number(draftLevel),
        sortNo: 0,
        description: nextDescription,
        enabled: draftStatus === 'enabled' ? 1 : 0,
        userId: DEFAULT_USER_ID,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '操作失败')
        setIsErrorOpen(true)
        return
      }

      handleCloseForm()
      await fetchCategories(currentPage, pageSize, query, statusFilter)
      setSelectedCategoryId(null)
      setSuccessMessage('分类更新成功')
      setIsSuccessOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <section className="categories-card">
        <header className="categories-header">
          <div>
            <div className="categories-title">分类管理</div>
            <div className="categories-subtitle">
              维护栏目层级与内容归档
            </div>
          </div>
          <div className="categories-header-actions">
            <button
              type="button"
              className="category-create-button"
              onClick={handleOpenCreate}
            >
              新增分类
            </button>
          </div>
        </header>

        <DetailModal
          isOpen={isFormOpen}
          title={isEditMode ? '编辑分类' : '新增分类'}
          mode="edit"
          onClose={handleCloseForm}
          onSave={
            isEditMode ? handleUpdateCategory : handleCreateCategory
          }
          saveLabel="保存"
          cancelLabel="取消"
        >
          <div className="categories-modal-form">
            <label
              className="categories-modal-field"
              htmlFor="category-name-input"
            >
              <span className="categories-modal-label">分类名称</span>
              <input
                id="category-name-input"
                className="categories-modal-input"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="例如：增长策略"
              />
            </label>
            <label
              className="categories-modal-field"
              htmlFor="category-slug-input"
            >
              <span className="categories-modal-label">分类标识</span>
              <input
                id="category-slug-input"
                className="categories-modal-input"
                value={draftSlug}
                onChange={(event) => setDraftSlug(event.target.value)}
                placeholder="例如：growth-strategy"
              />
            </label>
            <label
              className="categories-modal-field"
              htmlFor="category-description-input"
            >
              <span className="categories-modal-label">分类描述</span>
              <textarea
                id="category-description-input"
                className="categories-modal-input categories-modal-textarea"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="说明该分类覆盖的内容范围"
              />
            </label>
            <div className="categories-modal-row">
              <label
                className="categories-modal-field"
                htmlFor="category-level-select"
              >
                <span className="categories-modal-label">分类层级</span>
                <div
                  className="categories-select categories-modal-select"
                  ref={levelSelectRef}
                >
                  <button
                    id="category-level-select"
                    type="button"
                    className="categories-select-trigger"
                    onClick={() =>
                      setIsLevelOpen((current) => !current)
                    }
                    aria-haspopup="listbox"
                    aria-expanded={isLevelOpen}
                  >
                    <span>{activeLevelLabel}</span>
                    <span className="categories-select-icon">▾</span>
                  </button>
                  {isLevelOpen ? (
                    <div className="categories-select-menu" role="listbox">
                      {levelOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={draftLevel === option.value}
                          className={`categories-select-option ${
                            draftLevel === option.value ? 'active' : ''
                          }`}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setDraftLevel(option.value)
                            setIsLevelOpen(false)
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label
                className="categories-modal-field"
                htmlFor="category-parent-select"
              >
                <span className="categories-modal-label">父类选项</span>
                <div
                  className="categories-select categories-modal-select"
                  ref={parentSelectRef}
                >
                  <button
                    id="category-parent-select"
                    type="button"
                    className="categories-select-trigger"
                    onClick={() => {
                      if (draftLevel !== '1') {
                        setIsParentOpen((current) => !current)
                      }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isParentOpen}
                    disabled={draftLevel === '1'}
                  >
                    <span>{activeParentLabel}</span>
                    <span className="categories-select-icon">▾</span>
                  </button>
                  {isParentOpen ? (
                    <div className="categories-select-menu" role="listbox">
                      <button
                        type="button"
                        role="option"
                        aria-selected={draftParentId === 'none'}
                        className={`categories-select-option ${
                          draftParentId === 'none' ? 'active' : ''
                        }`}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setDraftParentId('none')
                          setIsParentOpen(false)
                        }}
                      >
                        无
                      </button>
                      {parentOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={draftParentId === option.value}
                          className={`categories-select-option ${
                            draftParentId === option.value ? 'active' : ''
                          }`}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setDraftParentId(option.value)
                            setIsParentOpen(false)
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
            </div>
            <div className="categories-modal-field">
              <span className="categories-modal-label">是否启用</span>
              <div
                className="categories-modal-radio-group"
                role="radiogroup"
                aria-label="是否启用"
              >
                <label className="categories-modal-radio">
                  <input
                    type="radio"
                    name="category-status"
                    value="enabled"
                    checked={draftStatus === 'enabled'}
                    onChange={() => setDraftStatus('enabled')}
                  />
                  启用
                </label>
                <label className="categories-modal-radio">
                  <input
                    type="radio"
                    name="category-status"
                    value="disabled"
                    checked={draftStatus === 'disabled'}
                    onChange={() => setDraftStatus('disabled')}
                  />
                  停用
                </label>
              </div>
            </div>
          </div>
        </DetailModal>
        <DetailModal
          isOpen={isViewOpen && Boolean(viewCategory)}
          title="分类详情"
          mode="view"
          onClose={handleCloseView}
        >
          {viewCategory ? (
            <div className="categories-modal-form">
              <label className="categories-modal-field">
                <span className="categories-modal-label">分类名称</span>
                <div className="categories-detail-value">
                  {viewCategory.name}
                </div>
              </label>
              <label className="categories-modal-field">
                <span className="categories-modal-label">分类标识</span>
                <div className="categories-detail-value">
                  {viewCategory.slug}
                </div>
              </label>
              <label className="categories-modal-field">
                <span className="categories-modal-label">分类描述</span>
                <div className="categories-detail-value categories-detail-multiline">
                  {viewCategory.description}
                </div>
              </label>
              <div className="categories-modal-row">
                <label className="categories-modal-field">
                  <span className="categories-modal-label">分类层级</span>
                  <div className="categories-detail-value">
                    {viewCategory.level ?? '1'}
                  </div>
                </label>
                <label className="categories-modal-field">
                  <span className="categories-modal-label">父类选项</span>
                  <div className="categories-detail-value">
                    {viewCategory.parentId && viewCategory.parentId !== '0'
                      ? viewCategory.parentId
                      : '无'}
                  </div>
                </label>
              </div>
              <div className="categories-modal-row">
                <label className="categories-modal-field">
                  <span className="categories-modal-label">是否启用</span>
                  <div className="categories-detail-value">
                    {viewCategory.status === 'enabled' ? '启用' : '停用'}
                  </div>
                </label>
                <label className="categories-modal-field">
                  <span className="categories-modal-label">关联文章</span>
                  <div className="categories-detail-value">
                    {String(viewCategory.postCount)}
                  </div>
                </label>
              </div>
              <label className="categories-modal-field">
                <span className="categories-modal-label">更新时间</span>
                <div className="categories-detail-value">
                  {viewCategory.updatedAt}
                </div>
              </label>
            </div>
          ) : null}
        </DetailModal>

        <div className="categories-controls">
          <label className="categories-filter">
            <span className="categories-filter-label">关键词</span>
            <input
              className="categories-filter-input"
              value={pendingQuery}
              onChange={(event) => {
                setPendingQuery(event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="搜索分类名称"
            />
          </label>
          <div className="categories-filter">
            <span className="categories-filter-label">状态</span>
            <div className="categories-select" ref={statusSelectRef}>
              <button
                type="button"
                className="categories-select-trigger"
                onClick={() =>
                  setIsStatusOpen((current) => !current)
                }
                aria-haspopup="listbox"
                aria-expanded={isStatusOpen}
              >
                <span>{activeStatusLabel}</span>
                <span className="categories-select-icon">▾</span>
              </button>
              {isStatusOpen ? (
                <div className="categories-select-menu" role="listbox">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={statusFilter === option.value}
                      className={`categories-select-option ${
                        statusFilter === option.value ? 'active' : ''
                      }`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setStatusFilter(option.value as StatusFilter)
                        setCurrentPage(1)
                        setIsStatusOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="categories-filter-actions">
            <button
              type="button"
              className="categories-filter-button"
              onClick={handleSearch}
            >
              查询
            </button>
            <button
              type="button"
              className="categories-filter-button ghost"
              onClick={handleReset}
            >
              重置
            </button>
          </div>
        </div>

        <div className="categories-selection">
          <div className="categories-selection-info">
            {selectionMessage}
          </div>
        <div className="categories-selection-actions">
          <button
            type="button"
            className={`categories-action-button ${
              pendingAction === 'view' ? 'active' : ''
            }`}
            onClick={handleOpenView}
          >
            查看
          </button>
          <button
            type="button"
            className={`categories-action-button ${
              pendingAction === 'edit' ? 'active' : ''
            }`}
            onClick={handleOpenEdit}
          >
            编辑
          </button>
          <button
            type="button"
            className={`categories-action-button danger ${
              pendingAction === 'delete' ? 'active' : ''
            }`}
            onClick={handleOpenDelete}
          >
            删除
          </button>
          <button
            type="button"
            className="categories-action-button"
            disabled={!activeCategory || togglingId === activeCategory?.id}
            onClick={handleOpenToggle}
          >
            {togglingId === activeCategory?.id
              ? '处理中'
              : activeCategory?.status === 'enabled'
              ? '禁用'
              : '启用'}
          </button>
        </div>
        </div>

        <DataCardGrid
          isEmpty={categories.length === 0}
          emptyMessage="暂无匹配分类"
          className="categories-grid"
        >
          {categories.map((category) => (
            <DataCard
              key={category.id}
              title={category.name}
              description={category.description}
              statusLabel={statusLabels[category.status]}
              statusTone={category.status}
              meta={
                <>
                  <span>文章 {category.postCount}</span>
                  <span>更新 {category.updatedAt}</span>
                  <span className="data-card-chip">{category.slug}</span>
                </>
              }
              onClick={() => handleSelectCategory(category.id)}
              isSelected={selectedCategoryId === category.id}
              ariaPressed={selectedCategoryId === category.id}
            />
          ))}
        </DataCardGrid>
        <div className="categories-pagination">
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
            <label
              className="pagination-label"
              htmlFor="category-page-size"
            >
              每页
            </label>
            <select
              id="category-page-size"
              className="pagination-select"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="pagination-unit">条</span>
            <label
              className="pagination-label"
              htmlFor="category-page-jump"
            >
              跳至
            </label>
            <input
              id="category-page-jump"
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
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="删除分类"
        message={`确认删除「${pendingDeleteCategory?.name ?? ''}」分类？`}
        description="删除后分类不可恢复，请谨慎操作。"
        confirmLabel="确认删除"
        cancelLabel="取消"
        confirmTone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDelete}
      />
      <ConfirmDialog
        isOpen={isToggleOpen && Boolean(pendingToggleCategory)}
        title="状态确认"
        message={
          pendingToggleCategory?.status === 'enabled'
            ? '确认禁用该分类？'
            : '确认启用该分类？'
        }
        description={
          pendingToggleCategory
            ? `分类：${pendingToggleCategory.name}`
            : undefined
        }
        confirmLabel={
          pendingToggleCategory?.status === 'enabled' ? '禁用' : '启用'
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
    </DashboardLayout>
  )
}

export default CategoriesPage
