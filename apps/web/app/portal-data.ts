'use client'

import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

export type PostCategory = {
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

export type CategoryResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: PostCategory[]
}

export type BlogHomeHero = {
  title: string
  subtitle: string
  description: string
  seriesCount: number
  topicCount: number
  postCount: number
}

export type BlogHomeQuickEntry = {
  id: number
  name: string
  slug: string
  description: string
  postCount: number
  icon: string
  themeColor: string
  coverUrl: string
}

export type BlogHomeData = {
  hero: BlogHomeHero
  quickEntries: BlogHomeQuickEntry[]
}

export type BlogHomeResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: BlogHomeData | null
}

export type BlogProfileData = {
  nickname: string
  avatar: string
  sex: number
  birthday: string
  bio: string
  githubUrl: string
  giteeUrl: string
}

export type BlogProfileResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: BlogProfileData | null
}

export type HeaderCategory = {
  id: number
  name: string
  slug: string
  description: string
  postCount: number
  children: HeaderCategory[]
}

export type FrontPost = {
  id: string | number
  title: string
  summary: string
  content: string
  renderedContent?: string
  categoryId: number
  categoryName: string
  categorySlug?: string
  coverUrl?: string
  featured?: number
  pinned?: number
  weight?: number
  publishTime?: string
  updateTime?: string
}

export type FrontPostResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: FrontPost[]
}

export type SearchPost = {
  id: string | number
  title: string
  summary: string
  categoryId?: string | number | null
  categoryName?: string
  categorySlug?: string
  coverUrl?: string
  featured?: number
  pinned?: number
  weight?: number
  publishTime?: string
  updateTime?: string
}

export type SearchPageData = {
  pageNo: number
  pageSize: number
  total: number
  records: SearchPost[]
}

export type SearchPostResponse = {
  success: boolean
  errorCode: string | null
  errorMessage: string | null
  data: SearchPageData | null
}

export type FrontPostPagePayload = {
  pageNo?: number
  pageSize?: number
  keyword?: string
}

export type PostBlock = {
  key: string
  type: 'heading' | 'paragraph'
  level: 1 | 2 | 3
  title: string
  anchorId: string
}

export type TocItem = {
  id: string
  level: 1 | 2 | 3
  title: string
}

export type TopCategoryPostBundle = {
  topCategory: HeaderCategory
  subCategoryList: HeaderCategory[]
  postList: FrontPost[]
}

export type FeaturedPostItem = {
  post: SearchPost
  topCategory: HeaderCategory
  subCategoryId: number
}

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9000').replace(/\/$/, '')
export const THEME_STORAGE_KEY = 'web-theme-mode'

export const applyTheme = (themeMode: ThemeMode) => {
  document.documentElement.setAttribute('data-theme', themeMode)
}

export const requestJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const payload = (await response.json()) as T
  return payload
}

export const toIdKey = (id: string | number | null | undefined) => {
  if (id === null || id === undefined) {
    return ''
  }

  return String(id)
}

const getTotalPostCount = (item: PostCategory): number => {
  const children = Array.isArray(item.children) ? item.children : []
  const childrenPostCount = children.reduce((sum, childItem) => sum + getTotalPostCount(childItem), 0)
  return Math.max(item.postCount, 0) + childrenPostCount
}

export const buildColumnsHref = ({
  topCategoryId,
  subCategoryId,
  postId,
}: {
  topCategoryId?: string | number | null
  subCategoryId?: string | number | null
  postId?: string | number | null
}) => {
  const searchParams = new URLSearchParams()

  if (topCategoryId !== null && topCategoryId !== undefined && String(topCategoryId).trim()) {
    searchParams.set('top-category-id', String(topCategoryId))
  }

  if (subCategoryId !== null && subCategoryId !== undefined && String(subCategoryId).trim()) {
    searchParams.set('sub-category-id', String(subCategoryId))
  }

  if (postId !== null && postId !== undefined && String(postId).trim()) {
    searchParams.set('post-id', String(postId))
  }

  const queryString = searchParams.toString()
  return queryString ? `/columns?${queryString}` : '/columns'
}

