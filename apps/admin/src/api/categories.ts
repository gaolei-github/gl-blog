import { deleteJson, patchJson, postJson, putJson } from './http'

type ApiResponse<T> = {
  success: boolean
  errorCode: string | number | null
  errorMessage: string | null
  data: T
}

type CategoryPayload = {
  name: string
  slug: string
  parentId: string
  level: number
  sortNo: number
  description: string
  enabled: 0 | 1
  userId: string
}

type CategoryPagePayload = {
  status?: 0 | 1
  keyword: string
  level?: number
  pageNo?: number
  pageSize?: number
}

type CategoryRecord = {
  id: number
  categoryCode: string
  name: string
  slug: string
  parentId: number
  treePath: string
  level: number
  sortNo: number
  description: string
  enabled: 0 | 1
  postCount: number
  createTime: string
  updateTime: string
}

type CategoryPageData = {
  pageNo: string | number
  pageSize: string | number
  total: string | number
  records: CategoryRecord[]
}

type UpdateEnabledPayload = {
  enable: 0 | 1
}

export const createCategory = async (payload: CategoryPayload) =>
  postJson<ApiResponse<boolean>>('/app/post/category', payload)

export const updateCategory = async (
  id: string,
  payload: CategoryPayload
) => putJson<ApiResponse<boolean>>(`/app/post/category/${id}`, payload)

export const deleteCategory = async (id: string) =>
  deleteJson<ApiResponse<boolean>>(`/app/post/category/${id}`)

export const fetchCategoryPage = async (payload: CategoryPagePayload) =>
  postJson<ApiResponse<CategoryPageData>>('/app/post/category/page', payload)

export const updateCategoryEnabled = async (
  id: string,
  payload: UpdateEnabledPayload
) => patchJson<ApiResponse<boolean>>(`/app/post/category/${id}/enabled`, payload)
