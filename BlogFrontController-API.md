# BlogFrontController 接口文档

## 1. 基本信息

- 控制器：`com.gaolei.dawn.controller.front.BlogFrontController`
- 基础路径：`/app/front`
- 响应格式：`application/json`

统一响应结构：

```json
{
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "data": {}
}
```

统一响应字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| success | Boolean | 是否成功 |
| errorCode | String | 错误码，失败时返回 |
| errorMessage | String | 错误信息，失败时返回 |
| data | Object | 业务数据 |

---

## 1. 首页信息

- 请求方式：`GET`
- 请求路径：`/front/home`
- 接口说明：查询博客首页展示信息

### 1.1 请求参数

无

### 1.2 响应数据

`data` 类型：`BlogHomeVO`

#### hero 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| title | String | 首页主标题，当前固定为 `GL Blog` |
| subtitle | String | 首页副标题，当前固定为 `技术专栏与知识沉淀` |
| description | String | 首页描述，当前固定为 `个人技术文章、实践记录和专题整理` |
| seriesCount | Long | 专栏数量，取未删除分类总数 |
| topicCount | Long | 主题数量，取未删除标签总数 |
| postCount | Long | 帖子数量，取前台可见已发布帖子总数 |

#### quickEntries 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 分类ID |
| name | String | 分类名称 |
| slug | String | 分类标识 |
| description | String | 分类描述 |
| postCount | Integer | 分类下文章数 |
| icon | String | 快捷入口图标，根据分类标识推断，默认 `folder` |
| themeColor | String | 主题色，根据分类标识推断，默认 `#2563eb` |
| coverUrl | String | 封面图地址，当前固定空字符串 |

### 1.3 响应示例

```json
{
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "data": {
    "hero": {
      "title": "GL Blog",
      "subtitle": "技术专栏与知识沉淀",
      "description": "个人技术文章、实践记录和专题整理",
      "seriesCount": 6,
      "topicCount": 18,
      "postCount": 120
    },
    "quickEntries": [
      {
        "id": 1,
        "name": "Java",
        "slug": "java",
        "description": "Java 后端、Spring、工程实践",
        "postCount": 32,
        "icon": "coffee",
        "themeColor": "#2563eb",
        "coverUrl": ""
      }
    ]
  }
}
```

## 2. 查询已启用分类

- 请求方式：`GET`
- 请求路径：`/front/category`
- 接口说明：查询所有已启用分类，并按树形结构返回

### 2.1 请求参数

无

### 2.2 响应数据

`data` 类型：`List<PostCategoryVO>`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 分类主键ID |
| categoryCode | String | 分类编码 |
| name | String | 分类名称 |
| slug | String | 分类 URL 标识 |
| parentId | Long | 父分类ID |
| treePath | String | 树路径，例如 `/1/12/36/` |
| level | Integer | 层级，根节点一般为 1 |
| sortNo | Integer | 排序号，越小越靠前 |
| description | String | 分类描述 |
| enabled | Integer | 是否启用：`1-启用`，`0-禁用` |
| postCount | Integer | 文章数量 |
| createTime | String | 创建时间，格式：`yyyy-MM-dd HH:mm:ss` |
| updateTime | String | 更新时间，格式：`yyyy-MM-dd HH:mm:ss` |
| children | List<PostCategoryVO> | 子分类列表 |

### 2.3 响应示例

```json
{
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "data": [
    {
      "id": 1,
      "categoryCode": "tech",
      "name": "技术",
      "slug": "tech",
      "parentId": 0,
      "treePath": "/1/",
      "level": 1,
      "sortNo": 1,
      "description": "技术文章",
      "enabled": 1,
      "postCount": 12,
      "createTime": "2026-05-05 10:00:00",
      "updateTime": "2026-05-05 10:00:00",
      "children": [
        {
          "id": 2,
          "categoryCode": "java",
          "name": "Java",
          "slug": "java",
          "parentId": 1,
          "treePath": "/1/2/",
          "level": 2,
          "sortNo": 1,
          "description": "Java 分类",
          "enabled": 1,
          "postCount": 5,
          "createTime": "2026-05-05 10:00:00",
          "updateTime": "2026-05-05 10:00:00",
          "children": []
        }
      ]
    }
  ]
}
```

