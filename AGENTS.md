# Repository Guidelines

## Project Structure & Module Organization
- `apps/web` and `apps/docs` are Next.js App Router apps (`app/`, `public/`).
- `apps/admin` is a Vite + React app (`src/`, `public/`).
- `packages/ui` holds shared React components for the apps.
- `packages/eslint-config` and `packages/typescript-config` centralize lint and TS presets.
- Root workspace uses `pnpm-workspace.yaml` and Turborepo (`turbo.json`).

## Build, Test, and Development Commands
- `pnpm dev`: run all app dev servers via Turborepo.
- `pnpm build`: build all apps/packages.
- `pnpm lint`: lint all apps/packages.
- `pnpm check-types`: run TypeScript checks across the workspace.
- `pnpm format`: format `ts/tsx/md` using Prettier.
- App-specific examples:
  - `pnpm --filter web dev` (Next.js on :3000)
  - `pnpm --filter docs dev` (Next.js on :3001)
  - `pnpm --filter admin dev` (Vite default port)

## Coding Style & Naming Conventions
- TypeScript-first; prefer `.tsx` for React components.
- ESLint configs live in `packages/eslint-config`; run `pnpm lint` before PRs.
- Formatting: Prettier (see `pnpm format`).
- Component files in `packages/ui/src` are lowercase (`button.tsx`, `card.tsx`).

## Testing Guidelines
- No dedicated test framework is configured yet.
- Use `pnpm lint` and `pnpm check-types` as the required validation steps.
- If adding tests, document the runner in the app/package `README.md` and update this file.

## Commit & Pull Request Guidelines
- Commit history uses Conventional Commits with scopes (example: `feat(create-turbo): ...`).
- Keep commits focused and include a short scope (`web`, `docs`, `admin`, `ui`).
- PRs should include:
  - A brief summary of changes and rationale.
  - Linked issues (if any).
  - Screenshots or clips for UI changes (web/docs/admin).

## Environment Notes
- Node.js `>=18` and `pnpm@9` are required (`package.json` engines).
- Use workspace filters to target specific apps or packages.


编程规约
全部采用小写方式，以中划线分隔。

正例：mall-management-system

反例：mall_management-system / mallManagementSystem

1.1.1 项目命名
全部采用小写方式，以中划线分隔。
正例：mall-management-system
反例：mall_management-system / mallManagementSystem
1.1.2 目录命名
全部采用小写方式，以中划线分隔，有复数结构时，要采用复数命名法，缩写不用复数。
正例：scripts / styles / components / images / utils / layouts / demo-styles / demo-scripts / img / doc
反例：script / style / demo_scripts / demoStyles / imgs / docs
【特殊】Vue 、React的项目中的 components 中的组件目录，使用 kebab-case 命名
正例：head-search / page-loading / authorized / notice-icon
反例：HeadSearch / PageLoading
【特殊】Vue、React 的项目中的除 components 组件目录外的所有目录也使用 kebab-case 命名
正例：page-one / shopping-car / user-management
反例：ShoppingCar / UserManagement
1.1.3 JS、CSS、SCSS、HTML、PNG 文件命名
全部采用小写方式，以中划线分隔。
正例：render-dom.js / signup.css / index.html / company-logo.png
反例：renderDom.js / UserManagement.html
小组件：tsx,jsx: 首字母大写驼峰（除了index）。
1.1.4 命名严谨性
代码中的命名严禁使用拼音与英文混合的方式，更不允许直接使用中文的方式。说明：正确的英文拼写和语法可以让阅读者易于理解，避免歧义。注意，即使纯拼音命名方式也要避免采用。
正例：henan / luoyang / rmb 等国际通用的名称，可视同英文。
反例：DaZhePromotion / getPingfenByName()  / int 某变量 = 3
杜绝完全不规范的缩写，避免望文不知义。
反例：AbstractClass“缩写”命名成 AbsClass；condition“缩写”命名成 condi，此类随意缩写严重降低了代码的可阅读性。
.1 HTML 类型
推荐使用 HTML5 的文档类型申明：<!DOCTYPE html>。
（建议使用 text/html 格式的 HTML。避免使用 XHTML。XHTML 以及它的属性，比如 application/xhtml+xml 在浏览器中的应用支持与优化空间都十分有限）。
2.2 缩进
缩进使用 2 个空格（一个 tab）。
嵌套的节点应该缩进。
2.3 分块注释
在每一个块状元素，列表元素和表格元素后，加上一对 HTML 注释。注释格式如下：
暂时无法在飞书文档外展示此内容
2.4 语义化标签（不强求）
HTML5 中新增很多语义化标签，所以优先使用语义化标签，避免一个页面都是 div 或者 p 标签。
正例：
暂时无法在飞书文档外展示此内容
反例：
暂时无法在飞书文档外展示此内容
2.5 引号
使用双引号(" ") 而不是单引号(' ')。
正例：
暂时无法在飞书文档外展示此内容
反例：
暂时无法在飞书文档外展示此内容
三、CSS 规范
1.3.1 命名