export const useTheme = () => {
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

export const useHeaderCategories = () => {
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
        description: item.description,
        postCount: getTotalPostCount(item),
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

export const useBlogHome = () => {
  const [homeData, setHomeData] = useState<BlogHomeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchBlogHome = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const result = await requestJson<BlogHomeResponse>('/app/front/home')

        if (!result.success) {
          setHomeData(null)
          setErrorMessage(result.errorMessage ?? '首页信息接口返回异常')
          return
        }

        setHomeData(result.data)
      } catch {
        setHomeData(null)
        setErrorMessage('首页信息加载失败，请检查服务端接口')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogHome()
  }, [])

  return {
    homeData,
    isLoading,
    errorMessage,
  }
}

export const useBlogProfile = () => {
  const [profileData, setProfileData] = useState<BlogProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchBlogProfile = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const result = await requestJson<BlogProfileResponse>('/app/front/profile')

        if (!result.success) {
          setProfileData(null)
          setErrorMessage(result.errorMessage ?? '个人资料接口返回异常')
          return
        }

        if (!result.data) {
          setProfileData(null)
          setErrorMessage('暂无可展示的个人资料')
          return
        }

        setProfileData(result.data)
      } catch {
        setProfileData(null)
        setErrorMessage('个人资料加载失败，请检查服务端接口')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogProfile()
  }, [])

  return {
    profileData,
    isLoading,
    errorMessage,
  }
}

export const usePortalPostCatalog = (headerCategoryList: HeaderCategory[]) => {
  const [topCategoryBundleList, setTopCategoryBundleList] = useState<TopCategoryPostBundle[]>([])
  const [categoryPostMap, setCategoryPostMap] = useState<Record<string, FrontPost[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchPortalPostCatalog = async () => {
      if (headerCategoryList.length === 0) {
        setTopCategoryBundleList([])
        setCategoryPostMap({})
        return
      }

      const requestCategoryList = headerCategoryList.flatMap((item) =>
        item.children.length > 0 ? item.children : [item]
      )

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

        const nextTopCategoryBundleList = headerCategoryList.map((item) => {
          const subCategoryList = item.children.length > 0 ? item.children : [item]
          const postList = subCategoryList.flatMap((subCategoryItem) => nextCategoryPostMap[toIdKey(subCategoryItem.id)] ?? [])

          return {
            topCategory: item,
            subCategoryList,
            postList,
          }
        })

        setCategoryPostMap(nextCategoryPostMap)
        setTopCategoryBundleList(nextTopCategoryBundleList)
      } catch {
        setTopCategoryBundleList([])
        setCategoryPostMap({})
        setErrorMessage('首页内容加载失败，请检查服务端接口')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPortalPostCatalog()
  }, [headerCategoryList])

  return {
    topCategoryBundleList,
    categoryPostMap,
    isLoading,
    errorMessage,
  }
}

export const useCategoryPostMap = (currentTopCategory: HeaderCategory | null) => {
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

export const parsePostContent = (content: string) => {
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

export const detectHtmlContent = (content: string) => /<([a-z][\w-]*)(\s[^>]*)?>/i.test(content)

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, '\'')
}

const stripHtmlTag = (value: string) => {
  const plainText = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return decodeHtmlEntities(plainText)
}

