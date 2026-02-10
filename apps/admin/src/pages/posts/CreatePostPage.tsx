import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Extension, type Editor } from '@tiptap/core'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlock from '@tiptap/extension-code-block'
import TextAlign from '@tiptap/extension-text-align'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { useNavigate, useParams } from 'react-router-dom'
import { createCategory, fetchCategoryPage } from '../../api/categories'
import { removeFile, uploadFile } from '../../api/files'
import {
  createPost,
  fetchPostDetail,
  type PostPayload,
  updatePost,
} from '../../api/posts'
import { createTag, fetchTagPage } from '../../api/tags'
import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import ToastNotice from '../../components/toast-notice/ToastNotice'
import './create-post-page.css'

type OptionItem = {
  id: string
  name: string
}

const DEFAULT_USER_ID = 10001
const codeLanguages = [
  { value: 'text', label: '纯文本' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'json', label: 'JSON' },
]
const textIndentValue = '2em'
const defaultCodeLanguage = codeLanguages[0]?.value ?? 'text'
const visibilityOptions = [
  { value: '0', label: '公开' },
  { value: '1', label: '私密' },
  { value: '2', label: '不公开（仅链接访问）' },
  { value: '3', label: '密码访问' },
]
const defaultVisibility = visibilityOptions[0]

const textIndentExtension = Extension.create({
  name: 'textIndent',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      indent: textIndentValue,
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textIndent: {
            default: null,
            parseHTML: (element) => element.style.textIndent || null,
            renderHTML: (attributes) =>
              attributes.textIndent
                ? { style: `text-indent: ${attributes.textIndent}` }
                : {},
          },
        },
      },
    ]
  },
})

const codeBlockWithLanguage = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: defaultCodeLanguage,
        parseHTML: (element) =>
          element.getAttribute('data-language') ?? defaultCodeLanguage,
        renderHTML: (attributes) => ({
          'data-language': attributes.language || defaultCodeLanguage,
        }),
      },
    }
  },
})

const createSlug = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) {
    return ''
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  return normalized.slice(0, 16)
}

const toApiDateTime = (value: string) => {
  if (!value) {
    return ''
  }

  const withSeconds = value.length === 16 ? `${value}:00` : value
  return withSeconds
}

const parseIdValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  return ''
}

const parseCategoryId = (detail: Record<string, unknown>) => {
  const category = detail.category
  if (category && typeof category === 'object' && !Array.isArray(category)) {
    const idFromCategory = parseIdValue((category as { id?: unknown }).id)
    if (idFromCategory) {
      return idFromCategory
    }
  }

  return (
    parseIdValue(detail.categoryId) ||
    parseIdValue(detail.postCategoryId) ||
    parseIdValue(detail.category_id) ||
    ''
  )
}

const parseTagIds = (detail: Record<string, unknown>) => {
  const candidates = [
    detail.tagIds,
    detail.postTagIds,
    detail.tagIdList,
    detail.tags,
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (Array.isArray(candidate)) {
      const parsed = candidate
        .map((item) => {
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            return (
              parseIdValue((item as { id?: unknown }).id) ||
              parseIdValue((item as { tagId?: unknown }).tagId)
            )
          }
          return parseIdValue(item)
        })
        .filter(Boolean)

      if (parsed.length > 0) {
        return Array.from(new Set(parsed))
      }
      continue
    }

    if (typeof candidate === 'string') {
      const parsed = candidate
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      if (parsed.length > 0) {
        return Array.from(new Set(parsed))
      }
    }
  }

  return []
}

function CreatePostPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [summary, setSummary] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [categoryOptions, setCategoryOptions] = useState<OptionItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [tagOptions, setTagOptions] = useState<OptionItem[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [postSource, setPostSource] = useState<'original' | 'repost'>('original')
  const [repostSource, setRepostSource] = useState('')
  const [visibility, setVisibility] = useState(defaultVisibility.value)
  const [featuredStatus, setFeaturedStatus] = useState('no')
  const [pinnedStatus, setPinnedStatus] = useState('no')
  const [publishTime, setPublishTime] = useState('')
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const categorySelectRef = useRef<HTMLDivElement | null>(null)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isTagOpen, setIsTagOpen] = useState(false)
  const tagSelectRef = useRef<HTMLDivElement | null>(null)
  const [tagQuery, setTagQuery] = useState('')
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false)
  const visibilitySelectRef = useRef<HTMLDivElement | null>(null)
  const editorCardRef = useRef<HTMLDivElement | null>(null)
  const [codeLanguage, setCodeLanguage] = useState(defaultCodeLanguage)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [isCoverUploading, setIsCoverUploading] = useState(false)
  const [isCoverRemoving, setIsCoverRemoving] = useState(false)
  const [isEditorImageUploading, setIsEditorImageUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [initialEditorContent, setInitialEditorContent] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isErrorOpen, setIsErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      return
    }

    try {
      const response = await createCategory({
        name: trimmed,
        slug: createSlug(trimmed),
        parentId: '0',
        level: 1,
        sortNo: 0,
        description: '',
        enabled: 1,
        userId: String(DEFAULT_USER_ID),
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '分类创建失败')
        setIsErrorOpen(true)
        return
      }

      const categoryResponse = await fetchCategoryPage({
        pageNo: 1,
        pageSize: 200,
        keyword: '',
        status: 1,
      })
      const records = categoryResponse.data?.records ?? []
      const nextOptions = records.map((record) => ({
        id: String(record.id),
        name: record.name,
      }))
      setCategoryOptions(nextOptions)
      const currentOption = nextOptions.find((item) => item.name === trimmed)
      setSelectedCategoryId(currentOption ? currentOption.id : '')
      setNewCategoryName('')
      setIsCategoryModalOpen(false)
    } catch {
      setErrorMessage('分类创建失败')
      setIsErrorOpen(true)
    }
  }

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim()
    if (!trimmed) {
      return
    }

    try {
      const response = await createTag({
        name: trimmed,
        slug: createSlug(trimmed),
        description: '',
        enabled: 1,
      })

      if (!response.success) {
        setErrorMessage(response.errorMessage || '标签创建失败')
        setIsErrorOpen(true)
        return
      }

      const tagResponse = await fetchTagPage({
        pageNo: 1,
        pageSize: 200,
        keyword: '',
      })
      const records = tagResponse.data?.records ?? []
      const nextOptions = records.map((record) => ({
        id: String(record.id),
        name: record.name,
      }))
      setTagOptions(nextOptions)
      const currentOption = nextOptions.find((item) => item.name === trimmed)
      if (currentOption) {
        setSelectedTags((current) =>
          current.includes(currentOption.id) ? current : [...current, currentOption.id]
        )
      }
      setNewTagName('')
      setIsTagModalOpen(false)
    } catch {
      setErrorMessage('标签创建失败')
      setIsErrorOpen(true)
    }
  }

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoryResponse, tagResponse] = await Promise.all([
          fetchCategoryPage({
            pageNo: 1,
            pageSize: 200,
            keyword: '',
            status: 1,
          }),
          fetchTagPage({
            pageNo: 1,
            pageSize: 200,
            keyword: '',
          }),
        ])

        if (categoryResponse.success) {
          const categoryRecords = categoryResponse.data?.records ?? []
          setCategoryOptions(
            categoryRecords.map((record) => ({
              id: String(record.id),
              name: record.name,
            }))
          )
        }

        if (tagResponse.success) {
          const tagRecords = tagResponse.data?.records ?? []
          setTagOptions(
            tagRecords.map((record) => ({
              id: String(record.id),
              name: record.name,
            }))
          )
        }
      } catch {
        setErrorMessage('分类或标签加载失败')
        setIsErrorOpen(true)
      }
    }

    void loadOptions()
  }, [])

  const isBlobUrl = (value: string) => value.startsWith('blob:')
  const resolveObjectName = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return ''
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return trimmed.replace(/^\/+/, '')
    }

    try {
      const url = new URL(trimmed)
      const segments = url.pathname.split('/').filter(Boolean)
      if (segments.length <= 1) {
        return segments.join('')
      }
      return segments.slice(1).join('/')
    } catch {
      return ''
    }
  }

  useEffect(() => {
    if (!id) {
      return
    }

    const loadDetail = async () => {
      try {
        setIsLoadingDetail(true)
        const response = await fetchPostDetail(id)

        if (!response.success || !response.data) {
          setErrorMessage(response.errorMessage || '帖子详情加载失败')
          setIsErrorOpen(true)
          return
        }

        const detail = response.data
        setTitle(detail.title || '')
        setSlug(detail.slug || '')
        setSubtitle(detail.subtitle || '')
        setSummary(detail.summary || '')
        setCoverUrl(detail.coverUrl || '')
        setCoverPreviewUrl(detail.coverUrl || null)
        setVisibility(String(detail.visibility ?? 0))
        setFeaturedStatus(detail.featured === 1 ? 'yes' : 'no')
        setPinnedStatus(detail.pinned === 1 ? 'yes' : 'no')
        setPublishTime(toDateTimeLocalValue(detail.publishTime))
        setPostSource(detail.sourceType === 0 ? 'original' : 'repost')
        setRepostSource(detail.sourceUrl || '')
        const detailRecord = detail as unknown as Record<string, unknown>
        setSelectedCategoryId(parseCategoryId(detailRecord))
        setSelectedTags(parseTagIds(detailRecord))
        setInitialEditorContent(detail.content || '')
      } catch {
        setErrorMessage('帖子详情加载失败')
        setIsErrorOpen(true)
      } finally {
        setIsLoadingDetail(false)
      }
    }

    void loadDetail()
  }, [id])

  useEffect(() => {
    if (!isCategoryOpen) {
      return
    }

    setCategoryQuery('')

    const handleOutsideClick = (event: MouseEvent) => {
      if (!categorySelectRef.current) {
        return
      }

      if (!categorySelectRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [isCategoryOpen])

  useEffect(() => {
    if (!isTagOpen) {
      return
    }

    setTagQuery('')

    const handleOutsideClick = (event: MouseEvent) => {
      if (!tagSelectRef.current) {
        return
      }

      if (!tagSelectRef.current.contains(event.target as Node)) {
        setIsTagOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [isTagOpen])

  useEffect(() => {
    if (!isVisibilityOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!visibilitySelectRef.current) {
        return
      }

      if (!visibilitySelectRef.current.contains(event.target as Node)) {
        setIsVisibilityOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [isVisibilityOpen])

  useEffect(() => {
    return () => {
      if (coverPreviewUrl && isBlobUrl(coverPreviewUrl)) {
        URL.revokeObjectURL(coverPreviewUrl)
      }
    }
  }, [coverPreviewUrl])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle('editor-fullscreen-open', isEditorFullscreen)
    return () => {
      document.body.classList.remove('editor-fullscreen-open')
    }
  }, [isEditorFullscreen])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsEditorFullscreen(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (document.fullscreenElement) {
        void document.exitFullscreen()
      }

      setIsEditorFullscreen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const selectedVisibilityLabel =
    visibilityOptions.find((option) => option.value === visibility)?.label ??
    defaultVisibility.label

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId) {
      return '请选择分类'
    }

    return (
      categoryOptions.find((category) => category.id === selectedCategoryId)?.name ||
      '请选择分类'
    )
  }, [categoryOptions, selectedCategoryId])

  const tagDisplayText = useMemo(() => {
    if (selectedTags.length === 0) {
      return '请选择标签'
    }

    const selectedNames = selectedTags
      .map((tagId) => tagOptions.find((tag) => tag.id === tagId)?.name)
      .filter(Boolean)

    return selectedNames.length > 0 ? selectedNames.join('、') : '请选择标签'
  }, [selectedTags, tagOptions])

  const normalizedCategoryQuery = categoryQuery.trim().toLowerCase()
  const normalizedTagQuery = tagQuery.trim().toLowerCase()
  const filteredCategories = categoryOptions.filter((category) =>
    category.name.toLowerCase().includes(normalizedCategoryQuery)
  )
  const filteredTags = tagOptions.filter((tag) =>
    tag.name.toLowerCase().includes(normalizedTagQuery)
  )

  const handlePostSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSource = event.target.value === 'repost' ? 'repost' : 'original'
    setPostSource(nextSource)
    if (nextSource === 'original') {
      setRepostSource('')
    }
  }

  const handleFeaturedChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFeaturedStatus(event.target.value === 'yes' ? 'yes' : 'no')
  }

  const handlePinnedChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPinnedStatus(event.target.value === 'yes' ? 'yes' : 'no')
  }

  const handlePublishTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPublishTime(event.target.value)
  }

  const handleEditorFullscreenToggle = () => {
    if (typeof document === 'undefined') {
      return
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen()
      setIsEditorFullscreen(false)
      return
    }

    setIsEditorFullscreen(true)
    if (editorCardRef.current?.requestFullscreen) {
      void editorCardRef.current.requestFullscreen()
    }
  }

  const renderOptionLabel = (label: string, query: string) => {
    const normalizedLabel = label.toLowerCase()
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return label
    }

    const matchIndex = normalizedLabel.indexOf(normalizedQuery)
    if (matchIndex === -1) {
      return label
    }

    const matchEnd = matchIndex + normalizedQuery.length
    return (
      <>
        <span>{label.slice(0, matchIndex)}</span>
        <span className="select-option-mark">
          {label.slice(matchIndex, matchEnd)}
        </span>
        <span>{label.slice(matchEnd)}</span>
      </>
    )
  }

  const handleCoverChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) {
      return
    }

    setIsCoverUploading(true)

    try {
      const response = await uploadFile({ file, folder: 'post/cover' })
      if (!response.success || !response.data?.objectUrl) {
        setErrorMessage(response.errorMessage || '封面上传失败')
        setIsErrorOpen(true)
        return
      }

      if (coverPreviewUrl && isBlobUrl(coverPreviewUrl)) {
        URL.revokeObjectURL(coverPreviewUrl)
      }

      setCoverUrl(response.data.objectUrl)
      setCoverPreviewUrl(response.data.objectUrl)
    } catch {
      setErrorMessage('封面上传失败')
      setIsErrorOpen(true)
    } finally {
      setIsCoverUploading(false)
      input.value = ''
    }
  }

  const handleCoverRemove = async () => {
    if (isCoverRemoving) {
      return
    }

    const nextCoverUrl = coverUrl.trim()
    if (nextCoverUrl) {
      const objectName = resolveObjectName(nextCoverUrl)
      if (!objectName) {
        setErrorMessage('封面对象名解析失败，无法删除')
        setIsErrorOpen(true)
        return
      }

      try {
        setIsCoverRemoving(true)
        const response = await removeFile({ objectName })
        if (!response.success) {
          setErrorMessage(response.errorMessage || '封面删除失败')
          setIsErrorOpen(true)
          return
        }
      } catch {
        setErrorMessage('封面删除失败')
        setIsErrorOpen(true)
        return
      } finally {
        setIsCoverRemoving(false)
      }
    }

    if (coverPreviewUrl && isBlobUrl(coverPreviewUrl)) {
      URL.revokeObjectURL(coverPreviewUrl)
    }
    setCoverPreviewUrl(null)
    setCoverUrl('')
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const syncCodeLanguage = (activeEditor: Editor) => {
    if (!activeEditor.isActive('codeBlock')) {
      return
    }

    const activeLanguage = activeEditor.getAttributes('codeBlock')?.language
    const normalizedLanguage =
      typeof activeLanguage === 'string' && activeLanguage
        ? activeLanguage
        : defaultCodeLanguage

    setCodeLanguage((current) =>
      current === normalizedLanguage ? current : normalizedLanguage
    )
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      codeBlockWithLanguage,
      textIndentExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onCreate: ({ editor: activeEditor }) => {
      syncCodeLanguage(activeEditor)
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      syncCodeLanguage(activeEditor)
    },
    onUpdate: ({ editor: activeEditor }) => {
      setContent(activeEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor || initialEditorContent === null) {
      return
    }

    editor.commands.setContent(initialEditorContent)
    setContent(initialEditorContent)
    setInitialEditorContent(null)
  }, [editor, initialEditorContent])

  const handleAddLink = () => {
    if (!editor) {
      return
    }

    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('输入链接地址', previousUrl ?? '')
    if (url === null) {
      return
    }

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleAddImage = () => {
    if (!editor) {
      return
    }

    if (imageInputRef.current) {
      imageInputRef.current.click()
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file || !editor) {
      return
    }

    setIsEditorImageUploading(true)

    try {
      const response = await uploadFile({ file, folder: 'post/content' })
      if (!response.success || !response.data?.objectUrl) {
        setErrorMessage(response.errorMessage || '图片上传失败')
        setIsErrorOpen(true)
        return
      }

      editor.chain().focus().setImage({ src: response.data.objectUrl }).run()
    } catch {
      setErrorMessage('图片上传失败')
      setIsErrorOpen(true)
    } finally {
      setIsEditorImageUploading(false)
      input.value = ''
    }
  }

  const handleInsertTable = () => {
    if (!editor) {
      return
    }

    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const handleCenterToggle = () => {
    if (!editor) {
      return
    }

    if (editor.isActive({ textAlign: 'center' })) {
      editor.chain().focus().unsetTextAlign().run()
      return
    }

    editor.chain().focus().setTextAlign('center').run()
  }

  const handleIndentToggle = () => {
    if (!editor) {
      return
    }

    const activeType = editor.isActive('heading') ? 'heading' : 'paragraph'
    const currentIndent = editor.getAttributes(activeType)?.textIndent
    const nextIndent = currentIndent ? null : textIndentValue

    editor.chain().focus().updateAttributes(activeType, { textIndent: nextIndent }).run()
  }

  const handleCodeLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value
    setCodeLanguage(nextLanguage)

    if (!editor || !editor.isActive('codeBlock')) {
      return
    }

    editor.chain().focus().updateAttributes('codeBlock', { language: nextLanguage }).run()
  }

  const handleCodeBlockToggle = () => {
    if (!editor) {
      return
    }

    if (editor.isActive('codeBlock')) {
      editor.chain().focus().toggleCodeBlock().run()
      return
    }

    editor.chain().focus().toggleCodeBlock().run()
    editor.chain().focus().updateAttributes('codeBlock', { language: codeLanguage }).run()
  }

  const isIndentActive =
    editor?.isActive('paragraph', { textIndent: textIndentValue }) ||
    editor?.isActive('heading', { textIndent: textIndentValue })

  const buildPayload = (status: 0 | 1 | 2): PostPayload | null => {
    const nextTitle = title.trim()
    const nextSlug = slug.trim()
    const nextContent = content.trim()
    const nextPublishTime = toApiDateTime(publishTime)

    if (!nextTitle) {
      setErrorMessage('标题不能为空')
      setIsErrorOpen(true)
      return null
    }

    if (!nextSlug) {
      setErrorMessage('slug 不能为空')
      setIsErrorOpen(true)
      return null
    }

    if (!nextContent) {
      setErrorMessage('正文不能为空')
      setIsErrorOpen(true)
      return null
    }

    if (!nextPublishTime) {
      setErrorMessage('发布时间不能为空')
      setIsErrorOpen(true)
      return null
    }

    if (status === 2 && new Date(nextPublishTime).getTime() <= Date.now()) {
      setErrorMessage('定时发布时间必须大于当前时间')
      setIsErrorOpen(true)
      return null
    }

    const sourceType = postSource === 'original' ? 0 : 1
    const sourceUrl = repostSource.trim()

    if (sourceType !== 0 && !sourceUrl) {
      setErrorMessage('非原创帖子必须填写来源链接')
      setIsErrorOpen(true)
      return null
    }

    return {
      userId: DEFAULT_USER_ID,
      slug: nextSlug,
      title: nextTitle,
      subtitle: subtitle.trim(),
      summary: summary.trim(),
      contentType: 2,
      content: nextContent,
      coverUrl: coverUrl.trim(),
      status,
      visibility: Number(visibility) as 0 | 1 | 2 | 3,
      allowComment: 1,
      featured: featuredStatus === 'yes' ? 1 : 0,
      pinned: pinnedStatus === 'yes' ? 1 : 0,
      weight: 0,
      sourceType,
      sourceUrl,
      extJson: '',
      publishTime: nextPublishTime,
      tagIds: selectedTags,
      categoryId: selectedCategoryId || undefined,
    }
  }

  const handleSubmit = async (mode: 'save' | 'publish') => {
    if (isSubmitting) {
      return
    }

    const nextPublishTime = toApiDateTime(publishTime)
    const publishStatus =
      mode === 'save'
        ? 0
        : new Date(nextPublishTime).getTime() > Date.now()
          ? 2
          : 1

    const payload = buildPayload(publishStatus)
    if (!payload) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = isEditMode && id
        ? await updatePost(id, payload)
        : await createPost(payload)

      if (!response.success) {
        setErrorMessage(response.errorMessage || '提交失败')
        setIsErrorOpen(true)
        return
      }

      setSuccessMessage(isEditMode ? '帖子更新成功' : '帖子创建成功')
      setIsSuccessOpen(true)

      window.setTimeout(() => {
        navigate('/posts')
      }, 900)
    } catch {
      setErrorMessage('提交失败')
      setIsErrorOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingDetail) {
    return (
      <DashboardLayout>
        <section className="create-post-card">
          <div className="create-post-title">帖子数据加载中...</div>
        </section>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <section className="create-post-card">
        <div className="create-post-header">
          <div>
            <div className="card-label">帖子管理</div>
            <div className="create-post-title">{isEditMode ? '编辑帖子' : '发布新帖'}</div>
          </div>
        </div>
        <div className="create-post-form">
          <label className="form-field form-field-title" htmlFor="post-title">
            <span className="form-label">标题</span>
            <span className="title-input-wrap">
              <input
                id="post-title"
                type="text"
                className="form-input form-input-title"
                placeholder="请输入标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </span>
          </label>

          <label className="form-field" htmlFor="post-slug">
            <span className="form-label">slug</span>
            <span className="summary-input-wrap">
              <input
                id="post-slug"
                type="text"
                className="form-input"
                placeholder="例如：spring-boot-guide"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                onBlur={() => {
                  if (!slug.trim() && title.trim()) {
                    setSlug(createSlug(title))
                  }
                }}
              />
            </span>
          </label>

          <label className="form-field" htmlFor="post-subtitle">
            <span className="form-label">副标题</span>
            <span className="summary-input-wrap">
              <input
                id="post-subtitle"
                type="text"
                className="form-input"
                placeholder="请输入副标题"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
              />
            </span>
          </label>

          <div className="form-field">
            <span className="form-label">封面</span>
            <div className="cover-uploader">
              <input
                ref={coverInputRef}
                id="post-cover"
                type="file"
                accept="image/*"
                className="cover-input"
                disabled={isCoverUploading}
                onChange={handleCoverChange}
              />
              <label htmlFor="post-cover" className="cover-preview">
                {coverPreviewUrl ? (
                  <img src={coverPreviewUrl} alt="封面预览" />
                ) : (
                  <div className="cover-placeholder">
                    <span>{isCoverUploading ? '封面上传中...' : '点击上传封面'}</span>
                    <span className="cover-tip">建议尺寸 1200 × 630</span>
                  </div>
                )}
              </label>
              <div className="cover-actions">
                {coverPreviewUrl ? (
                  <button
                    type="button"
                    className="cover-link"
                    onClick={() => {
                      void handleCoverRemove()
                    }}
                    disabled={isCoverUploading || isCoverRemoving}
                  >
                    {isCoverRemoving ? '移除中...' : '移除'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <label className="form-field form-field-summary" htmlFor="post-summary">
            <span className="form-label">摘要</span>
            <span className="summary-input-wrap">
              <textarea
                id="post-summary"
                className="form-textarea summary-textarea"
                placeholder="写一段能概括文章核心观点的摘要"
                rows={4}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </span>
          </label>
          <label className="form-field form-field-content" htmlFor="post-content">
            <span className="form-label">内容</span>
            <div
              ref={editorCardRef}
              className={`editor-card ${
                isEditorFullscreen ? 'editor-card-fullscreen' : ''
              }`}
              id="post-content"
            >
              <div className="editor-shell">
                <div className="editor-toolbar">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="editor-image-input"
                    disabled={isEditorImageUploading}
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('heading', { level: 1 }) ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('heading', { level: 2 }) ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('heading', { level: 3 }) ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    H3
                  </button>
                  <div className="editor-divider" />
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('bold') ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    粗体
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('italic') ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    斜体
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('strike') ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                  >
                    删除线
                  </button>
                  <div className="editor-divider" />
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('bulletList') ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    无序列表
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('orderedList') ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  >
                    有序列表
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('blockquote') ? 'active' : ''
                    }`}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  >
                    引用
                  </button>
                  <div className="editor-divider" />
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive({ textAlign: 'center' }) ? 'active' : ''
                    }`}
                    onClick={handleCenterToggle}
                  >
                    居中
                  </button>
                  <button
                    type="button"
                    className={`editor-button ${isIndentActive ? 'active' : ''}`}
                    onClick={handleIndentToggle}
                  >
                    缩进
                  </button>
                  <div className="editor-code-tool" role="group" aria-label="代码块">
                    <button
                      type="button"
                      className={`editor-button editor-code-toggle ${
                        editor?.isActive('codeBlock') ? 'active' : ''
                      }`}
                      onClick={handleCodeBlockToggle}
                    >
                      代码块
                    </button>
                    <div className="editor-code-select-wrap">
                      <span className="editor-code-select-label">语言</span>
                      <select
                        className="editor-code-select"
                        value={codeLanguage}
                        onChange={handleCodeLanguageChange}
                        aria-label="选择代码语言"
                      >
                        {codeLanguages.map((language) => (
                          <option key={language.value} value={language.value}>
                            {language.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`editor-button ${
                      editor?.isActive('link') ? 'active' : ''
                    }`}
                    onClick={handleAddLink}
                  >
                    链接
                  </button>
                  <button
                    type="button"
                    className="editor-button"
                    onClick={handleAddImage}
                    disabled={isEditorImageUploading}
                  >
                    {isEditorImageUploading ? '图片上传中...' : '图片'}
                  </button>
                  <button
                    type="button"
                    className="editor-button"
                    onClick={handleInsertTable}
                  >
                    表格
                  </button>
                  <div className="editor-divider" />
                  <div className="editor-action-group" role="group" aria-label="历史操作">
                    <button
                      type="button"
                      className="editor-button"
                      onClick={() => editor?.chain().focus().undo().run()}
                      disabled={!editor?.can().undo()}
                    >
                      撤销
                    </button>
                    <button
                      type="button"
                      className="editor-button"
                      onClick={() => editor?.chain().focus().redo().run()}
                      disabled={!editor?.can().redo()}
                    >
                      重做
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`editor-button editor-fullscreen-button ${
                      isEditorFullscreen ? 'active' : ''
                    }`}
                    onClick={handleEditorFullscreenToggle}
                    aria-pressed={isEditorFullscreen}
                  >
                    <span className="editor-fullscreen-icon" aria-hidden="true" />
                    {isEditorFullscreen ? '退出全屏' : '全屏'}
                  </button>
                </div>
                <EditorContent editor={editor} className="editor-content" />
              </div>
            </div>
          </label>
          <div className="form-field">
            <span className="form-label" id="post-visibility-label">可见性</span>
            <div className="form-control-row">
              <div className="select-shell" ref={visibilitySelectRef}>
                <button
                  id="post-visibility"
                  type="button"
                  className="select-trigger"
                  aria-labelledby="post-visibility-label"
                  onClick={() => setIsVisibilityOpen((current) => !current)}
                >
                  <span
                    className={`select-value ${
                      visibility ? '' : 'select-placeholder'
                    }`}
                  >
                    {selectedVisibilityLabel}
                  </span>
                  <span className="select-arrow" aria-hidden="true" />
                </button>
                {isVisibilityOpen ? (
                  <div className="select-menu" role="listbox">
                    {visibilityOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`select-option ${
                          visibility === option.value ? 'active' : ''
                        }`}
                        role="option"
                        aria-selected={visibility === option.value}
                        onClick={() => {
                          setVisibility(option.value)
                          setIsVisibilityOpen(false)
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="form-field">
            <span className="form-label" id="post-category-label">分类</span>
            <div className="form-control-row">
              <div className="select-shell" ref={categorySelectRef}>
                <button
                  id="post-category"
                  type="button"
                  className="select-trigger"
                  aria-labelledby="post-category-label"
                  onClick={() => setIsCategoryOpen((current) => !current)}
                >
                  <span
                    className={`select-value ${
                      selectedCategoryId ? '' : 'select-placeholder'
                    }`}
                  >
                    {selectedCategoryLabel}
                  </span>
                  <span className="select-arrow" aria-hidden="true" />
                </button>
                {isCategoryOpen ? (
                  <div className="select-menu" role="listbox">
                    <input
                      type="text"
                      className="select-search"
                      placeholder="搜索分类"
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                    />
                    {filteredCategories.length === 0 ? (
                      <div className="select-empty">暂无匹配分类</div>
                    ) : (
                      filteredCategories.map((category) => (
                        <button
                          type="button"
                          key={category.id}
                          className={`select-option ${
                            selectedCategoryId === category.id ? 'active' : ''
                          }`}
                          role="option"
                          aria-selected={selectedCategoryId === category.id}
                          onClick={() => {
                            setSelectedCategoryId((current) =>
                              current === category.id ? '' : category.id
                            )
                            setIsCategoryOpen(false)
                          }}
                        >
                          {renderOptionLabel(category.name, categoryQuery)}
                        </button>
                      ))
                  )}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="form-action-button"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                新建
              </button>
            </div>
          </div>
          <div className="form-field">
            <span className="form-label" id="post-tags-label">文章标签</span>
            <div className="form-control-row">
              <div className="select-shell" ref={tagSelectRef}>
                <button
                  id="post-tags"
                  type="button"
                  className="select-trigger"
                  aria-labelledby="post-tags-label"
                  onClick={() => setIsTagOpen((current) => !current)}
                >
                  <span
                    className={`select-value ${
                      selectedTags.length > 0 ? '' : 'select-placeholder'
                    }`}
                  >
                    {tagDisplayText}
                  </span>
                  <span className="select-arrow" aria-hidden="true" />
                </button>
                {isTagOpen ? (
                  <div className="select-menu" role="listbox">
                    <input
                      type="text"
                      className="select-search"
                      placeholder="搜索标签"
                      value={tagQuery}
                      onChange={(event) => setTagQuery(event.target.value)}
                    />
                    {filteredTags.length === 0 ? (
                      <div className="select-empty">暂无匹配标签</div>
                    ) : (
                      filteredTags.map((tag) => (
                        <button
                          type="button"
                          key={tag.id}
                          className={`select-option ${
                            selectedTags.includes(tag.id) ? 'active' : ''
                          }`}
                          role="option"
                          aria-selected={selectedTags.includes(tag.id)}
                          onClick={() => {
                            setSelectedTags((current) =>
                              current.includes(tag.id)
                                ? current.filter((item) => item !== tag.id)
                                : [...current, tag.id]
                            )
                          }}
                        >
                          {renderOptionLabel(tag.name, tagQuery)}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="form-action-button"
                onClick={() => setIsTagModalOpen(true)}
              >
                新建
              </button>
            </div>
          </div>
          <div className="form-field form-field-post-source">
            <span className="form-label" id="post-source-label">文章类型</span>
            <div className="form-control-row post-source-control">
              <label className="post-source-option">
                <input
                  type="radio"
                  name="post-source"
                  value="original"
                  checked={postSource === 'original'}
                  onChange={handlePostSourceChange}
                />
                原创
              </label>
              <label className="post-source-option">
                <input
                  type="radio"
                  name="post-source"
                  value="repost"
                  checked={postSource === 'repost'}
                  onChange={handlePostSourceChange}
                />
                转载
              </label>
              {postSource === 'repost' ? (
                <div className="post-source-extra">
                  <span className="post-source-extra-label">转载来源</span>
                  <input
                    type="text"
                    className="form-input post-source-input"
                    placeholder="请输入转载来源链接"
                    value={repostSource}
                    onChange={(event) => setRepostSource(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="form-field form-field-featured">
            <span className="form-label" id="post-featured-label">是否精选</span>
            <div className="form-control-row post-source-control">
              <label className="post-source-option">
                <input
                  type="radio"
                  name="post-featured"
                  value="no"
                  checked={featuredStatus === 'no'}
                  onChange={handleFeaturedChange}
                />
                否
              </label>
              <label className="post-source-option">
                <input
                  type="radio"
                  name="post-featured"
                  value="yes"
                  checked={featuredStatus === 'yes'}
                  onChange={handleFeaturedChange}
                />
                是
              </label>
            </div>
          </div>

          <div className="form-field form-field-featured">
            <span className="form-label" id="post-pinned-label">是否置顶</span>
            <div className="form-control-row post-source-control">
              <label className="post-source-option">
                <input
                  type="radio"
                  name="post-pinned"
                  value="no"
                  checked={pinnedStatus === 'no'}
                  onChange={handlePinnedChange}
                />
                否
              </label>
              <label className="post-source-option">
                <input
                  type="radio"
                  name="post-pinned"
                  value="yes"
                  checked={pinnedStatus === 'yes'}
                  onChange={handlePinnedChange}
                />
                是
              </label>
            </div>
          </div>

          <label className="form-field form-field-publish-time" htmlFor="post-publish-time">
            <span className="form-label">发布时间</span>
            <span className="publish-time-wrap">
              <input
                id="post-publish-time"
                type="datetime-local"
                className="form-input publish-time-input"
                value={publishTime}
                onChange={handlePublishTimeChange}
              />
            </span>
          </label>
        </div>
        <div className="create-post-actions">
          <button
            type="button"
            className="create-post-button create-post-button-secondary"
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmit('save')
            }}
          >
            {isSubmitting ? '提交中...' : '保存草稿'}
          </button>
          <button
            type="button"
            className="create-post-button create-post-button-primary"
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmit('publish')
            }}
          >
            {isSubmitting ? '提交中...' : '发布'}
          </button>
        </div>
        {isCategoryModalOpen ? (
          <div className="modal-mask">
            <div className="modal-card" role="dialog" aria-modal="true">
              <div className="modal-header">
                <span>新建分类</span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  关闭
                </button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入分类名称"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="modal-primary"
                  onClick={() => {
                    void handleCreateCategory()
                  }}
                >
                  创建并选择
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {isTagModalOpen ? (
          <div className="modal-mask">
            <div className="modal-card" role="dialog" aria-modal="true">
              <div className="modal-header">
                <span>新建标签</span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setIsTagModalOpen(false)}
                >
                  关闭
                </button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入标签名称"
                  value={newTagName}
                  onChange={(event) => setNewTagName(event.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-secondary"
                  onClick={() => setIsTagModalOpen(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="modal-primary"
                  onClick={() => {
                    void handleCreateTag()
                  }}
                >
                  创建并选择
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <ToastNotice
          isOpen={isSuccessOpen}
          message={successMessage}
          tone="success"
          onClose={() => setIsSuccessOpen(false)}
        />
        <ToastNotice
          isOpen={isErrorOpen}
          message={errorMessage}
          tone="error"
          onClose={() => setIsErrorOpen(false)}
        />
      </section>
    </DashboardLayout>
  )
}

export default CreatePostPage
