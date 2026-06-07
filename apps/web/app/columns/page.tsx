'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import styles from '../page.module.css'
import {
  buildColumnsHref,
  detectHtmlContent,
  parseHtmlContent,
  parsePostContent,
  requestJson,
  requestSearchPostList,
  toIdKey,
  type FrontPost,
  type FrontPostResponse,
  type SearchPost,
  useActiveHeading,
  useCategoryPostMap,
  useHeaderCategories,
  useTheme,
} from '../portal-data'

const ColumnsPage = (): JSX.Element => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { themeMode, toggleTheme } = useTheme()
  const { categoryList: headerCategoryList, isLoading: isCategoryLoading, errorMessage: categoryErrorMessage } = useHeaderCategories()

  const [selectedTopCategoryId, setSelectedTopCategoryId] = useState<number | null>(null)
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [collapsedCategoryMap, setCollapsedCategoryMap] = useState<Record<number, boolean>>({})
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResultList, setSearchResultList] = useState<SearchPost[]>([])
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [activeSearchResultIndex, setActiveSearchResultIndex] = useState(-1)
  const [isSearchSuggestLoading, setIsSearchSuggestLoading] = useState(false)
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false)
  const [searchErrorMessage, setSearchErrorMessage] = useState('')
  const [searchSuggestErrorMessage, setSearchSuggestErrorMessage] = useState('')
  const [isSearchEmpty, setIsSearchEmpty] = useState(false)

  const searchPanelRef = useRef<HTMLDivElement | null>(null)
  const categoryPostCacheRef = useRef<Record<string, FrontPost[]>>({})
  const postCategoryCacheRef = useRef<Record<string, string>>({})
  const searchRequestSequenceRef = useRef(0)

  const queryTopCategoryId = searchParams.get('top-category-id')
  const querySubCategoryId = searchParams.get('sub-category-id')
  const queryPostId = searchParams.get('post-id')

  const currentTopCategory = useMemo(() => {
    return headerCategoryList.find((item) => item.id === selectedTopCategoryId) ?? null
  }, [headerCategoryList, selectedTopCategoryId])

  const { categoryPostMap, isLoading: isPostLoading, errorMessage: postErrorMessage } = useCategoryPostMap(currentTopCategory)

  const sidebarCategoryList = useMemo(() => {
    if (!currentTopCategory) {
      return []
    }

    return currentTopCategory.children.length > 0 ? currentTopCategory.children : [currentTopCategory]
  }, [currentTopCategory])

  const flatPostList = useMemo(() => {
    return sidebarCategoryList.flatMap((item) => categoryPostMap[toIdKey(item.id)] ?? [])
  }, [categoryPostMap, sidebarCategoryList])

  const selectedPost = useMemo(
    () => flatPostList.find((item) => toIdKey(item.id) === selectedPostId) ?? flatPostList[0] ?? null,
    [flatPostList, selectedPostId]
  )
  const currentSubCategory = useMemo(() => {
    return sidebarCategoryList.find((item) => item.id === selectedSubCategoryId) ?? null
  }, [selectedSubCategoryId, sidebarCategoryList])
  const headerNote = currentTopCategory ? `${currentTopCategory.name} 专栏阅读区` : '技术专栏与知识沉淀'
  const readerTitle = selectedPost?.title ?? currentTopCategory?.name ?? '请选择专栏'
  const readerMeta = selectedPost?.summary?.trim() || '从导航或搜索中选择内容'
  const shouldShowSubCategory = currentSubCategory && currentSubCategory.id !== currentTopCategory?.id

  const postRawContent = selectedPost?.content?.trim() ? selectedPost.content : selectedPost?.renderedContent ?? ''
  const isHtmlPostContent = useMemo(() => detectHtmlContent(postRawContent), [postRawContent])

  const { postBlockList, tocList, htmlContent } = useMemo(() => {
    if (!postRawContent) {
      return { postBlockList: [], tocList: [], htmlContent: '' }
    }

    if (isHtmlPostContent) {
      const { htmlContent: nextHtmlContent, tocList: nextTocList } = parseHtmlContent(postRawContent)
      return { postBlockList: [], tocList: nextTocList, htmlContent: nextHtmlContent }
    }

    const { postBlockList: nextPostBlockList, tocList: nextTocList } = parsePostContent(postRawContent)
    return { postBlockList: nextPostBlockList, tocList: nextTocList, htmlContent: '' }
  }, [isHtmlPostContent, postRawContent])

  const activeHeadingId = useActiveHeading(tocList)

  const clearSearchState = () => {
    setIsSearchEmpty(false)
    setSearchErrorMessage('')
    setSearchSuggestErrorMessage('')
    setIsSearchPanelOpen(false)
    setActiveSearchResultIndex(-1)
  }

  const clearSearchMessage = () => {
    setSearchErrorMessage('')
    setSearchSuggestErrorMessage('')
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
  }

  const findCategorySelectionByCategoryId = useCallback((targetCategoryId: string) => {
    for (const topCategory of headerCategoryList) {
      if (toIdKey(topCategory.id) === targetCategoryId) {
        return {
          topCategoryId: topCategory.id,
          subCategoryId: topCategory.children[0]?.id ?? topCategory.id,
        }
      }

      const matchedSubCategory = topCategory.children.find((childItem) => toIdKey(childItem.id) === targetCategoryId)
      if (matchedSubCategory) {
        return {
          topCategoryId: topCategory.id,
          subCategoryId: matchedSubCategory.id,
        }
      }
    }

    return null
  }, [headerCategoryList])

  const findCategorySelectionBySearchPost = (postItem: SearchPost) => {
    const categoryId = toIdKey(postItem.categoryId)
    if (categoryId) {
      const matchedCategorySelection = findCategorySelectionByCategoryId(categoryId)
      if (matchedCategorySelection) {
        return matchedCategorySelection
      }
    }

    const categorySlug = postItem.categorySlug?.trim()
    if (categorySlug) {
      for (const topCategory of headerCategoryList) {
        if (topCategory.slug === categorySlug) {
          return {
            topCategoryId: topCategory.id,
            subCategoryId: topCategory.children[0]?.id ?? topCategory.id,
          }
        }

        const matchedSubCategory = topCategory.children.find((childItem) => childItem.slug === categorySlug)
        if (matchedSubCategory) {
          return {
            topCategoryId: topCategory.id,
            subCategoryId: matchedSubCategory.id,
          }
        }
      }
    }

    const categoryName = postItem.categoryName?.trim()
    if (categoryName) {
      for (const topCategory of headerCategoryList) {
        if (topCategory.name === categoryName) {
          return {
            topCategoryId: topCategory.id,
            subCategoryId: topCategory.children[0]?.id ?? topCategory.id,
          }
        }

        const matchedSubCategory = topCategory.children.find((childItem) => childItem.name === categoryName)
        if (matchedSubCategory) {
          return {
            topCategoryId: topCategory.id,
            subCategoryId: matchedSubCategory.id,
          }
        }
      }
    }

    return null
  }

  const findCachedCategoryIdByPostId = (postId: string) => {
    const cachedCategoryIdList = Object.keys(categoryPostCacheRef.current)
    for (const categoryId of cachedCategoryIdList) {
      const postList = categoryPostCacheRef.current[categoryId] ?? []
      if (postList.some((item) => toIdKey(item.id) === postId)) {
        return categoryId
      }
    }

    return ''
  }

  const resolveCategorySelectionByPostId = async (postId: string) => {
    if (!postId) {
      return null
    }

    const cachedCategoryIdByPostId = postCategoryCacheRef.current[postId]
    if (cachedCategoryIdByPostId) {
      const cachedSelection = findCategorySelectionByCategoryId(cachedCategoryIdByPostId)
      if (cachedSelection) {
        return cachedSelection
      }
    }

    const categoryIdList = headerCategoryList.flatMap((topCategory) =>
      topCategory.children.length > 0 ? topCategory.children.map((childItem) => toIdKey(childItem.id)) : [toIdKey(topCategory.id)]
    )

    if (categoryIdList.length === 0) {
      return null
    }

    const cachedCategoryId = findCachedCategoryIdByPostId(postId)
    if (cachedCategoryId) {
      postCategoryCacheRef.current[postId] = cachedCategoryId
      return findCategorySelectionByCategoryId(cachedCategoryId)
    }

    for (const categoryId of categoryIdList) {
      if (categoryPostCacheRef.current[categoryId]) {
        continue
      }

      const result = await requestJson<FrontPostResponse>(`/app/front/post?categoryId=${categoryId}`)
      if (!result.success) {
        categoryPostCacheRef.current[categoryId] = []
        continue
      }

      categoryPostCacheRef.current[categoryId] = result.data

      const hasMatchedPost = result.data.some((item) => toIdKey(item.id) === postId)
      if (hasMatchedPost) {
        postCategoryCacheRef.current[postId] = categoryId
        return findCategorySelectionByCategoryId(categoryId)
      }
    }

    return null
  }

  const syncRouteState = ({
    topCategoryId,
    subCategoryId,
    postId,
  }: {
    topCategoryId?: string | number | null
    subCategoryId?: string | number | null
    postId?: string | number | null
  }) => {
    router.replace(
      buildColumnsHref({
        topCategoryId,
        subCategoryId,
        postId,
      }),
      { scroll: false }
    )
  }

  const applySearchEmptyState = () => {
    setIsSearchEmpty(true)
    setSelectedTopCategoryId(null)
    setSelectedSubCategoryId(null)
    setSelectedPostId(null)
  }

  const openCategory = (topCategoryId: number, subCategoryId: number) => {
    clearSearchState()
    setSelectedTopCategoryId(topCategoryId)
    setSelectedSubCategoryId(subCategoryId)
    setCollapsedCategoryMap((prev) => ({
      ...prev,
      [subCategoryId]: false,
    }))
    syncRouteState({
      topCategoryId,
      subCategoryId,
      postId: null,
    })
  }

  const openPost = (topCategoryId: number, subCategoryId: number, postId: string | number) => {
    clearSearchState()
    setSelectedTopCategoryId(topCategoryId)
    setSelectedSubCategoryId(subCategoryId)
    setSelectedPostId(toIdKey(postId))
    setCollapsedCategoryMap((prev) => ({
      ...prev,
      [subCategoryId]: false,
    }))
    syncRouteState({
      topCategoryId,
      subCategoryId,
      postId,
    })
  }

  const applySearchSelection = async (selectedSearchPost: SearchPost) => {
    let matchedCategorySelection = findCategorySelectionBySearchPost(selectedSearchPost)
    const searchPostId = toIdKey(selectedSearchPost.id)
    if (!matchedCategorySelection && searchPostId) {
      matchedCategorySelection = await resolveCategorySelectionByPostId(searchPostId)
    }

    if (!matchedCategorySelection) {
      applySearchEmptyState()
      return false
    }

    setIsSearchEmpty(false)
    setSelectedTopCategoryId(matchedCategorySelection.topCategoryId)
    setSelectedSubCategoryId(matchedCategorySelection.subCategoryId)
    setSelectedPostId(searchPostId || null)
    setCollapsedCategoryMap((prev) => ({
      ...prev,
      [matchedCategorySelection.subCategoryId]: false,
    }))
    syncRouteState({
      topCategoryId: matchedCategorySelection.topCategoryId,
      subCategoryId: matchedCategorySelection.subCategoryId,
      postId: searchPostId,
    })
    return true
  }

  const submitSearchByPost = async (selectedSearchPost: SearchPost) => {
    clearSearchState()

    try {
      setIsSearchSubmitting(true)
      await applySearchSelection(selectedSearchPost)
    } catch {
      setIsSearchEmpty(true)
      setSearchErrorMessage('搜索失败，请检查服务端接口')
    } finally {
      setIsSearchSubmitting(false)
    }
  }

  const onSearch = async () => {
    const keyword = searchKeyword.trim()
    clearSearchState()

    if (!keyword) {
      return
    }

    const activeResult = searchResultList[activeSearchResultIndex]
    if (isSearchPanelOpen && activeResult) {
      await submitSearchByPost(activeResult)
      return
    }

    const firstResult = searchResultList[0]
    if (firstResult) {
      await submitSearchByPost(firstResult)
      return
    }

    try {
      setIsSearchSubmitting(true)
      const searchResult = await requestSearchPostList(keyword)
      if (!searchResult.success) {
        setIsSearchEmpty(true)
        setSearchErrorMessage(searchResult.errorMessage)
        return
      }

      const firstMatchedPost = searchResult.records[0]
      if (!firstMatchedPost) {
        applySearchEmptyState()
        return
      }

      await applySearchSelection(firstMatchedPost)
    } catch {
      setIsSearchEmpty(true)
      setSearchErrorMessage('搜索失败，请检查服务端接口')
    } finally {
      setIsSearchSubmitting(false)
      setIsSearchPanelOpen(false)
      setActiveSearchResultIndex(-1)
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

  useEffect(() => {
    Object.keys(categoryPostMap).forEach((categoryId) => {
      categoryPostCacheRef.current[categoryId] = categoryPostMap[categoryId] ?? []
    })
  }, [categoryPostMap])

  useEffect(() => {
    if (headerCategoryList.length === 0 || selectedTopCategoryId) {
      return
    }

    const selectionByQuerySubCategoryId = querySubCategoryId ? findCategorySelectionByCategoryId(querySubCategoryId) : null
    const selectionByQueryTopCategoryId = queryTopCategoryId ? findCategorySelectionByCategoryId(queryTopCategoryId) : null
    const defaultCategory = headerCategoryList.find((item) => item.slug === 'java') ?? headerCategoryList[0]
    const fallbackSelection = defaultCategory
      ? {
          topCategoryId: defaultCategory.id,
          subCategoryId: defaultCategory.children[0]?.id ?? defaultCategory.id,
        }
      : null
    const targetSelection = selectionByQuerySubCategoryId ?? selectionByQueryTopCategoryId ?? fallbackSelection

    if (!targetSelection) {
      return
    }

    setSelectedTopCategoryId(targetSelection.topCategoryId)
    setSelectedSubCategoryId(targetSelection.subCategoryId)
    if (queryPostId) {
      setSelectedPostId(queryPostId)
    }
  }, [findCategorySelectionByCategoryId, headerCategoryList, queryPostId, querySubCategoryId, queryTopCategoryId, selectedTopCategoryId])

  useEffect(() => {
    if (sidebarCategoryList.length === 0) {
      setCollapsedCategoryMap({})
      return
    }

    setCollapsedCategoryMap((prev) => {
      const nextMap: Record<number, boolean> = {}
      sidebarCategoryList.forEach((item) => {
        nextMap[item.id] = prev[item.id] ?? selectedSubCategoryId !== item.id
      })
      return nextMap
    })
  }, [selectedSubCategoryId, sidebarCategoryList])

  useEffect(() => {
    if (flatPostList.length === 0) {
      setSelectedPostId(null)
      return
    }

    setSelectedPostId((prev) => {
      if (flatPostList.some((item) => toIdKey(item.id) === prev)) {
        return prev
      }

      if (queryPostId && flatPostList.some((item) => toIdKey(item.id) === queryPostId)) {
        return queryPostId
      }

      const firstPost = flatPostList[0]
      return firstPost ? toIdKey(firstPost.id) : null
    })
  }, [flatPostList, queryPostId])

  useEffect(() => {
    if (!selectedSubCategoryId) {
      return
    }

    const selectedSubPostList = categoryPostMap[toIdKey(selectedSubCategoryId)] ?? []
    if (selectedSubPostList.length === 0) {
      return
    }

    setSelectedPostId((prev) => {
      if (selectedSubPostList.some((item) => toIdKey(item.id) === prev)) {
        return prev
      }

      const firstPost = selectedSubPostList[0]
      return firstPost ? toIdKey(firstPost.id) : null
    })
  }, [categoryPostMap, selectedSubCategoryId])

  useEffect(() => {
    if (!selectedTopCategoryId || !selectedSubCategoryId) {
      return
    }

    router.replace(
      `${pathname}${buildColumnsHref({
        topCategoryId: selectedTopCategoryId,
        subCategoryId: selectedSubCategoryId,
        postId: selectedPostId,
      }).replace('/columns', '')}`,
      { scroll: false }
    )
  }, [pathname, router, selectedPostId, selectedSubCategoryId, selectedTopCategoryId])

  return (
    <div className={styles['portal-page']}>
      <header className={styles['portal-header']}>
        <div className={styles['portal-header-inner']}>
          <div className={styles['portal-brand']}>
            <Link href='/' className={styles['brand-mark']} aria-label='返回首页'>
              <span>GL</span>
            </Link>
            <div className={styles['brand-copy']}>
              <strong>GL Blog</strong>
              <span className={styles['columns-header-note']}>{headerNote}</span>
            </div>
          </div>

          <nav className={styles['portal-nav']}>
            {headerCategoryList.map((item) => (
              <button
                key={item.id}
                type='button'
                className={`${styles['portal-nav-item']} ${selectedTopCategoryId === item.id ? styles['portal-nav-item-active'] : ''}`}
                onClick={() => {
                  openCategory(item.id, item.children[0]?.id ?? item.id)
                }}
              >
                {item.name}
              </button>
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

      <main className={styles['columns-main']}>
        <section className={styles['reader-section']}>
          <div className={styles['reader-toolbar']}>
            <div className={styles['reader-toolbar-copy']}>
              <nav className={styles['reader-breadcrumb']} aria-label='面包屑导航'>
                <Link href='/' className={styles['reader-breadcrumb-link']}>
                  首页
                </Link>
                {currentTopCategory ? (
                  <>
                    <span className={styles['reader-breadcrumb-separator']}>/</span>
                    <span>{currentTopCategory.name}</span>
                  </>
                ) : null}
                {shouldShowSubCategory ? (
                  <>
                    <span className={styles['reader-breadcrumb-separator']}>/</span>
                    <span>{currentSubCategory.name}</span>
                  </>
                ) : null}
                {selectedPost ? (
                  <>
                    <span className={styles['reader-breadcrumb-separator']}>/</span>
                    <span className={styles['reader-breadcrumb-current']}>{selectedPost.title}</span>
                  </>
                ) : null}
              </nav>
              <strong>{readerTitle}</strong>
              <span>{readerMeta}</span>
            </div>

            <div className={styles['reader-toolbar-actions']}>
              <button
                type='button'
                className={styles['reader-drawer-trigger']}
                onClick={() => setIsDrawerOpen((prev) => !prev)}
              >
                打开文章导航
              </button>
            </div>
          </div>

          <div className={styles['reader-layout']}>
            <aside className={styles['reader-sidebar']}>
              <section className={styles['post-sidebar']}>
                {sidebarCategoryList.map((item) => (
                  <section
                    key={item.id}
                    className={`${styles['sub-category-group']} ${selectedSubCategoryId === item.id ? styles['sub-category-group-active'] : ''}`}
                  >
                    <button
                      type='button'
                      className={styles['sub-category-head']}
                      onClick={() => {
                        clearSearchState()
                        setSelectedSubCategoryId(item.id)
                        setCollapsedCategoryMap((prev) => ({
                          ...prev,
                          [item.id]: !(prev[item.id] ?? false),
                        }))
                        closeDrawer()
                      }}
                    >
                      <span className={styles['sub-category-title']}>{item.name}</span>
                      <span
                        className={`${styles['sub-category-arrow']} ${collapsedCategoryMap[item.id] ? '' : styles['sub-category-arrow-open']}`}
                      />
                    </button>

                    <ul
                      className={`${styles['post-sidebar-list']} ${collapsedCategoryMap[item.id] ? styles['post-sidebar-list-collapsed'] : ''}`}
                    >
                      {(categoryPostMap[toIdKey(item.id)] ?? []).map((postItem) => (
                        <li
                          key={postItem.id}
                          className={`${styles['post-sidebar-list-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-list-item-active'] : ''}`}
                        >
                          <button
                            type='button'
                            className={`${styles['post-sidebar-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-item-active'] : ''}`}
                            onClick={() => {
                              openPost(currentTopCategory?.id ?? item.id, item.id, postItem.id)
                              closeDrawer()
                            }}
                          >
                            <span className={styles['post-sidebar-item-title']}>{postItem.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </section>
            </aside>

            <main className={styles['reader-main']}>
              <article className={styles['doc-article']}>
                {isCategoryLoading || isPostLoading || isSearchSubmitting ? <p className={styles['post-empty']}>加载中...</p> : null}
                {!isCategoryLoading && categoryErrorMessage ? <p className={styles['post-error']}>{categoryErrorMessage}</p> : null}
                {!isPostLoading && postErrorMessage ? <p className={styles['post-error']}>{postErrorMessage}</p> : null}

                {!isCategoryLoading && !categoryErrorMessage && !isSearchEmpty && selectedPost ? (
                  <section className={styles['post-content-section']}>
                    <span className={styles['article-kicker']}>{selectedPost.categoryName || currentTopCategory?.name}</span>
                    <h1 className={styles['post-content-title']}>{selectedPost.title}</h1>
                    <p className={styles['post-content-summary']}>{selectedPost.summary}</p>

                    {isHtmlPostContent && htmlContent ? (
                      <div className={styles['post-content-body']} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : postBlockList.length > 0 ? (
                      <div className={styles['post-content-body']}>
                        {postBlockList.map((item) =>
                          item.type === 'heading' ? (
                            item.level === 1 ? (
                              <h1 key={item.key} id={item.anchorId}>
                                {item.title}
                              </h1>
                            ) : item.level === 2 ? (
                              <h2 key={item.key} id={item.anchorId}>
                                {item.title}
                              </h2>
                            ) : (
                              <h3 key={item.key} id={item.anchorId}>
                                {item.title}
                              </h3>
                            )
                          ) : (
                            <p key={item.key}>{item.title}</p>
                          )
                        )}
                      </div>
                    ) : (
                      <p className={styles['post-empty']}>该文章暂无内容</p>
                    )}
                  </section>
                ) : null}

                {!isCategoryLoading && !isPostLoading && !isSearchSubmitting && !categoryErrorMessage && searchErrorMessage ? (
                  <p className={styles['post-error']}>{searchErrorMessage}</p>
                ) : null}
                {!isCategoryLoading && !isPostLoading && !isSearchSubmitting && !categoryErrorMessage && isSearchEmpty ? (
                  <p className={styles['post-empty']}>无相关内容</p>
                ) : null}
                {!isCategoryLoading && !isPostLoading && !isSearchSubmitting && !categoryErrorMessage && !isSearchEmpty && !selectedPost ? (
                  <p className={styles['post-empty']}>当前分类暂无文章</p>
                ) : null}
              </article>
            </main>

            <aside className={styles['reader-toc']}>
              <h2 className={styles['toc-title']}>章节导航</h2>
              {tocList.length > 0 ? (
                <ul className={styles['toc-list']}>
                  {tocList.map((item) => (
                    <li
                      key={item.id}
                      className={`${styles['toc-item']} ${item.level === 3 ? styles['toc-item-level-3'] : ''}`}
                    >
                      <a
                        href={`#${item.id}`}
                        className={`${styles['toc-link']} ${activeHeadingId === item.id ? styles['toc-link-active'] : ''}`}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles['post-empty']}>暂无目录</p>
              )}
            </aside>
          </div>
        </section>
      </main>

      <aside className={`${styles['mobile-drawer']} ${isDrawerOpen ? styles['mobile-drawer-open'] : ''}`}>
        <div className={styles['drawer-head']}>
          <span>文章导航</span>
          <button type='button' onClick={closeDrawer} className={styles['drawer-close']}>
            关闭
          </button>
        </div>

        <nav className={styles['drawer-nav']}>
          {sidebarCategoryList.map((item) => (
            <section
              key={`drawer-sub-${item.id}`}
              className={`${styles['sub-category-group']} ${selectedSubCategoryId === item.id ? styles['sub-category-group-active'] : ''}`}
            >
              <button
                type='button'
                className={styles['sub-category-head']}
                onClick={() => {
                  clearSearchState()
                  setSelectedSubCategoryId(item.id)
                  setCollapsedCategoryMap((prev) => ({
                    ...prev,
                    [item.id]: !(prev[item.id] ?? false),
                  }))
                }}
              >
                <span className={styles['sub-category-title']}>{item.name}</span>
                <span
                  className={`${styles['sub-category-arrow']} ${collapsedCategoryMap[item.id] ? '' : styles['sub-category-arrow-open']}`}
                />
              </button>

              <ul
                className={`${styles['post-sidebar-list']} ${collapsedCategoryMap[item.id] ? styles['post-sidebar-list-collapsed'] : ''}`}
              >
                {(categoryPostMap[toIdKey(item.id)] ?? []).map((postItem) => (
                  <li
                    key={`drawer-${postItem.id}`}
                    className={`${styles['post-sidebar-list-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-list-item-active'] : ''}`}
                  >
                    <button
                      type='button'
                      className={`${styles['post-sidebar-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-item-active'] : ''}`}
                      onClick={() => {
                        openPost(currentTopCategory?.id ?? item.id, item.id, postItem.id)
                        closeDrawer()
                      }}
                    >
                      <span className={styles['post-sidebar-item-title']}>{postItem.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </aside>
    </div>
  )
}

export default ColumnsPage