### 2.4 说明

- 返回结果为树形结构。
- 根节点判定规则：`parentId` 为空、`parentId=0`，或父节点不存在。
- 同级分类按 `sortNo` 升序、`id` 升序排序。

---

## 3. 按分类查询帖子列表

- 请求方式：`GET`
- 请求路径：`/front/post`
- 接口说明：根据分类ID查询帖子列表

### 3.1 请求参数

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|---|---|---|---|---|
| categoryId | query | Long | 是 | 分类ID |

### 3.2 响应数据

`data` 类型：`List<PostVO>`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 帖子ID |
| authorId | Long | 作者用户ID |
| authorName | String | 作者展示名 |
| postCode | String | 帖子编码 |
| slug | String | URL 标识 |
| title | String | 标题 |
| subtitle | String | 副标题 |
| summary | String | 摘要 |
| contentType | Integer | 内容类型：`1-Markdown`，`2-HTML`，`3-富文本JSON` |
| content | String | 正文原始内容 |
| renderedContent | String | 渲染后的内容 |
| coverUrl | String | 封面图URL |
| status | Integer | 状态：`0-草稿`，`1-已发布`，`2-定时发布`，`3-已归档`，`4-已下线` |
| visibility | Integer | 可见性：`0-公开`，`1-私密`，`2-不公开(仅链接可访问)`，`3-密码访问` |
| allowComment | Integer | 是否允许评论：`0-否`，`1-是` |
| commentCount | Integer | 评论数 |
| likeCount | Integer | 点赞数 |
| viewCount | Long | 浏览量 |
| wordCount | Integer | 字数统计 |
| readingMinutes | Integer | 预计阅读时长（分钟） |
| publishTime | String | 发布时间，格式：`yyyy-MM-dd HH:mm:ss` |
| scheduledPublishTime | String | 定时发布时间，格式：`yyyy-MM-dd HH:mm:ss` |
| lastPublishedTime | String | 最近一次发布时间，格式：`yyyy-MM-dd HH:mm:ss` |
| featured | Integer | 是否精选：`0-否`，`1-是` |
| pinned | Integer | 是否置顶：`0-否`，`1-是` |
| weight | Integer | 权重，越大越靠前 |
| seoTitle | String | SEO 标题 |
| seoKeywords | String | SEO 关键词 |
| seoDescription | String | SEO 描述 |
| canonicalUrl | String | 规范链接 |
| sourceType | Integer | 来源类型：`0-原创`，`1-转载`，`2-翻译` |
| sourceUrl | String | 来源链接 |
| lang | String | 语言，例如 `zh-CN` |
| extJson | String | 扩展信息 JSON |
| categoryId | Long | 主分类ID |
| categoryName | String | 主分类名称 |
| tagIds | List<Long> | 标签ID列表 |
| tagNames | List<String> | 标签名称列表 |
| createTime | String | 创建时间，格式：`yyyy-MM-dd HH:mm:ss` |
| updateTime | String | 更新时间，格式：`yyyy-MM-dd HH:mm:ss` |

### 3.3 请求示例

```http
GET /front/post?categoryId=1
```

### 3.4 响应示例

```json
{
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "data": [
    {
      "id": 1001,
      "authorId": 1,
      "authorName": "gaolei",
      "postCode": "POST_1001",
      "slug": "spring-boot-guide",
      "title": "Spring Boot 指南",
      "subtitle": "快速入门",
      "summary": "这是一篇 Spring Boot 入门文章",
      "contentType": 1,
      "content": "# 标题",
      "renderedContent": "<h1>标题</h1>",
      "coverUrl": "https://example.com/cover.png",
      "status": 1,
      "visibility": 0,
      "allowComment": 1,
      "commentCount": 10,
      "likeCount": 5,
      "viewCount": 200,
      "wordCount": 3200,
      "readingMinutes": 8,
      "publishTime": "2026-05-05 10:00:00",
      "scheduledPublishTime": null,
      "lastPublishedTime": "2026-05-05 10:00:00",
      "featured": 1,
      "pinned": 0,
      "weight": 100,
      "seoTitle": "Spring Boot 指南",
      "seoKeywords": "spring boot,java",
      "seoDescription": "Spring Boot 入门",
      "canonicalUrl": "https://example.com/posts/spring-boot-guide",
      "sourceType": 0,
      "sourceUrl": null,
      "lang": "zh-CN",
      "extJson": "{}",
      "categoryId": 2,
      "categoryName": "Java",
      "tagIds": [1, 2],
      "tagNames": ["Spring", "Boot"],
      "createTime": "2026-05-05 10:00:00",
      "updateTime": "2026-05-05 10:00:00"
    }
  ]
}
```

