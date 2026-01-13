import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import './tags-page.css'

const tagList = [
  {
    id: 'tag-001',
    name: '增长',
    description: '增长策略与实验复盘的核心标签',
    status: 'enabled',
  },
  {
    id: 'tag-002',
    name: '设计系统',
    description: '组件库、视觉规范与设计系统规划',
    status: 'enabled',
  },
  {
    id: 'tag-003',
    name: '内容运营',
    description: '选题、排期与内容增长运营方法',
    status: 'enabled',
  },
  {
    id: 'tag-004',
    name: '协作流程',
    description: '跨团队协作与流程优化的经验沉淀',
    status: 'disabled',
  },
  {
    id: 'tag-005',
    name: '数据分析',
    description: '看板搭建、指标拆解与洞察挖掘',
    status: 'enabled',
  },
  {
    id: 'tag-006',
    name: '品牌表达',
    description: '品牌调性与写作风格统一',
    status: 'disabled',
  },
  {
    id: 'tag-007',
    name: '效率工具',
    description: '内容生产与交付效率工具',
    status: 'enabled',
  },
]

function TagsPage() {
  const [pendingName, setPendingName] = useState('')
  const [searchName, setSearchName] = useState('')
  const [tags, setTags] = useState(tagList)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pendingPage, setPendingPage] = useState('1')

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

  const handleDelete = (tagId: string) => {
    setTags((current) => current.filter((tag) => tag.id !== tagId))
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
                  <button type="button" className="tag-action-button">
                    查看
                  </button>
                  <button type="button" className="tag-action-button">
                    编辑
                  </button>
                  <button
                    type="button"
                    className="tag-action-button danger"
                    onClick={() => handleDelete(tag.id)}
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
      </section>
    </DashboardLayout>
  )
}

export default TagsPage
