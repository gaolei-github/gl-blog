'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import styles from './page.module.css'
import {
  buildColumnsHref,
  requestSearchPostList,
  toIdKey,
  type SearchPost,
  useBlogHome,
  useFeaturedPosts,
  useHeaderCategories,
  usePortalPostCatalog,
  useTheme,
} from './portal-data'

const HomePage = (): JSX.Element => {
  const router = useRouter()
  const { themeMode, toggleTheme } = useTheme()
  const { homeData, isLoading: isHomeLoading, errorMessage: homeErrorMessage } = useBlogHome()
  const { categoryList: headerCategoryList, isLoading: isCategoryLoading, errorMessage: categoryErrorMessage } = useHeaderCategories()
  const {
    topCategoryBundleList,
    isLoading: isPortalLoading,
    errorMessage: portalErrorMessage,
  } = usePortalPostCatalog(headerCategoryList)
  const {
    featuredPostList,
    isLoading: isFeaturedLoading,
    errorMessage: featuredErrorMessage,
  } = useFeaturedPosts(headerCategoryList)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResultList, setSearchResultList] = useState<SearchPost[]>([])
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [activeSearchResultIndex, setActiveSearchResultIndex] = useState(-1)
  const [isSearchSuggestLoading, setIsSearchSuggestLoading] = useState(false)
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false)
  const [searchErrorMessage, setSearchErrorMessage] = useState('')
  const [searchSuggestErrorMessage, setSearchSuggestErrorMessage] = useState('')

  const searchPanelRef = useRef<HTMLDivElement | null>(null)
  const searchRequestSequenceRef = useRef(0)

  const portalSummary = useMemo(() => {
    const totalSeries = topCategoryBundleList.length
    const totalSubCategories = topCategoryBundleList.reduce((sum, item) => sum + item.subCategoryList.length, 0)
    const totalPosts = topCategoryBundleList.reduce((sum, item) => sum + item.postList.length, 0)

    return {
      totalSeries,
      totalSubCategories,
      totalPosts,
    }
  }, [topCategoryBundleList])

  const learningPathList = useMemo(() => {
    return topCategoryBundleList
      .filter((item) => item.postList.length > 0)
      .slice(0, 4)
  }, [topCategoryBundleList])

  const heroCategoryList = useMemo(() => {
    return headerCategoryList.slice(0, 4)
  }, [headerCategoryList])

  const heroTitle = homeData?.hero.title?.trim() || 'GL Blog'
  const heroSubtitle = homeData?.hero.subtitle?.trim() || '技术专栏与知识沉淀'
  const heroSeriesCount = homeData?.hero.seriesCount ?? portalSummary.totalSeries
  const heroTopicCount = homeData?.hero.topicCount ?? portalSummary.totalSubCategories
  const heroPostCount = homeData?.hero.postCount ?? portalSummary.totalPosts
  const quickEntryList = homeData?.quickEntries ?? []
  const topQuickEntryList = quickEntryList.length > 0 ? quickEntryList : heroCategoryList
  const visibleQuickEntryList = topQuickEntryList.slice(0, 4)
  const hiddenQuickEntryCount = Math.max(topQuickEntryList.length - visibleQuickEntryList.length, 0)
  const learningPathSectionIndex = featuredPostList.length > 0 ? '03' : '02'

  const clearSearchMessage = () => {
    setSearchErrorMessage('')
    setSearchSuggestErrorMessage('')
  }

  const openColumnsPage = ({
    topCategoryId,
    subCategoryId,
    postId,
  }: {
    topCategoryId?: string | number | null
    subCategoryId?: string | number | null
    postId?: string | number | null
  }) => {
    router.push(
      buildColumnsHref({
        topCategoryId,
        subCategoryId,
        postId,
      })
    )
  }

  const submitSearchByPost = (selectedSearchPost: {
    id: string | number
    categoryId?: string | number | null
  }) => {
    setIsSearchPanelOpen(false)
    setActiveSearchResultIndex(-1)
    openColumnsPage({
      subCategoryId: selectedSearchPost.categoryId ?? null,
      postId: selectedSearchPost.id,
    })
  }

  const onSearch = async () => {
    const keyword = searchKeyword.trim()
    clearSearchMessage()

    if (!keyword) {
      return
    }

    const activeResult = searchResultList[activeSearchResultIndex]
    if (isSearchPanelOpen && activeResult) {
      submitSearchByPost(activeResult)
      return
    }

    const firstResult = searchResultList[0]
    if (firstResult) {
      submitSearchByPost(firstResult)
      return
    }

    try {
      setIsSearchSubmitting(true)
      const searchResult = await requestSearchPostList(keyword)
      if (!searchResult.success) {
        setSearchErrorMessage(searchResult.errorMessage)
        return
      }

      const firstMatchedPost = searchResult.records[0]
      if (!firstMatchedPost) {
        setSearchErrorMessage('无相关内容')
        return
      }

      submitSearchByPost(firstMatchedPost)
    } catch {
      setSearchErrorMessage('搜索失败，请检查服务端接口')
    } finally {
      setIsSearchSubmitting(false)
    }
  }

  useEffect(() => {
    const keyword = searchKeyword.trim()
    if (!keyword) {
      setSearchResultList([])
      setIsSearchPanelOpen(false)
      setActiveSearchResultIndex(-1)
      setIsSearchSuggestLoading(false)
      setSearchSuggestErrorMessage('')
      return
    }

    const nextRequestSequence = searchRequestSequenceRef.current + 1
    searchRequestSequenceRef.current = nextRequestSequence
    const timerId = window.setTimeout(async () => {
      try {
        setIsSearchSuggestLoading(true)
        setSearchSuggestErrorMessage('')

        const searchResult = await requestSearchPostList(keyword)
        if (searchRequestSequenceRef.current !== nextRequestSequence) {
          return
        }

        if (!searchResult.success) {
          setSearchResultList([])
          setIsSearchPanelOpen(true)
          setActiveSearchResultIndex(-1)
          setSearchSuggestErrorMessage(searchResult.errorMessage)
          return
        }

        setSearchResultList(searchResult.records)
        setIsSearchPanelOpen(true)
        setActiveSearchResultIndex(searchResult.records.length > 0 ? 0 : -1)
      } catch {
        if (searchRequestSequenceRef.current !== nextRequestSequence) {
          return
        }

        setSearchResultList([])
        setIsSearchPanelOpen(true)
        setActiveSearchResultIndex(-1)
        setSearchSuggestErrorMessage('搜索建议加载失败')
      } finally {
        if (searchRequestSequenceRef.current === nextRequestSequence) {
          setIsSearchSuggestLoading(false)
        }
      }
    }, 260)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [searchKeyword])

  useEffect(() => {
    const onWindowPointerDown = (event: MouseEvent) => {
      const panelElement = searchPanelRef.current
      if (!panelElement) {
        return
      }

      if (panelElement.contains(event.target as Node)) {
        return
      }

      setIsSearchPanelOpen(false)
      setActiveSearchResultIndex(-1)
    }

    window.addEventListener('mousedown', onWindowPointerDown)
    return () => {
      window.removeEventListener('mousedown', onWindowPointerDown)
    }
  }, [])

  return (
    <div className={styles['portal-page']}>
      <header className={styles['portal-header']}>
        <div className={styles['portal-header-inner']}>
          <div className={styles['portal-brand']}>
            <Link href='/profile' className={styles['brand-mark']} aria-label='进入个人资料'>
              <span>GL</span>
            </Link>
            <div className={styles['brand-copy']}>
              <strong>{heroTitle}</strong>
              <span>{heroSubtitle}</span>
            </div>
          </div>

          <nav className={styles['portal-nav']}>
            {headerCategoryList.map((item) => (
              <Link
                key={item.id}
                href={buildColumnsHref({
                  topCategoryId: item.id,
                  subCategoryId: item.children[0]?.id ?? item.id,
                })}
                className={styles['portal-nav-item']}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className={styles['portal-actions']}>
            <div className={styles['search-box']} ref={searchPanelRef}>
              <label className={styles['search-wrap']}>
                <span className={styles['search-icon']} aria-hidden='true'>
                  ⌕
                </span>
                <input
                  className={styles['search-input']}
                  type='search'
                  placeholder='搜索文章或专题'
                  value={searchKeyword}
                  onFocus={() => {
                    if (!searchKeyword.trim()) {
                      return
                    }

                    setIsSearchPanelOpen(true)
                  }}
                  onChange={(event) => {
                    clearSearchMessage()
                    setSearchKeyword(event.target.value)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      setIsSearchPanelOpen(true)
                      setActiveSearchResultIndex((prev) => {
                        if (searchResultList.length === 0) {
                          return -1
                        }

                        return prev < searchResultList.length - 1 ? prev + 1 : 0
                      })
                      return
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault()
                      setIsSearchPanelOpen(true)
                      setActiveSearchResultIndex((prev) => {
                        if (searchResultList.length === 0) {
                          return -1
                        }

                        return prev > 0 ? prev - 1 : searchResultList.length - 1
                      })
                      return
                    }

                    if (event.key === 'Escape') {
                      setIsSearchPanelOpen(false)
                      setActiveSearchResultIndex(-1)
                      return
                    }

                    if (event.key !== 'Enter') {
                      return
                    }

                    event.preventDefault()
                    onSearch()
                  }}
                />
              </label>

              {isSearchPanelOpen ? (
                <section className={styles['search-panel']}>
                  {isSearchSuggestLoading ? <p className={styles['search-panel-tip']}>搜索中...</p> : null}
                  {!isSearchSuggestLoading && searchSuggestErrorMessage ? (
                    <p className={styles['search-panel-tip']}>{searchSuggestErrorMessage}</p>
                  ) : null}
                  {!isSearchSuggestLoading && !searchSuggestErrorMessage && searchResultList.length === 0 ? (
                    <p className={styles['search-panel-tip']}>无相关内容</p>
                  ) : null}
                  {!isSearchSuggestLoading && !searchSuggestErrorMessage && searchResultList.length > 0 ? (
                    <ul className={styles['search-result-list']}>
                      {searchResultList.map((item, index) => (
                        <li key={toIdKey(item.id)}>
                          <button
                            type='button'
                            className={`${styles['search-result-item']} ${index === activeSearchResultIndex ? styles['search-result-item-active'] : ''}`}
                            onMouseEnter={() => setActiveSearchResultIndex(index)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              submitSearchByPost(item)
                            }}
                          >
                            <span className={styles['search-result-title']}>{item.title}</span>
                            <span className={styles['search-result-meta']}>
                              {item.categoryName?.trim() ? item.categoryName : '未匹配分类'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ) : null}
            </div>

            <button type='button' className={styles['header-action-button']} onClick={onSearch}>
              {isSearchSubmitting ? '定位中...' : '搜索'}
            </button>
            <button type='button' className={styles['theme-toggle']} onClick={toggleTheme}>
              {themeMode === 'dark' ? '浅色' : '深色'}
            </button>
          </div>
        </div>
      </header>

      <main className={styles['portal-main']}>
        <section className={styles['hero-section']}>
          <div className={styles['hero-copy']}>
            <h1 className={styles['hero-title']}>{heroTitle}</h1>
            {homeData?.hero.description?.trim() ? (
              <p className={styles['hero-description']}>{homeData.hero.description}</p>
            ) : null}
            <div className={styles['hero-stat-list']}>
              <span className={styles['hero-stat-item']}>
                <strong>{heroSeriesCount}</strong>
                <span>专栏</span>
              </span>
              <span className={styles['hero-stat-item']}>
                <strong>{heroTopicCount}</strong>
                <span>主题</span>
              </span>
              <span className={styles['hero-stat-item']}>
                <strong>{heroPostCount}</strong>
                <span>文章</span>
              </span>
            </div>

            <div className={styles['hero-actions']}>
              <Link href='/columns' className={styles['hero-primary-action']}>
                进入专栏馆
              </Link>
              <a href='#series-section' className={styles['hero-secondary-action']}>
                查看全部专栏
              </a>
            </div>
          </div>

          <div className={styles['hero-panel']}>
            <div className={styles['quick-entry-list']}>
              {visibleQuickEntryList.map((item) => {
                const themeColor = 'themeColor' in item ? item.themeColor : '#2563eb'
                const postCount = 'postCount' in item ? item.postCount : 0
                const description = 'description' in item ? item.description : ''

                return (
                  <Link
                    key={`hero-${item.id}`}
                    href={buildColumnsHref({
                      subCategoryId: item.id,
                    })}
                    className={styles['quick-entry-card']}
                    style={{ borderLeftColor: themeColor }}
                  >
                    <span className={styles['quick-entry-mark']} style={{ backgroundColor: themeColor }}>
                      {item.name.slice(0, 1)}
                    </span>
                    <span className={styles['quick-entry-copy']}>
                      <strong>{item.name}</strong>
                      {description?.trim() ? <span>{description}</span> : null}
                    </span>
                    <span className={styles['quick-entry-count']}>{postCount}</span>
                  </Link>
                )
              })}
            </div>
            {hiddenQuickEntryCount > 0 ? (
              <Link href='/columns' className={styles['quick-entry-footer']}>
                <span>还有 {hiddenQuickEntryCount} 个入口</span>
                <strong>查看全部</strong>
              </Link>
            ) : null}
          </div>
        </section>

        {(homeErrorMessage || categoryErrorMessage || portalErrorMessage || featuredErrorMessage || searchErrorMessage) && !isCategoryLoading ? (
          <section className={styles['status-section']}>
            {homeErrorMessage ? <p className={styles['post-error']}>{homeErrorMessage}</p> : null}
            {categoryErrorMessage ? <p className={styles['post-error']}>{categoryErrorMessage}</p> : null}
            {portalErrorMessage ? <p className={styles['post-error']}>{portalErrorMessage}</p> : null}
            {featuredErrorMessage ? <p className={styles['post-error']}>{featuredErrorMessage}</p> : null}
            {searchErrorMessage ? <p className={styles['post-error']}>{searchErrorMessage}</p> : null}
          </section>
        ) : null}

        <section id='series-section' className={styles['content-section']}>
          <div className={styles['section-heading']}>
            <div className={styles['section-heading-copy']}>
              <span className={styles['section-index']}>01</span>
              <h2 className={styles['section-title']}>专栏</h2>
              <span className={styles['section-title-backdrop']}>Columns</span>
            </div>
          </div>

          <div className={styles['series-grid']}>
            {topCategoryBundleList.map((item, index) => {
              const highlightPost = item.postList[0]
              const previewSubCategory = item.subCategoryList[0]

              return (
                <article key={item.topCategory.id} className={styles['series-card']}>
                  <div className={styles['series-card-head']}>
                    <span className={styles['series-card-index']}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles['series-card-count']}>{item.postList.length} 篇文章</span>
                  </div>

                  <h3 className={styles['series-card-title']}>{item.topCategory.name}</h3>
                  {item.topCategory.description?.trim() ? (
                    <p className={styles['series-card-description']}>{item.topCategory.description}</p>
                  ) : null}

                  <div className={styles['series-card-meta']}>
                    <span>{item.subCategoryList.length} 个子专题</span>
                    <span>{previewSubCategory?.name ?? item.topCategory.name}</span>
                  </div>

                  {highlightPost ? (
                    <Link
                      href={buildColumnsHref({
                        topCategoryId: item.topCategory.id,
                        subCategoryId: previewSubCategory?.id ?? item.topCategory.id,
                        postId: highlightPost.id,
                      })}
                      className={styles['series-highlight']}
                    >
                      <strong className={styles['series-highlight-title']}>{highlightPost.title}</strong>
                      {highlightPost.summary?.trim() ? (
                        <span className={styles['series-highlight-summary']}>{highlightPost.summary}</span>
                      ) : null}
                    </Link>
                  ) : (
                    <div className={styles['series-highlight']}>
                      <strong className={styles['series-highlight-title']}>该专栏暂未发布文章</strong>
                    </div>
                  )}

                  <div className={styles['series-card-actions']}>
                    <Link
                      href={buildColumnsHref({
                        topCategoryId: item.topCategory.id,
                        subCategoryId: previewSubCategory?.id ?? item.topCategory.id,
                      })}
                      className={styles['series-primary-action']}
                    >
                      浏览专栏
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {featuredPostList.length > 0 ? (
          <section className={styles['content-section']}>
            <div className={styles['section-heading']}>
              <div className={styles['section-heading-copy']}>
                <span className={styles['section-index']}>02</span>
                <h2 className={styles['section-title']}>精选文章</h2>
                <span className={styles['section-title-backdrop']}>Featured</span>
              </div>
            </div>

            <div className={styles['feature-grid']}>
              {featuredPostList.map((item) => (
                <Link
                  key={`feature-${item.topCategory.id}-${item.post.id}`}
                  href={buildColumnsHref({
                    topCategoryId: item.topCategory.id,
                    subCategoryId: item.subCategoryId,
                    postId: item.post.id,
                  })}
                  className={styles['feature-card']}
                >
                  <span className={styles['feature-tag']}>{item.post.categoryName?.trim() || item.topCategory.name}</span>
                  <strong className={styles['feature-title']}>{item.post.title}</strong>
                  {item.post.summary?.trim() ? (
                    <p className={styles['feature-summary']}>{item.post.summary}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles['content-section']}>
          <div className={styles['section-heading']}>
            <div className={styles['section-heading-copy']}>
              <span className={styles['section-index']}>{learningPathSectionIndex}</span>
              <h2 className={styles['section-title']}>学习路径</h2>
              <span className={styles['section-title-backdrop']}>Path</span>
            </div>
          </div>

          <div className={styles['path-grid']}>
            {learningPathList.map((item) => {
              const firstSubCategory = item.subCategoryList[0] ?? item.topCategory
              const firstPost = item.postList[0]

              return (
                <article key={`path-${item.topCategory.id}`} className={styles['path-card']}>
                  <h3 className={styles['path-title']}>{item.topCategory.name}</h3>
                  {item.topCategory.description?.trim() ? (
                    <p className={styles['path-description']}>{item.topCategory.description}</p>
                  ) : null}
                  <div className={styles['path-footer']}>
                    <span>{item.postList.length} 篇文章</span>
                    <Link
                      href={buildColumnsHref({
                        topCategoryId: item.topCategory.id,
                        subCategoryId: firstSubCategory.id,
                        postId: firstPost?.id ?? null,
                      })}
                      className={styles['path-action']}
                    >
                      开始阅读
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {isHomeLoading || isPortalLoading || isCategoryLoading || isFeaturedLoading ? (
          <section className={styles['status-section']}>
            <p className={styles['post-empty']}>加载中...</p>
          </section>
        ) : null}
      </main>

      <footer className={styles['portal-footer']}>
        <div className={styles['portal-footer-inner']}>
          <span>© 2017 Gao Lei</span>
          <span>把文章写成专栏，把经验整理成可重复访问的知识资产</span>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
