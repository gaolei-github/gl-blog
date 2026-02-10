import styles from './page.module.css'

type FeedPost = {
  id: number
  title: string
  summary: string
  category: string
  readMinutes: number
  viewCount: number
  likeCount: number
  publishDate: string
  authorName: string
  coverTheme: 'sun' | 'sand' | 'sea' | 'dusk'
  isPinned?: boolean
}

type TopicTag = {
  name: string
  postCount: number
}

const filterItems = ['all', 'product', 'engineering', 'lifestyle', 'notes']

const featuredPost: FeedPost = {
  id: 100,
  title: '从 0 到 1 做一个可持续更新的个人博客内容系统',
  summary:
    '围绕内容创作流程、标签体系和阅读路径设计，建立可持续迭代的博客运营机制，兼顾管理效率与读者体验。',
  category: 'product',
  readMinutes: 9,
  viewCount: 1421,
  likeCount: 298,
  publishDate: '2026-02-07',
  authorName: 'gl team',
  coverTheme: 'sun',
  isPinned: true,
}

const feedPosts: FeedPost[] = [
  {
    id: 1,
    title: 'B 端后台到 C 端展示的统一设计方法',
    summary:
      '通过统一配色、栅格和组件语义，让后台配置项自然映射到前台展示，减少重复设计和沟通成本。',
    category: 'product',
    readMinutes: 6,
    viewCount: 892,
    likeCount: 135,
    publishDate: '2026-02-05',
    authorName: 'sylvia',
    coverTheme: 'sand',
  },
  {
    id: 2,
    title: '文章卡片流的可读性优化清单',
    summary:
      '针对标题层级、摘要长度、信息密度与留白比例给出落地建议，提升列表页浏览效率。',
    category: 'engineering',
    readMinutes: 5,
    viewCount: 716,
    likeCount: 96,
    publishDate: '2026-02-04',
    authorName: 'harper',
    coverTheme: 'sea',
  },
  {
    id: 3,
    title: '标签与分类如何共同工作',
    summary:
      '分类负责导航结构，标签负责主题连接。两者职责清晰后，用户查找和推荐链路都会明显提升。',
    category: 'notes',
    readMinutes: 4,
    viewCount: 503,
    likeCount: 77,
    publishDate: '2026-02-01',
    authorName: 'lydia',
    coverTheme: 'dusk',
  },
  {
    id: 4,
    title: '封面图策略：如何在卡片流里建立识别度',
    summary:
      '建立主题色与内容类型映射，控制封面层级和对比，避免卡片流视觉噪声。',
    category: 'lifestyle',
    readMinutes: 7,
    viewCount: 986,
    likeCount: 168,
    publishDate: '2026-01-31',
    authorName: 'oliver',
    coverTheme: 'sun',
  },
  {
    id: 5,
    title: '前端内容站性能预算实践',
    summary:
      '从首屏资源、图片策略、路由拆分和缓存策略四个层面设定性能预算并持续监控。',
    category: 'engineering',
    readMinutes: 8,
    viewCount: 1142,
    likeCount: 212,
    publishDate: '2026-01-29',
    authorName: 'stella',
    coverTheme: 'sea',
  },
  {
    id: 6,
    title: '内容策展：把系列文章做成专题页',
    summary:
      '专题页不是文章堆叠，而是有明确入口、节奏和转化目标的内容产品。',
    category: 'product',
    readMinutes: 6,
    viewCount: 655,
    likeCount: 84,
    publishDate: '2026-01-26',
    authorName: 'gl team',
    coverTheme: 'sand',
  },
]

const hotTags: TopicTag[] = [
  { name: 'nextjs', postCount: 23 },
  { name: 'design-system', postCount: 18 },
  { name: 'performance', postCount: 15 },
  { name: 'content-strategy', postCount: 13 },
  { name: 'react', postCount: 11 },
]

const coverClassMap: Record<FeedPost['coverTheme'], string> = {
  sun: 'cover-sun',
  sand: 'cover-sand',
  sea: 'cover-sea',
  dusk: 'cover-dusk',
}