类名使用小写字母，以中划线分隔（js中导入的除外，可以使用驼峰）。


id 采用驼峰式命名。


scss,less 中的变量、函数、混合、placeholder 采用驼峰式命名。


ID 和 class 的名称总是使用可以反应元素目的和用途的名称，或其他通用的名称，代替表象和晦涩难懂的名称。


不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
1.3.2 选择器

在 CSS 选择器中避免使用标签名，从结构、表现、行为分离的原则来看，应该尽量避免 CSS 中出现 HTML 标签，并且在 CSS 选择器中出现标签名会存在潜在的问题。
很多前端开发人员写选择器链的时候不使用直接子选择器。有时，这可能会导致疼痛的设计问题并且有时候可能会很耗性能。然而，在任何情况下，这是一个非常不好的做法。如果你不写很通用的，需要匹配到 DOM 末端的选择器，你应该总是考虑直接子选择器。

不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
1.3.3 尽量使用缩写属性
不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
1.3.4 每个选择器及属性独占一行
不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
1.3.5 省略0后面的单位
不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
1.3.6 避免使用 ID 选择器及全局标签选择器防止污染全局样式
不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
四、LESS 规范
1.4.1 代码组织


将公共 LESS 文件放置在 style/less/common 文件夹中，例如 color.less、common.less。


按以下顺序组织：@import、变量声明、样式声明。


暂时无法在飞书文档外展示此内容
1.4.2 避免嵌套层级过多


将嵌套深度限制在 3 级。对于超过 4 级的嵌套，需要重新评估。这可以避免出现过于详实的 CSS 选择器。


避免大量的嵌套规则。当可读性受到影响时，将之打断。推荐避免出现多于 20 行的嵌套规则。


不推荐：
暂时无法在飞书文档外展示此内容
推荐：
暂时无法在飞书文档外展示此内容
五、JavaScript 规范
1.5.1 命名


采用小写驼峰命名 lowerCamelCase，代码中的命名均不能以下划线，也不能以下划线或美元符号结束(python)。


反例： name_aae / name_/ name$


方法名、参数名、成员变量、局部变量都统一使用 lowerCamelCase 风格，必须遵从驼峰形式(form表单除外)。


正例： localValue / getHttpMessage() / inputUserId


方法命名必须是动词或者动词+名词形式。


正例：saveShopCarData / openShopCarInfoDialog


反例：save~~~~ / ~~~~open~~~~ / ~~~~show~~~~ / ~~~~go


常用的函数方法动词：


get 获取 / set 设置


add 增加 / remove 删除


create 创建 / destory 移除


start 启动 / stop 停止


open 打开 / close 关闭


read 读取 / write 写入


load 载入 / save 保存


begin 开始 / end 结束


backup 备份 / restore 恢复


import 导入 / export 导出


split 分割 / merge 合并


inject 注入 / extract 提取


attach 附着 / detach 脱离


bind 绑定 / separate 分离


view 查看 / browse 浏览


edit 编辑 / modify 修改


select 选取 / mark 标记


copy 复制 / paste 粘贴


undo 撤销 / redo 重做


insert 插入 / delete 移除


add 加入 / append 添加


clean 清理 / clear 清除


index 索引 / sort 排序


find 查找 / search 搜索


increase 增加 / decrease 减少


play 播放 / pause 暂停


launch 启动 / run 运行


compile 编译 / execute 执行


debug 调试 / trace 跟踪


observe 观察 / listen 监听


build 构建 / publish 发布


常量命名全部大写，单词间用下划线隔开，力求语义表达完整清楚，不要嫌名字长。


正例：MAX_STOCK_COUNT


反例：MAX_COUNT


1.5.2 代码格式


使用 2 个空格进行缩进。


正例：


暂时无法在飞书文档外展示此内容


