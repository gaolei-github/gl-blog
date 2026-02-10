import { deleteJsonWithBody, postFormData } from './http'

type ApiResponse<T> = {
  success: boolean
  errorCode: string | number | null
  errorMessage: string | null
  data: T
}

export type FileUploadRecord = {
  bucket: string
  objectName: string
  originalFileName: string
  contentType: string
  size: number
  objectUrl: string
}

type UploadFilePayload = {
  file: File
  folder?: string
}

type RemoveFilePayload = {
  objectName: string
}

export const uploadFile = async ({ file, folder }: UploadFilePayload) => {
  const formData = new FormData()
  formData.append('file', file)

  const nextFolder = folder?.trim()
  if (nextFolder) {
    formData.append('folder', nextFolder)
  }

  return postFormData<ApiResponse<FileUploadRecord>>('/app/file/upload', formData)
}

export const removeFile = async (payload: RemoveFilePayload) =>
  deleteJsonWithBody<ApiResponse<boolean>>('/app/file/remove', payload)