const formatCount = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))

const HomePage = () => {
  return (
    <div className={styles['community-page']}>
      <div className={styles['community-background']} />
      <div className={styles['community-shell']}>
        <header className={styles['top-header']}>
          <div className={styles.brand}>
            <span className={styles.mark}>gl</span>
            <div>
              <p className={styles['brand-title']}>gl blog</p>
              <p className={styles['brand-subtitle']}>share ideas with cards</p>
            </div>
          </div>
          <nav className={styles['top-nav']}>
            <button type="button" className={`${styles['nav-item']} ${styles.active}`}>
              discover
            </button>
            <button type="button" className={styles['nav-item']}>
              topics
            </button>
            <button type="button" className={styles['nav-item']}>
              authors
            </button>
          </nav>
          <button type="button" className={styles['publish-button']}>
            write post
          </button>
        </header>

        <section className={styles['featured-section']}>
          <div
            className={`${styles['featured-cover']} ${styles[coverClassMap[featuredPost.coverTheme]]}`}
          />
          <div className={styles['featured-content']}>
            <p className={styles['featured-label']}>editor pick</p>
            <h1 className={styles['featured-title']}>{featuredPost.title}</h1>
            <p className={styles['featured-summary']}>{featuredPost.summary}</p>
            <div className={styles['featured-meta']}>
              <span>{featuredPost.authorName}</span>
              <span>{formatDate(featuredPost.publishDate)}</span>
              <span>{featuredPost.readMinutes} min read</span>
              <span>{formatCount(featuredPost.viewCount)} views</span>
            </div>
          </div>
        </section>

        <section className={styles['filter-bar']}>
          <div className={styles['filter-list']}>
            {filterItems.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`${styles['filter-item']} ${index === 0 ? styles.active : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className={styles['search-wrap']}>
            <span className={styles['search-label']}>search</span>
            <input
              className={styles['search-input']}
              type="search"
              placeholder="search title or tag"
            />
          </label>
        </section>

        <div className={styles['content-grid']}>
          <main className={styles['feed-grid']}>
            {feedPosts.map((post) => (
              <article key={post.id} className={styles['post-card']}>
                <div className={`${styles['post-cover']} ${styles[coverClassMap[post.coverTheme]]}`}>
                  {post.isPinned ? <span className={styles['post-badge']}>pinned</span> : null}
                </div>
                <div className={styles['post-body']}>
                  <div className={styles['post-head']}>
                    <span className={styles['post-category']}>{post.category}</span>
                    <span className={styles['post-date']}>{formatDate(post.publishDate)}</span>
                  </div>
                  <h2 className={styles['post-title']}>{post.title}</h2>
                  <p className={styles['post-summary']}>{post.summary}</p>
                  <div className={styles['post-meta']}>
                    <span>{post.authorName}</span>
                    <span>{post.readMinutes} min</span>
                    <span>{formatCount(post.likeCount)} likes</span>
                  </div>
                </div>
              </article>
            ))}
          </main>

          <aside className={styles.sidebar}>
            <section className={styles['side-card']}>
              <h3 className={styles['side-title']}>hot topics</h3>
              <div className={styles['tag-list']}>
                {hotTags.map((tag) => (
                  <button key={tag.name} type="button" className={styles['tag-item']}>
                    <span>#{tag.name}</span>
                    <span>{tag.postCount}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className={styles['side-card']}>
              <h3 className={styles['side-title']}>today highlights</h3>
              <ul className={styles['hot-list']}>
                <li className={styles['hot-item']}>
                  <span>01</span>
                  <p>提高博客转化率的首页改版复盘</p>
                </li>
                <li className={styles['hot-item']}>
                  <span>02</span>
                  <p>服务端渲染在内容站里的收益边界</p>
                </li>
                <li className={styles['hot-item']}>
                  <span>03</span>
                  <p>从写作到发布的团队协作流</p>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default HomePage