export const parseHtmlContent = (content: string) => {
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

export const useActiveHeading = (tocList: TocItem[]) => {
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

export const requestSearchPostList = async (keyword: string) => {
  const payload: FrontPostPagePayload = {
    pageNo: 1,
    pageSize: 10,
  }
  const normalizedKeyword = keyword.trim()
  if (normalizedKeyword) {
    payload.keyword = normalizedKeyword
  }

  const result = await requestJson<SearchPostResponse>('/app/front/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

export const requestFrontPostPage = async (payload: FrontPostPagePayload) => {
  const result = await requestJson<SearchPostResponse>('/app/front/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!result.success) {
    return {
      success: false,
      errorMessage: result.errorMessage ?? '文章列表加载失败',
      records: [] as SearchPost[],
    }
  }

  return {
    success: true,
    errorMessage: '',
    records: result.data?.records ?? [],
  }
}

const parseTimeValue = (value: string | undefined) => {
  if (!value) {
    return 0
  }

  return new Date(value.replace(' ', 'T')).getTime() || 0
}

export const useFeaturedPosts = (headerCategoryList: HeaderCategory[]) => {
  const [featuredPostList, setFeaturedPostList] = useState<FeaturedPostItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const findCategorySelection = (postItem: SearchPost) => {
      const categoryId = toIdKey(postItem.categoryId)
      const categorySlug = postItem.categorySlug?.trim()
      const categoryName = postItem.categoryName?.trim()

      for (const topCategory of headerCategoryList) {
        if (categoryId && toIdKey(topCategory.id) === categoryId) {
          return {
            topCategory,
            subCategoryId: topCategory.children[0]?.id ?? topCategory.id,
          }
        }

        if (categorySlug && topCategory.slug === categorySlug) {
          return {
            topCategory,
            subCategoryId: topCategory.children[0]?.id ?? topCategory.id,
          }
        }

        if (categoryName && topCategory.name === categoryName) {
          return {
            topCategory,
            subCategoryId: topCategory.children[0]?.id ?? topCategory.id,
          }
        }

        const matchedSubCategory = topCategory.children.find((childItem) => {
          if (categoryId && toIdKey(childItem.id) === categoryId) {
            return true
          }

          if (categorySlug && childItem.slug === categorySlug) {
            return true
          }

          return Boolean(categoryName && childItem.name === categoryName)
        })

        if (matchedSubCategory) {
          return {
            topCategory,
            subCategoryId: matchedSubCategory.id,
          }
        }
      }

      return null
    }

    const fetchFeaturedPosts = async () => {
      if (headerCategoryList.length === 0) {
        setFeaturedPostList([])
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage('')

        const result = await requestFrontPostPage({
          pageNo: 1,
          pageSize: 50,
        })

        if (!result.success) {
          setFeaturedPostList([])
          setErrorMessage(result.errorMessage)
          return
        }

        const nextFeaturedPostList = result.records
          .filter((item) => item.featured === 1 || item.pinned === 1)
          .sort((a, b) => {
            const pinnedDiff = Number(b.pinned ?? 0) - Number(a.pinned ?? 0)
            if (pinnedDiff !== 0) {
              return pinnedDiff
            }

            const featuredDiff = Number(b.featured ?? 0) - Number(a.featured ?? 0)
            if (featuredDiff !== 0) {
              return featuredDiff
            }

            const weightDiff = Number(b.weight ?? 0) - Number(a.weight ?? 0)
            if (weightDiff !== 0) {
              return weightDiff
            }

            return parseTimeValue(b.publishTime ?? b.updateTime) - parseTimeValue(a.publishTime ?? a.updateTime)
          })
          .map((postItem) => {
            const categorySelection = findCategorySelection(postItem)
            if (!categorySelection) {
              return null
            }

            return {
              post: postItem,
              topCategory: categorySelection.topCategory,
              subCategoryId: categorySelection.subCategoryId,
            }
          })
          .filter((item): item is FeaturedPostItem => item !== null)
          .slice(0, 6)

        setFeaturedPostList(nextFeaturedPostList)
      } catch {
        setFeaturedPostList([])
        setErrorMessage('精选文章加载失败，请检查服务端接口')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedPosts()
  }, [headerCategoryList])

  return {
    featuredPostList,
    isLoading,
    errorMessage,
  }
}
