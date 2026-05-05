'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import styles from './page.module.css'

type ThemeMode = 'light' | 'dark'

type PostCategory = {
  id: number
  categoryCode: string
  name: string
  slug: string
  parentId: number
  treePath: string
  level: number
  sortNo: number
  description: string
  enabled: number
  postCount: number
  createTime: string
  updateTime: string
  children?: PostCategory[]
}

type CategoryResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: PostCategory[]
}

type HeaderCategory = {
  id: number
  name: string
  slug: string
  children: HeaderCategory[]
}

type FrontPost = {
  id: string | number
  title: string
  summary: string
  content: string
  renderedContent?: string
  categoryId: number
  categoryName: string
}

type FrontPostResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: FrontPost[]
}

type SearchPost = {
  id: string | number
  title: string
  summary: string
  categoryId?: string | number | null
  categoryName?: string
  categorySlug?: string
}

type SearchPageData = {
  pageNo: number
  pageSize: number
  total: number
  records: SearchPost[]
}

type SearchPostResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: SearchPageData | null
}

type PostBlock = {
  key: string
  type: 'heading' | 'paragraph'
  level: 1 | 2 | 3
  title: string
  anchorId: string
}

type TocItem = {
  id: string
  level: 1 | 2 | 3
  title: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9000').replace(/\/$/, '')
const THEME_STORAGE_KEY = 'web-theme-mode'

const applyTheme = (themeMode: ThemeMode) => {
  document.documentElement.setAttribute('data-theme', themeMode)
}

const requestJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const payload = (await response.json()) as T
  return payload
}

const toIdKey = (id: string | number | null | undefined) => {
  if (id === null || id === undefined) {
    return ''
  }
  return String(id)
}

const useTheme = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const nextTheme: ThemeMode =
      savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'

    setThemeMode(nextTheme)
    applyTheme(nextTheme)
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) {
      return
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    applyTheme(themeMode)
  }, [isMounted, themeMode])

  return {
    isMounted,
    themeMode,
    toggleTheme: () => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light')),
  }
}

const useSidebarState = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return {
    isDrawerOpen,
    closeDrawer: () => setIsDrawerOpen(false),
    toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
  }
}

const useHeaderCategories = () => {
  const [categoryList, setCategoryList] = useState<HeaderCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const mapHeaderCategory = (item: PostCategory): HeaderCategory => {
      const children = Array.isArray(item.children) ? item.children : []
      const enabledChildren = children
        .filter((childItem) => childItem.enabled === 1)
        .sort((a, b) => a.sortNo - b.sortNo)
        .map((childItem) => mapHeaderCategory(childItem))

      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        children: enabledChildren,
      }
    }

    const fetchCategoryList = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const result = await requestJson<CategoryResponse>('/app/front/category')

        if (!result.success) {
          setCategoryList([])
          setErrorMessage(result.errorMessage ?? '分类接口返回异常')
          return
        }

        const levelOneCategoryList = result.data
          .filter((item) => item.enabled === 1 && item.level === 1)
          .sort((a, b) => a.sortNo - b.sortNo)
          .map((item) => mapHeaderCategory(item))

        if (levelOneCategoryList.length > 0) {
          setCategoryList(levelOneCategoryList)
          return
        }

        const enabledCategoryList = result.data
          .filter((item) => item.enabled === 1)
          .sort((a, b) => a.sortNo - b.sortNo)
          .map((item) => mapHeaderCategory(item))

        setCategoryList(enabledCategoryList)
      } catch {
        setCategoryList([])
        setErrorMessage('分类数据加载失败，请检查服务端接口')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryList()
  }, [])

  return { categoryList, isLoading, errorMessage }
}

