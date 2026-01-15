import { useEffect, useMemo, useRef, useState } from 'react'
import ConfirmDialog from '../../components/confirm-dialog/ConfirmDialog'
import { DataCard, DataCardGrid } from '../../components/data-card-grid/DataCardGrid'
import DetailModal from '../../components/detail-modal/DetailModal'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
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

type CategoryAction = 'edit' | 'delete' | null

const categoryList: CategoryItem[] = [
  {
    id: 'category-001',
    name: '产品策略',
    description: '产品方向、定位与增长策略梳理',
    status: 'enabled',
    postCount: 18,
    updatedAt: '2024-12-12',
    slug: 'product-strategy',
  },
  {
    id: 'category-002',
    name: '体验设计',
    description: '交互体验与视觉语言的系统化整理',
    status: 'enabled',
    postCount: 12,
    updatedAt: '2024-12-08',
    slug: 'experience-design',
  },
  {
    id: 'category-003',
    name: '内容运营',
    description: '选题、排期与内容增长策略',
    status: 'enabled',
    postCount: 22,
    updatedAt: '2024-11-30',
    slug: 'content-ops',
  },
  {
    id: 'category-004',
    name: '团队协作',
    description: '跨团队协作与流程沉淀',
    status: 'disabled',
    postCount: 6,
    updatedAt: '2024-11-18',
    slug: 'team-collaboration',
  },
  {
    id: 'category-005',
    name: '数据洞察',
    description: '指标拆解、看板与增长洞察',
    status: 'enabled',
    postCount: 9,
    updatedAt: '2024-11-05',
    slug: 'data-insights',
  },
]

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
  edit: '编辑',
  delete: '删除',
}

const statusLabels: Record<CategoryItem['status'], string> = {
  enabled: '启用',
  disabled: '停用',
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(categoryList)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )
  const [pendingAction, setPendingAction] = useState<CategoryAction>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [pendingDeleteCategory, setPendingDeleteCategory] =
    useState<CategoryItem | null>(null)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const statusSelectRef = useRef<HTMLDivElement | null>(null)

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return categories.filter((category) => {
      const matchesQuery = normalizedQuery
        ? category.name.toLowerCase().includes(normalizedQuery)
        : true
      const matchesStatus =
        statusFilter === 'all' ? true : category.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [categories, query, statusFilter])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCategories.length / pageSize))
  }, [filteredCategories.length, pageSize])

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize

    return filteredCategories.slice(startIndex, endIndex)
  }, [currentPage, filteredCategories, pageSize])

  const enabledCount = useMemo(() => {
    return categories.filter((category) => category.status === 'enabled')
      .length
  }, [categories])

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

  const parentOptions = useMemo(() => {
    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }))
  }, [categories])

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

  useEffect(() => {
    if (!isStatusOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        statusSelectRef.current &&
        !statusSelectRef.current.contains(event.target as Node)
      ) {
        setIsStatusOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [isStatusOpen])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter])

  useEffect(() => {
    if (
      selectedCategoryId &&
      !paginatedCategories.some(
        (category) => category.id === selectedCategoryId
      )
    ) {
      setSelectedCategoryId(null)
    }
  }, [paginatedCategories, selectedCategoryId])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    setPendingPage(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    if (draftLevel === '1') {
      setDraftParentId('none')
    }
  }, [draftLevel])

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

    if (nextSelectedId && pendingAction === 'edit') {
      const nextCategory = categories.find(
        (category) => category.id === nextSelectedId
      )

      if (nextCategory) {
        openEditModal(nextCategory)
      }
    }
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

  const handleConfirmDelete = () => {
    if (!pendingDeleteCategory) {
      return
    }

    setCategories((current) =>
      current.filter((category) => category.id !== pendingDeleteCategory.id)
    )
    setSelectedCategoryId(null)
    handleCloseDelete()
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
    resetDraft()
  }

  const handleOpenCreate = () => {
    resetDraft()
    setEditingCategoryId(null)
    setIsEditMode(false)
    setIsFormOpen(true)
    setPendingAction(null)
  }

  const openEditModal = (category: CategoryItem) => {
    setDraftName(category.name)
    setDraftSlug(category.slug)
    setDraftDescription(category.description)
    setDraftLevel(category.level ?? '1')
    setDraftParentId(category.parentId ?? 'none')
    setDraftStatus(category.status)
    setEditingCategoryId(category.id)
    setIsEditMode(true)
    setIsFormOpen(true)
    setPendingAction(null)
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

  const handleCreateCategory = () => {
    const nextName = draftName.trim()
    const nextSlug = draftSlug.trim()
    const nextDescription = draftDescription.trim()
    const nextParentId =
      draftLevel === '1' || draftParentId === 'none'
        ? null
        : draftParentId

    if (!nextName) {
      return
    }

    setCategories((current) => {
      const nextIndex = current.length + 1
      const nextId = `category-${String(nextIndex).padStart(3, '0')}`
      const nextDate = formatDate(new Date())

      return [
        {
          id: nextId,
          name: nextName,
          description: nextDescription || '待补充分类说明',
          status: draftStatus,
          postCount: 0,
          updatedAt: nextDate,
          slug: nextSlug || nextId,
          level: draftLevel,
          parentId: nextParentId,
        },
        ...current,
      ]
    })

    handleCloseForm()
  }

  const handleUpdateCategory = () => {
    if (!editingCategoryId) {
      return
    }

    const nextName = draftName.trim()
    const nextSlug = draftSlug.trim()
    const nextDescription = draftDescription.trim()
    const nextParentId =
      draftLevel === '1' || draftParentId === 'none'
        ? null
        : draftParentId

    if (!nextName) {
      return
    }

    setCategories((current) =>
      current.map((category) =>
        category.id === editingCategoryId
          ? {
              ...category,
              name: nextName,
              description: nextDescription || '待补充分类说明',
              status: draftStatus,
              slug: nextSlug || category.slug || category.id,
              level: draftLevel,
              parentId: nextParentId,
              updatedAt: formatDate(new Date()),
            }
          : category
      )
    )

    handleCloseForm()
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
            <span className="categories-count">
              启用 {enabledCount} / {categories.length}
            </span>
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
                <select
                  id="category-level-select"
                  className="categories-modal-input"
                  value={draftLevel}
                  onChange={(event) =>
                    setDraftLevel(event.target.value as CategoryLevel)
                  }
                >
                  {levelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="categories-modal-field"
                htmlFor="category-parent-select"
              >
                <span className="categories-modal-label">父类选项</span>
                <select
                  id="category-parent-select"
                  className="categories-modal-input"
                  value={draftParentId}
                  onChange={(event) => setDraftParentId(event.target.value)}
                  disabled={draftLevel === '1'}
                >
                  <option value="none">无</option>
                  {parentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

        <div className="categories-controls">
          <label className="categories-filter">
            <span className="categories-filter-label">关键词</span>
            <input
              className="categories-filter-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索分类名称"
            />
          </label>
          <label className="categories-filter">
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
                      onClick={() => {
                        setStatusFilter(option.value as StatusFilter)
                        setIsStatusOpen(false)
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

        <div className="categories-selection">
          <div className="categories-selection-info">
            {selectionMessage}
          </div>
          <div className="categories-selection-actions">
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
          </div>
        </div>

        <DataCardGrid
          isEmpty={filteredCategories.length === 0}
          emptyMessage="暂无匹配分类"
        >
          {paginatedCategories.map((category) => (
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
            第 {currentPage} / {totalPages} 页 · 共{' '}
            {filteredCategories.length} 条
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
    </DashboardLayout>
  )
}

export default CategoriesPage
