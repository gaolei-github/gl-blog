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
  id: number
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

type PostBlock = {
  key: string
  type: 'heading' | 'paragraph'
  level: 2 | 3
  title: string
  anchorId: string
}

type TocItem = {
  id: string
  level: 2 | 3
  title: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9000').replace(/\/$/, '')
const THEME_STORAGE_KEY = 'web-theme-mode'

const applyTheme = (themeMode: ThemeMode) => {
  document.documentElement.setAttribute('data-theme', themeMode)
}

const requestJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`)
  const payload = (await response.json()) as T
  return payload
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
  const [categoryPostMap, setCategoryPostMap] = useState<Record<number, FrontPost[]>>({})
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

        const nextCategoryPostMap: Record<number, FrontPost[]> = {}
        resultList.forEach((item) => {
          nextCategoryPostMap[item.id] = item.postList
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
    const level: 2 | 3 = rawLevel >= 3 ? 3 : 2
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
    if (numericLevel !== 2 && numericLevel !== 3) {
      return match
    }

    headingIndex += 1
    const anchorId = `section-${headingIndex}`
    const level: 2 | 3 = numericLevel === 2 ? 2 : 3
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
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [collapsedCategoryMap, setCollapsedCategoryMap] = useState<Record<number, boolean>>({})
  const [searchKeyword, setSearchKeyword] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

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

  const filteredCategoryPostMap = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    if (!keyword) {
      return categoryPostMap
    }

    const nextMap: Record<number, FrontPost[]> = {}
    Object.keys(categoryPostMap).forEach((categoryId) => {
      const numericCategoryId = Number(categoryId)
      const postList = categoryPostMap[numericCategoryId] ?? []

      nextMap[numericCategoryId] = postList.filter((item) => {
        const title = item.title?.toLowerCase() ?? ''
        const summary = item.summary?.toLowerCase() ?? ''
        return title.includes(keyword) || summary.includes(keyword)
      })
    })

    return nextMap
  }, [categoryPostMap, searchKeyword])

  const flatPostList = useMemo(() => {
    return sidebarCategoryList.flatMap((item) => filteredCategoryPostMap[item.id] ?? [])
  }, [filteredCategoryPostMap, sidebarCategoryList])

  const selectedPost = useMemo(
    () => flatPostList.find((item) => item.id === selectedPostId) ?? flatPostList[0] ?? null,
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

  useEffect(() => {
    if (headerCategoryList.length === 0 || selectedTopCategoryId) {
      return
    }

    const defaultCategory = headerCategoryList.find((item) => item.slug === 'java') ?? headerCategoryList[0]
    if (!defaultCategory) {
      return
    }

    setSelectedTopCategoryId(defaultCategory.id)
    setSelectedSubCategoryId(defaultCategory.children[0]?.id ?? defaultCategory.id)
  }, [headerCategoryList, selectedTopCategoryId])

  useEffect(() => {
    if (flatPostList.length === 0) {
      setSelectedPostId(null)
      return
    }

    setSelectedPostId((prev) => {
      if (flatPostList.some((item) => item.id === prev)) {
        return prev
      }
      const firstPost = flatPostList[0]
      return firstPost ? firstPost.id : null
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

    const selectedSubPostList = filteredCategoryPostMap[selectedSubCategoryId] ?? []
    if (selectedSubPostList.length === 0) {
      return
    }

    setSelectedPostId((prev) => {
      if (selectedSubPostList.some((item) => item.id === prev)) {
        return prev
      }
      const firstPost = selectedSubPostList[0]
      return firstPost ? firstPost.id : null
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
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </label>
            <button
              type='button'
              className={styles['search-action']}
              onClick={() => searchInputRef.current?.focus()}
            >
              搜索
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
                  {(filteredCategoryPostMap[item.id] ?? []).map((postItem) => (
                    <li
                      key={postItem.id}
                      className={`${styles['post-sidebar-list-item']} ${selectedPost?.id === postItem.id ? styles['post-sidebar-list-item-active'] : ''}`}
                    >
                      <button
                        type='button'
                        className={`${styles['post-sidebar-item']} ${selectedPost?.id === postItem.id ? styles['post-sidebar-item-active'] : ''}`}
                        onClick={() => {
                          setSelectedSubCategoryId(item.id)
                          setSelectedPostId(postItem.id)
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
            {isCategoryLoading || isPostLoading ? <p className={styles['post-empty']}>加载中...</p> : null}

            {!isCategoryLoading && categoryErrorMessage ? (
              <p className={styles['post-error']}>{categoryErrorMessage}</p>
            ) : null}

            {!isPostLoading && postErrorMessage ? <p className={styles['post-error']}>{postErrorMessage}</p> : null}

            {!isCategoryLoading && !categoryErrorMessage && selectedPost ? (
              <section className={styles['post-content-section']}>
                <h1 className={styles['post-content-title']}>{selectedPost.title}</h1>
                <p className={styles['post-content-summary']}>{selectedPost.summary}</p>

                {isHtmlPostContent && htmlContent ? (
                  <div className={styles['post-content-body']} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                ) : postBlockList.length > 0 ? (
                  <div className={styles['post-content-body']}>
                    {postBlockList.map((item) => (
                      item.type === 'heading' ? (
                        item.level === 2 ? (
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

            {!isCategoryLoading && !isPostLoading && !categoryErrorMessage && !selectedPost ? (
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
                {(filteredCategoryPostMap[item.id] ?? []).map((postItem) => (
                  <li
                    key={`drawer-${postItem.id}`}
                    className={`${styles['post-sidebar-list-item']} ${selectedPost?.id === postItem.id ? styles['post-sidebar-list-item-active'] : ''}`}
                  >
                    <button
                      type='button'
                      className={`${styles['post-sidebar-item']} ${selectedPost?.id === postItem.id ? styles['post-sidebar-item-active'] : ''}`}
                      onClick={() => {
                        setSelectedSubCategoryId(item.id)
                        setSelectedPostId(postItem.id)
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
