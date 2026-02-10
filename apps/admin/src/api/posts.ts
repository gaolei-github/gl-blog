import { deleteJson, getJson, postJson, putJson } from './http'

type ApiResponse<T> = {
  success: boolean
  errorCode: string | number | null
  errorMessage: string | null
  data: T
}

export type PostPayload = {
  userId: number
  slug: string
  title: string
  subtitle?: string
  summary?: string
  contentType?: 1 | 2 | 3
  content: string
  coverUrl?: string
  status: 0 | 1 | 2 | 3 | 4
  visibility?: 0 | 1 | 2 | 3
  allowComment?: 0 | 1
  featured?: 0 | 1
  pinned?: 0 | 1
  weight?: number
  sourceType?: 0 | 1 | 2
  sourceUrl?: string
  extJson?: string
  publishTime: string
  tagIds?: string[]
  categoryId?: string
}

export type PostPagePayload = {
  pageNo?: number
  pageSize?: number
  keyword?: string
  status?: number
}

export type PostRecord = {
  id: number
  authorId?: number
  authorName?: string
  postCode?: string
  slug: string
  title: string
  subtitle?: string
  summary?: string
  contentType?: number
  content?: string
  renderedContent?: string
  coverUrl?: string
  status?: number
  visibility?: number
  allowComment?: number
  commentCount?: number
  likeCount?: number
  viewCount?: number
  wordCount?: number
  readingMinutes?: number
  publishTime?: string
  scheduledPublishTime?: string | null
  lastPublishedTime?: string | null
  featured?: number
  pinned?: number
  weight?: number
  seoTitle?: string
  seoKeywords?: string
  seoDescription?: string
  canonicalUrl?: string
  sourceType?: number
  sourceUrl?: string
  categoryId?: string | number
  categoryName?: string
  tagNames?: string | string[]
  tagNameList?: string[]
  tagList?: string[]
  tagIds?: Array<string | number>
  tags?: Array<{
    id?: string | number
    tagId?: string | number
    name?: string
  }>
  lang?: string
  extJson?: string
  createTime?: string
  updateTime?: string
}

type PostPageData = {
  pageNo: number
  pageSize: number
  total: number
  records: PostRecord[]
}

export type PostSummaryData = {
  categoryCount: number
  tagCount: number
  hottestPost: PostRecord | null
}

export const createPost = async (payload: PostPayload) =>
  postJson<ApiResponse<boolean>>('/app/post', payload)

export const updatePost = async (id: string, payload: PostPayload) =>
  putJson<ApiResponse<boolean>>(`/app/post/${id}`, payload)

export const deletePost = async (id: string) =>
  deleteJson<ApiResponse<boolean>>(`/app/post/${id}`)

export const fetchPostDetail = async (id: string) =>
  getJson<ApiResponse<PostRecord>>(`/app/post/${id}`)

export const fetchPostPage = async (payload: PostPagePayload) =>
  postJson<ApiResponse<PostPageData>>('/app/post/page', payload)

export const fetchPostSummary = async () =>
  getJson<ApiResponse<PostSummaryData>>('/app/post/summary')
