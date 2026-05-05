# BlogFrontController 接口文档

## 1. 基础信息

- 控制器：`BlogFrontController`
- 基础路径：`/app/front`
- 统一响应：`JsonResult<T>`

```json
{
  "success": true,
  "errorCode": null,
  "errorMessage": null,
  "data": {}
}
```

失败响应示例：

```json
{
  "success": false,
  "errorCode": "10003",
  "errorMessage": "参数不合法",
  "data": null
}
```

常见错误码：

- `500`：系统异常
- `10003`：参数不合法

## 2. 接口列表

### 2.1 帖子搜索

- 方法：`POST`
- 路径：`/front/search`
- 入参类型：`application/json`
- 说明：当前基于 MySQL 搜索，按 `title`、`subtitle`、`summary` 模糊匹配并分页返回。

入参字段（`PostSearchDTO`）：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| pageNo | Integer | 否 | 页码，默认 `1` |
| pageSize | Integer | 否 | 每页条数，默认 `10` |
| keyword | String | 否 | 搜索关键字（标题/副标题/摘要模糊匹配） |

请求示例：

```json
{
  "pageNo": 1,
  "pageSize": 10,
  "keyword": "Spring Boot"
}
```

出参 `data` 类型：`PageVO<PostVO>`

| 字段 | 类型 | 说明 |
|---|---|---|
| pageNo | Long | 当前页码 |
| pageSize | Long | 每页条数 |
| total | Long | 总条数 |
| records | List<PostVO> | 记录列表 |

`PostVO` 主要字段说明：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Long | 帖子ID |
| authorId | Long | 作者用户ID |
| postCode | String | 帖子编码 |
| slug | String | URL 标识 |
| title | String | 标题 |
| subtitle | String | 副标题 |
| summary | String | 摘要 |
| coverUrl | String | 封面图 URL |
| status | Integer | 状态 |
| publishTime | String | 发布时间，格式 `yyyy-MM-dd HH:mm:ss` |
| featured | Integer | 是否精选 |
| pinned | Integer | 是否置顶 |
| weight | Integer | 权重 |
| createTime | String | 创建时间，格式 `yyyy-MM-dd HH:mm:ss` |
| updateTime | String | 更新时间，格式 `yyyy-MM-dd HH:mm:ss` |

成功响应示例：

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
        "id": 101,
        "authorId": 10001,
        "postCode": "POST202603220001",
        "slug": "spring-boot-guide",
        "title": "Spring Boot 实战",
        "subtitle": "从入门到部署",
        "summary": "完整讲解 Spring Boot 常见实践",
        "coverUrl": "https://cdn.example.com/post/cover-1.jpg",
        "status": 1,
        "publishTime": "2026-03-20 10:00:00",
        "featured": 1,
        "pinned": 0,
        "weight": 10,
        "createTime": "2026-03-19 21:00:00",
        "updateTime": "2026-03-20 10:05:00"
      }
    ]
  }
}
```