不同逻辑、不同语义、不同业务的代码之间插入一个空行分隔开来以提升可读性。


说明：任何情形，没有必要插入多个空行进行隔开。


1.5.3 字符串


统一使用单引号(')，不使用双引号(")。这在创建 HTML 字符串非常有好处。


正例：


暂时无法在飞书文档外展示此内容

反例：

暂时无法在飞书文档外展示此内容


当字符串过长时，使用字符串模板（template string）进行拼接，不要使用加号(+)。


正例：


暂时无法在飞书文档外展示此内容

反例：

暂时无法在飞书文档外展示此内容
1.5.4 注释


单行注释采用//，双行及以上注释采用/*...*/。


正例：


暂时无法在飞书文档外展示此内容


函数注释必须包含函数说明、参数说明、返回值说明（可以为空），参数和返回值说明必须包含类型信息和说明。采用 JSDoc 规范。


正例：


暂时无法在飞书文档外展示此内容


类、模块、函数、变量等声明之间应该保留适当的空行，以提高代码可读性。


【不同类型之间，加空格，函数之间加空格】


正例：


暂时无法在飞书文档外展示此内容
1.5.5 变量声明


变量声明尽量使用const关键字，如果变量需要被重新赋值，使用let关键字。


说明：如果一个变量不需要被重新赋值，使用const关键字可以避免无意中修改变量的值，从而提高代码的可靠性。


正例：


暂时无法在飞书文档外展示此内容


不要使用var关键字声明变量。


说明：var声明的变量存在变量提升问题，容易造成意想不到的问题，使用let和const可以避免这个问题。


反例：


暂时无法在飞书文档外展示此内容
关于模块函数命名
每一个模块的页面的初始化获取数据的方法，都用一个标准通用的关键字来命名。
目标：减少了维护成本，不然维护其他伙伴的代码还要阅读一下，希望更加默契一点，哈哈。
比如：

初始化【init】


保存【onSave】


删除【onDelete】


增加【onAdd】。

这样看别人的代码。马上知道从哪里开始，哪些事件函数能够快速搜索到呢。
1.5.6 条件语句


在if语句中，即使只有一行代码，也要使用花括号{}将代码块括起来。


正例：


暂时无法在飞书文档外展示此内容


反例：


暂时无法在飞书文档外展示此内容


在进行比较时，使用===和!==来判断相等和不相等，不要使用==和!=。


说明：==和!=会进行类型转换，容易造成意想不到的问题。


正例：


暂时无法在飞书文档外展示此内容

反例：

暂时无法在飞书文档外展示此内容
1.5.7 Undefined 判断（试一下）
永远不要直接使用 undefined 进行变量判断，而应该使用 typeof 和字符串 'undefined' 对变量进行判断。
例如，正确的写法是：
暂时无法在飞书文档外展示此内容
而不是错误的写法：
暂时无法在飞书文档外展示此内容
1.5.8 条件判断和循环最多三层
条件判断能使用三目运算符和逻辑运算符解决的，就不要使用条件判断，但是注意不要写太长的三目运算符。如果超过 3 层请抽成函数，并写清楚注释。
1.5.9 this 的转换命名
对上下文 this 的引用只能使用 'self' 来命名。
1.5.10 慎用 console.log（自动化、刻意减少）
因为在非 webpack 项目中，大量使用 console.log 会导致性能问题，所以请谨慎使用 log 功能。
六、Typescript规范
1. 文件
   尽量定义在单独的文件中，以xxx.d.ts命名
2. 类型
   1）不要使用如下类型Number，String，Boolean等，应该使用类型number，string，and boolean；
   2）推荐使用接口（interface）来声明对象的类型，复杂类型推荐使用类型别名Type。
3. 枚举
   使用大驼峰命名法来命名枚举的名字和枚举的键(key)。
   二、React 项目规范
   2.1.1 组件规范


组件名为多个单词。


组件名应该始终是多个单词组成（大于等于 2），且命名规范为 KebabCase 格式。这样做可以避免与现有的以及未来的 HTML 元素相冲突，因为所有的 HTML 元素名称都是单个单词的。


正例：


暂时无法在飞书文档外展示此内容


反例：


暂时无法在飞书文档外展示此内容


组件文件名为 PascalCase 格式。




正例：


暂时无法在飞书文档外展示此内容


反例：


暂时无法在飞书文档外展示此内容


基础组件文件名以 base 开头，使用完整单词而不是缩写。




正例：


暂时无法在飞书文档外展示此内容


和父组件紧密耦合的子组件应该以父组件名作为前缀命名(大写驼峰)




正例：


暂时无法在飞书文档外展示此内容


反例：


暂时无法在飞书文档外展示此内容


在 Template 模板中使用组件，应使用 PascalCase 模式，并且使用自闭合组件。




正例：


暂时无法在飞书文档外展示此内容


反例：


暂时无法在飞书文档外展示此内容


Prop 定义应该尽量详细：




必须使用 camelCase 驼峰命名。


必须指定类型。


必须加上注释，表明其含义。




如果特性元素较多，应该主动换行。



正例：

暂时无法在飞书文档外展示此内容

反例：

暂时无法在飞书文档外展示此内容
2.1.2 必须为 map 设置键值 key
2.1.3 Router 规范

页面跳转数据传递使用路由参数

页面跳转时，如果需要将数据从一个页面传递到另一个页面，推荐使用路由参数进行传参，而不是将数据保存在 store中，然后在另一个页面取出 store 的数据。因为如果在另一个页面刷新会导致 store 数据丢失，导致页面无法正常显示数据。
正例：
暂时无法在飞书文档外展示此内容


使用路由懒加载（延迟加载）机制


使用路由懒加载机制，可以提高应用的加载速度，只有当需要使用某个路由时，才会去加载对应的组件。
暂时无法在飞书文档外展示此内容


router 中的命名规范


path~~~~、~~~~childrenPoints~~~~ 命名规范采用 kebab-case 命名规范，而 ~~~~name~~~~ 命名规范采用 KebabCase 命名规范且和组件名保持一致。
暂时无法在飞书文档外展示此内容


router 中的 path 命名规范


path 除了采用 kebab-case 命名规范以外，必须以 / 开头，即使是 children 里的 path 也要以 / 开头。
目的：经常有这样的场景，某个页面有问题，要立刻找到对应的 tsx 文件，如果不用以 / 开头，path 是由 parent 和 children 组成的，可能需要在 router 文件里搜索多次才能找到，而如果以 / 开头，则能立刻搜索到对应的组件。
暂时无法在飞书文档外展示此内容
2.2 React 项目目录规范
2.2.1 基础
React 项目中的所有命名一定要与后端命名统一。例如权限，在后端使用 privilege 这个单词时，前端无论是 router、store、api 等都必须使用 privilege 这个单词。
2.2.2 前端标准化项目模板
使用 pro5来初始化项目，项目名按照命名规范进行命名。
2.2.3 目录说明
目录名按照命名规范进行命名，其中 components 组件用大写驼峰，其余除 components 组件目录外的所有目录均使用 kebab-case 命名。
暂时无法在飞书文档外展示此内容
1) api 目录
   在 api 目录中，文件和变量的命名应与后端保持一致。该目录对应着后端 API 接口，应按照后端一个 controller 对应一个 api.js 文件的规则进行组织。如果项目比较大，可以根据业务需求将其划分为子目录，并与后端保持一致。在 api 中，方法名应尽量与后端 API 的 URL 保持语义上的一致。每个方法都应该添加注释，注释内容应与后端的 Swagger 文档保持一致。（swagger后端给出来）
   正例：
   后端 URL：EmployeeController.java
   暂时无法在飞书文档外展示此内容
   前端：employee.js
   暂时无法在飞书文档外展示此内容
2) assets 目录
   assets 目录用于存放静态资源，包括 images、styles、icons 等。静态资源的命名应采用 kebab-case 的格式。
   暂时无法在飞书文档外展示此内容
3) components 目录
   components 目录应按照组件进行目录划分，并采用 kebab-case 命名规则。组件的命名规则也应为 kebab-case。
   暂时无法在飞书文档外展示此内容
4) constants 目录
   该目录用于存放项目中所有的常量。目录结构如下：
   暂时无法在飞书文档外展示此内容
   例子：employee.js
   暂时无法在飞书文档外展示此内容
5) router 与 store 目录
   这两个目录一定要将业务进行拆分，不能放到一个 js 文件里。在 router 中，应该尽量按照 views 中的结构进行组织。在 store 中，应该按照业务进行拆分，不同的业务应该放到不同的 js 文件中。
   2.2.4 注释说明
   需要添加注释的地方包括：


公共组件的使用说明


api 目录中的接口 js 文件必须添加注释（除了正删改查）


store 中的 state、mutation、action 等必须添加注释