### 3.5 异常说明

| 场景 | 说明 |
|---|---|
| `categoryId` 为空 | 返回“分类id不能为空” |
| 分类不存在 | 返回“分类不存在” |

### 3.6 说明

- 如果传入的是一级分类，则会同时查询该一级分类下的所有子分类文章。
- 如果传入的是非一级分类，则仅查询当前分类下的文章。
- 实际查询调用 `listFrontVisibleByIds`，返回前台可见文章。
- 返回的 `categoryId`、`categoryName` 为帖子主分类信息。

---

## 4. 帖子搜索

- 请求方式：`POST`
- 请求路径：`/front/search`
- 接口说明：分页搜索帖子

### 4.1 请求参数

请求体类型：`PostSearchDTO`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| pageNo | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 10 | 每页条数 |
| keyword | String | 否 | 无 | 搜索关键字，按标题、副标题、摘要模糊匹配 |

### 4.2 请求示例

```json
{
  "pageNo": 1,
  "pageSize": 10,
  "keyword": "Spring"
}
```

### 4.3 响应数据

`data` 类型：`PageVO<PostVO>`

分页字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| pageNo | Long | 当前页码 |
| pageSize | Long | 每页条数 |
| total | Long | 总记录数 |
| records | List<PostVO> | 帖子列表 |

`records` 中单条记录字段与“按分类查询帖子列表”接口中的 `PostVO` 一致。

### 4.4 响应示例

```json
{
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "data": {
    "pageNo": 1,
    "pageSize": 10,
    "total": 2,
    "records": [
      {
        "id": 1001,
        "authorId": 1,
        "authorName": "gaolei",
        "postCode": "POST_1001",
        "slug": "spring-boot-guide",
        "title": "Spring Boot 指南",
        "subtitle": "快速入门",
        "summary": "这是一篇 Spring Boot 入门文章",
        "contentType": 1,
        "content": "# 标题",
        "renderedContent": "<h1>标题</h1>",
        "coverUrl": "https://example.com/cover.png",
        "status": 1,
        "visibility": 0,
        "allowComment": 1,
        "commentCount": 10,
        "likeCount": 5,
        "viewCount": 200,
        "wordCount": 3200,
        "readingMinutes": 8,
        "publishTime": "2026-05-05 10:00:00",
        "scheduledPublishTime": null,
        "lastPublishedTime": "2026-05-05 10:00:00",
        "featured": 1,
        "pinned": 0,
        "weight": 100,
        "seoTitle": "Spring Boot 指南",
        "seoKeywords": "spring boot,java",
        "seoDescription": "Spring Boot 入门",
        "canonicalUrl": "https://example.com/posts/spring-boot-guide",
        "sourceType": 0,
        "sourceUrl": null,
        "lang": "zh-CN",
        "extJson": "{}",
        "categoryId": 2,
        "categoryName": "Java",
        "tagIds": [1, 2],
        "tagNames": ["Spring", "Boot"],
        "createTime": "2026-05-05 10:00:00",
        "updateTime": "2026-05-05 10:00:00"
      }
    ]
  }
}
```

### 4.5 说明

- 关键字会对 `title`、`subtitle`、`summary` 进行模糊匹配。
- 当前实现的排序规则为：
    - `pinned` 倒序
    - `featured` 倒序
    - `weight` 倒序
    - `publishTime` 倒序
- 当前实现仅过滤逻辑删除数据：`deleteFlag = 0`。

---

## 5. 类型说明

### 5.1 PostSearchDTO

```json
{
  "pageNo": 1,
  "pageSize": 10,
  "keyword": "Spring"
}
```

### 5.2 PageVO

```json
{
  "pageNo": 1,
  "pageSize": 10,
  "total": 100,
  "records": []
}
```
