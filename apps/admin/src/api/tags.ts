import { deleteJson, patchJson, postJson, putJson } from './http'

type ApiResponse<T> = {
  success: boolean
  errorCode: string | number | null
  errorMessage: string | null
  data: T
}

type CreateTagPayload = {
  name: string
  slug: string
  description: string
  enabled: 0 | 1
}

type UpdateTagPayload = CreateTagPayload

type UpdateEnabledPayload = {
  enable: 0 | 1
}

type TagPagePayload = {
  keyword: string
  pageNo: number
  pageSize: number
}

type TagPageRecord = {
  id: number
  tagCode: string
  name: string
  slug: string
  description: string
  enabled: 0 | 1
  postCount: number
  hotScore: number
  createTime: string
  updateTime: string
}

type TagPageData = {
  pageNo: number
  pageSize: number
  total: number
  records: TagPageRecord[]
}

export const createTag = async (payload: CreateTagPayload) =>
  postJson<ApiResponse<boolean>>('/app/post/tag', payload)

export const updateTag = async (
  id: string,
  payload: UpdateTagPayload
) => putJson<ApiResponse<boolean>>(`/app/post/tag/${id}`, payload)

export const deleteTag = async (id: string) =>
  deleteJson<ApiResponse<boolean>>(`/app/post/tag/${id}`)

export const updateTagEnabled = async (
  id: string,
  payload: UpdateEnabledPayload
) => patchJson<ApiResponse<boolean>>(`/app/post/tag/${id}/enabled`, payload)

export const fetchTagPage = async (payload: TagPagePayload) =>
  postJson<ApiResponse<TagPageData>>('/app/post/tag/page', payload)