const useCategoryPostMap = (currentTopCategory: HeaderCategory | null) => {
  const [categoryPostMap, setCategoryPostMap] = useState<Record<string, FrontPost[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchCategoryPostMap = async () => {
      if (!currentTopCategory) {
        setCategoryPostMap({})
        return
      }

      const requestCategoryList =
        currentTopCategory.children.length > 0 ? currentTopCategory.children : [currentTopCategory]

      try {
        setIsLoading(true)
        setErrorMessage('')

        const resultList = await Promise.all(
          requestCategoryList.map(async (item) => {
            const result = await requestJson<FrontPostResponse>(`/app/front/post?categoryId=${item.id}`)

            if (!result.success) {
              return { id: item.id, postList: [] as FrontPost[] }
            }

            return { id: item.id, postList: result.data }
          })
        )

        const nextCategoryPostMap: Record<string, FrontPost[]> = {}
        resultList.forEach((item) => {
          nextCategoryPostMap[toIdKey(item.id)] = item.postList
        })

        setCategoryPostMap(nextCategoryPostMap)
      } catch {
        setCategoryPostMap({})
        setErrorMessage('文章数据加载失败，请检查服务端接口')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryPostMap()
  }, [currentTopCategory])

  return { categoryPostMap, isLoading, errorMessage }
}

const parsePostContent = (content: string) => {
  const lineList = content
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  let headingIndex = 0
  const postBlockList: PostBlock[] = lineList.map((item, index) => {
    const headingMatch = item.match(/^(#{1,6})\s+(.+)$/)
    if (!headingMatch) {
      return {
        key: `paragraph-${index}`,
        type: 'paragraph',
        level: 2,
        title: item,
        anchorId: '',
      }
    }

    const headingMark = headingMatch[1] ?? '#'
    const headingTitle = headingMatch[2] ?? ''
    const rawLevel = headingMark.length
    const level: 1 | 2 | 3 = rawLevel <= 1 ? 1 : rawLevel === 2 ? 2 : 3
    const title = headingTitle.trim()
    headingIndex += 1

    return {
      key: `heading-${headingIndex}`,
      type: 'heading',
      level,
      title,
      anchorId: `section-${headingIndex}`,
    }
  })

  const tocList: TocItem[] = postBlockList
    .filter((item) => item.type === 'heading')
    .map((item) => ({
      id: item.anchorId,
      level: item.level,
      title: item.title,
    }))

  return { postBlockList, tocList }
}

const detectHtmlContent = (content: string) => /<([a-z][\w-]*)(\s[^>]*)?>/i.test(content)

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

const stripHtmlTag = (value: string) => {
  const plainText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return decodeHtmlEntities(plainText)
}

const parseHtmlContent = (content: string) => {
  let headingIndex = 0
  const tocList: TocItem[] = []

  const htmlContent = content.replace(/<(h[1-6])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (match, tagName, attrs = '', innerHtml) => {
    const numericLevel = Number(String(tagName).slice(1))
    if (numericLevel !== 1 && numericLevel !== 2 && numericLevel !== 3) {
      return match
    }

    headingIndex += 1
    const anchorId = `section-${headingIndex}`
    const level: 1 | 2 | 3 = numericLevel === 1 ? 1 : numericLevel === 2 ? 2 : 3
    const title = stripHtmlTag(String(innerHtml)) || `章节 ${headingIndex}`
    tocList.push({ id: anchorId, level, title })

    const attrText = String(attrs).replace(/\sid=(['"]).*?\1/gi, '')
    return `<${tagName}${attrText} id="${anchorId}">${innerHtml}</${tagName}>`
  })

  return { htmlContent, tocList }
}

const useActiveHeading = (tocList: TocItem[]) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string>(tocList[0]?.id ?? '')

  useEffect(() => {
    if (tocList.length === 0) {
      setActiveHeadingId('')
      return
    }

    const firstTocItem = tocList[0]
    if (!firstTocItem) {
      return
    }

    setActiveHeadingId(firstTocItem.id)

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleSection?.target?.id) {
          return
        }

        setActiveHeadingId(visibleSection.target.id)
      },
      {
        rootMargin: '-100px 0px -60% 0px',
        threshold: [0.2, 0.6, 1],
      }
    )

    tocList.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [tocList])

  return activeHeadingId
}

const HomePage = (): JSX.Element => {
  useTheme()
  const { isDrawerOpen, closeDrawer, toggleDrawer } = useSidebarState()
  const { categoryList: headerCategoryList, isLoading: isCategoryLoading, errorMessage: categoryErrorMessage } = useHeaderCategories()

  const [selectedTopCategoryId, setSelectedTopCategoryId] = useState<number | null>(null)
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [collapsedCategoryMap, setCollapsedCategoryMap] = useState<Record<number, boolean>>({})
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResultList, setSearchResultList] = useState<SearchPost[]>([])
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false)
  const [activeSearchResultIndex, setActiveSearchResultIndex] = useState(-1)
  const [isSearchSuggestLoading, setIsSearchSuggestLoading] = useState(false)
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false)
  const [isSearchEmpty, setIsSearchEmpty] = useState(false)
  const [searchErrorMessage, setSearchErrorMessage] = useState('')
  const [searchSuggestErrorMessage, setSearchSuggestErrorMessage] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const searchPanelRef = useRef<HTMLDivElement | null>(null)
  const categoryPostCacheRef = useRef<Record<string, FrontPost[]>>({})
  const postCategoryCacheRef = useRef<Record<string, string>>({})
  const searchRequestSequenceRef = useRef(0)

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

  const filteredCategoryPostMap = useMemo(() => categoryPostMap, [categoryPostMap])

  const flatPostList = useMemo(() => {
    return sidebarCategoryList.flatMap((item) => filteredCategoryPostMap[toIdKey(item.id)] ?? [])
  }, [filteredCategoryPostMap, sidebarCategoryList])

  const selectedPost = useMemo(
    () => flatPostList.find((item) => toIdKey(item.id) === selectedPostId) ?? flatPostList[0] ?? null,
    [flatPostList, selectedPostId]
  )

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

  const applySearchEmptyState = () => {
    setIsSearchEmpty(true)
    setIsSearchPanelOpen(false)
    setActiveSearchResultIndex(-1)
    setSelectedTopCategoryId(null)
    setSelectedSubCategoryId(null)
    setSelectedPostId(null)

    const nextCollapsedCategoryMap: Record<number, boolean> = {}
    headerCategoryList.forEach((topCategory) => {
      if (topCategory.children.length > 0) {
        topCategory.children.forEach((childItem) => {
          nextCollapsedCategoryMap[childItem.id] = true
        })
        return
      }

      nextCollapsedCategoryMap[topCategory.id] = true
    })

    setCollapsedCategoryMap(nextCollapsedCategoryMap)
  }

  const findCategorySelectionByCategoryId = (targetCategoryId: string) => {
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
  }

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

  const requestSearchPostList = async (keyword: string) => {
    const result = await requestJson<SearchPostResponse>('/app/front/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageNo: 1,
        pageSize: 10,
        keyword,
      }),
    })

    if (!result.success) {
      return {
        success: false,
        errorMessage: result.errorMessage ?? '搜索失败，请稍后重试',
        records: [] as SearchPost[],
      }
    }

    return {
      success: true,
      errorMessage: '',
      records: result.data?.records ?? [],
    }
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
    setCollapsedCategoryMap((prev) => ({
      ...prev,
      [matchedCategorySelection.subCategoryId]: false,
    }))
    setSelectedPostId(searchPostId || null)
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
    if (isSearchEmpty || headerCategoryList.length === 0 || selectedTopCategoryId) {
      return
    }

    const defaultCategory = headerCategoryList.find((item) => item.slug === 'java') ?? headerCategoryList[0]
    if (!defaultCategory) {
      return
    }

    setSelectedTopCategoryId(defaultCategory.id)
    setSelectedSubCategoryId(defaultCategory.children[0]?.id ?? defaultCategory.id)
  }, [headerCategoryList, isSearchEmpty, selectedTopCategoryId])

  useEffect(() => {
    if (flatPostList.length === 0) {
      setSelectedPostId(null)
      return
    }

    setSelectedPostId((prev) => {
      if (flatPostList.some((item) => toIdKey(item.id) === prev)) {
        return prev
      }
      const firstPost = flatPostList[0]
      return firstPost ? toIdKey(firstPost.id) : null
    })
  }, [flatPostList])

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
  }, [sidebarCategoryList, selectedSubCategoryId])

  useEffect(() => {
    if (!selectedSubCategoryId) {
      return
    }

    const selectedSubPostList = filteredCategoryPostMap[toIdKey(selectedSubCategoryId)] ?? []
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
  }, [filteredCategoryPostMap, selectedSubCategoryId])

  return (
    <div className={styles['doc-page']}>
      <header className={styles['doc-header']}>
        <div className={styles['header-inner']}>
          <div className={styles['header-left']}>
            <button
              className={styles['menu-trigger']}
              type='button'
              onClick={toggleDrawer}
              aria-label='打开帖子导航'
            >
              <span className={styles['menu-trigger-icon']} aria-hidden='true' />
            </button>
            <Link href='/profile' className={styles['avatar-link']} aria-label='进入个人资料'>
              <span className={styles['avatar-image']}>GL</span>
            </Link>
            <nav className={styles['header-nav']}>
              {headerCategoryList.map((item) => (
                <div key={item.id} className={styles['nav-item']}>
                  <button
                    type='button'
                    className={`${styles['nav-link']} ${selectedTopCategoryId === item.id ? styles['nav-link-active'] : ''}`}
                    onClick={() => {
                      clearSearchState()
                      setSelectedTopCategoryId(item.id)
                      setSelectedSubCategoryId(item.children[0]?.id ?? item.id)
                    }}
                  >
                    {item.name}
                  </button>
                  {item.children.length > 0 ? (
                    <ul className={styles['nav-children']}>
                      {item.children.map((childItem) => (
                        <li key={childItem.id}>
                          <button
                            type='button'
                            className={`${styles['nav-children-link']} ${selectedSubCategoryId === childItem.id ? styles['nav-children-link-active'] : ''}`}
                            onClick={() => {
                              clearSearchState()
                              setSelectedTopCategoryId(item.id)
                              setSelectedSubCategoryId(childItem.id)
                            }}
                          >
                            {childItem.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </nav>
          </div>

          <div className={styles['header-right']}>
            <div className={styles['search-box']} ref={searchPanelRef}>
              <label className={styles['search-wrap']}>
                <span className={styles['search-icon']} aria-hidden='true'>
                  ⌕
                </span>
                <input
                  ref={searchInputRef}
                  className={styles['search-input']}
                  type='search'
                  placeholder='搜索文章'
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
            <button
              type='button'
              className={styles['search-action']}
              onClick={onSearch}
            >
              {isSearchSubmitting ? '定位中...' : '搜索'}
            </button>
          </div>
        </div>
      </header>

      <div className={styles['doc-container']}>
        <aside className={styles['doc-sidebar']}>
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
                  {(filteredCategoryPostMap[toIdKey(item.id)] ?? []).map((postItem) => (
                    <li
                      key={postItem.id}
                      className={`${styles['post-sidebar-list-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-list-item-active'] : ''}`}
                    >
                      <button
                        type='button'
                        className={`${styles['post-sidebar-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-item-active'] : ''}`}
                        onClick={() => {
                          clearSearchState()
                          setSelectedSubCategoryId(item.id)
                          setSelectedPostId(toIdKey(postItem.id))
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

        <main className={styles['doc-main']}>
          <article className={styles['doc-article']}>
            {isCategoryLoading || isPostLoading || isSearchSubmitting ? <p className={styles['post-empty']}>加载中...</p> : null}

            {!isCategoryLoading && categoryErrorMessage ? (
              <p className={styles['post-error']}>{categoryErrorMessage}</p>
            ) : null}

            {!isPostLoading && postErrorMessage ? <p className={styles['post-error']}>{postErrorMessage}</p> : null}

            {!isCategoryLoading && !categoryErrorMessage && !isSearchEmpty && selectedPost ? (
              <section className={styles['post-content-section']}>
                <h1 className={styles['post-content-title']}>{selectedPost.title}</h1>
                <p className={styles['post-content-summary']}>{selectedPost.summary}</p>

                {isHtmlPostContent && htmlContent ? (
                  <div className={styles['post-content-body']} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                ) : postBlockList.length > 0 ? (
                  <div className={styles['post-content-body']}>
                    {postBlockList.map((item) => (
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
                    ))}
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

        <aside className={styles['doc-toc']}>
          <h2 className={styles['toc-title']}>目录</h2>
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

      <footer className={styles['doc-footer']}>
        <div className={styles['footer-inner']}>
          <span>© 2017 Gao Lei</span>
          <span>写给未来的自己，也写给正在路上的你</span>
        </div>
      </footer>

      <aside className={`${styles['mobile-drawer']} ${isDrawerOpen ? styles['mobile-drawer-open'] : ''}`}>
        <div className={styles['drawer-head']}>
          <span>帖子列表</span>
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
                {(filteredCategoryPostMap[toIdKey(item.id)] ?? []).map((postItem) => (
                  <li
                    key={`drawer-${postItem.id}`}
                    className={`${styles['post-sidebar-list-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-list-item-active'] : ''}`}
                  >
                    <button
                      type='button'
                      className={`${styles['post-sidebar-item']} ${selectedPostId === toIdKey(postItem.id) ? styles['post-sidebar-item-active'] : ''}`}
                      onClick={() => {
                        clearSearchState()
                        setSelectedSubCategoryId(item.id)
                        setSelectedPostId(toIdKey(postItem.id))
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

export default HomePage
