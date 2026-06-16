import type { Post } from '@/types/post'
import { v4 as uuidv4 } from 'uuid'
import DEFAULT_CONTENT from '@/assets/example/markdown.md?raw'
import { addPrefix } from '@/utils'
import { store } from '@/utils/storage'

export type { Post } from '@/types/post'

/**
 * 文章管理 Store ——「持久化内容的唯一真相源」
 *
 * 角色边界(Phase 3.3 明确):
 *   - 持有文章列表(`posts`)与当前文章指针(`currentPostId` / `currentPost`)
 *   - 文章内容 (`Post.content`) 是**持久化状态**,通过 `store.reactive`
 *     自动写 localStorage
 *   - 跨组件读"当前文章是谁/写了什么"一律走这里;`updatePostContent` 是
 *     **唯一**合法的写入入口(EditorPanel 的双向同步、FolderSourcePanel
 *     的文件加载、TemplateDialog 的模板应用都走这条路径)
 *
 * 与 `useEditorStore` 的关系:
 *   - CodeMirror doc 是**实时编辑状态**,本 store 是**持久化状态**
 *   - 二者由 EditorPanel.vue 通过 debounce 同步,正常情况下毫秒级一致
 *
 * 与 `useFolderSourceStore` 的关系:
 *   - 文件夹源**不是**独立的内容源;选中文件后通过 `updatePostContent` 写入本
 *     store,文件夹是"读侧"的额外数据源,不绕过本 store
 *
 * 与 `useTemplateStore` 的关系:
 *   - 模板只是"创建新文章时复用的初稿",不参与 currentPost 的生命周期
 */
export const usePostStore = defineStore(`post`, () => {
  // 内容列表
  const posts = store.reactive<Post[]>(addPrefix(`posts`), [
    {
      id: uuidv4(),
      title: `认识一下：内容同步智能体`,
      content: DEFAULT_CONTENT,
      history: [
        { datetime: new Date().toLocaleString(`zh-cn`), content: DEFAULT_CONTENT },
      ],
      createDatetime: new Date(),
      updateDatetime: new Date(),
    },
  ])

  // 当前文章 ID
  const currentPostId = store.reactive(addPrefix(`current_post_id`), ``)

  // 在补齐 id 后，若 currentPostId 无效 ➜ 自动指向第一篇
  onBeforeMount(() => {
    posts.value = posts.value.map((post, index) => {
      const now = Date.now()
      return {
        ...post,
        id: post.id ?? uuidv4(),
        createDatetime: post.createDatetime ?? new Date(now + index),
        updateDatetime: post.updateDatetime ?? new Date(now + index),
      }
    })

    // 兼容：如果本地没有 currentPostId，或指向的文章已不存在
    if (!currentPostId.value || !posts.value.some(p => p.id === currentPostId.value)) {
      currentPostId.value = posts.value[0]?.id ?? ``
    }
  })

  // 根据 id 找索引
  const findIndexById = (id: string) => posts.value.findIndex(p => p.id === id)

  // computed: 让旧代码还能用 index，但底层映射 id
  const currentPostIndex = computed<number>({
    get: () => findIndexById(currentPostId.value),
    set: (idx) => {
      if (idx >= 0 && idx < posts.value.length) {
        currentPostId.value = posts.value[idx].id
      }
    },
  })

  // 获取 Post
  const getPostById = (id: string) => posts.value.find(p => p.id === id)

  // 获取当前文章
  const currentPost = computed(() => getPostById(currentPostId.value))

  // 添加文章
  const addPost = (title: string, parentId: string | null = null) => {
    const newPost: Post = {
      id: uuidv4(),
      title,
      content: `# ${title}`,
      history: [
        { datetime: new Date().toLocaleString(`zh-cn`), content: `# ${title}` },
      ],
      createDatetime: new Date(),
      updateDatetime: new Date(),
      parentId,
    }
    posts.value.push(newPost)
    currentPostId.value = newPost.id
  }

  // 重命名文章
  const renamePost = (id: string, title: string) => {
    const post = getPostById(id)
    if (post) {
      post.title = title
      post.updateDatetime = new Date()
    }
  }

  // 删除文章
  const delPost = (id: string, recursive: boolean = false) => {
    const post = getPostById(id)
    if (!post)
      return

    if (recursive) {
      const getChildIds = (parentId: string): string[] => {
        const children = posts.value.filter(p => p.parentId === parentId)
        return children.reduce((acc, child) => {
          return acc.concat(child.id, getChildIds(child.id))
        }, [] as string[])
      }

      const allIdsToDelete = [id, ...getChildIds(id)]
      allIdsToDelete.forEach((toDelId) => {
        const idx = findIndexById(toDelId)
        if (idx !== -1) {
          posts.value.splice(idx, 1)
        }
      })

      if (!posts.value.some(p => p.id === currentPostId.value)) {
        currentPostId.value = posts.value[Math.max(0, posts.value.length - 1)]?.id ?? ``
      }
      return
    }

    // 子内容挂靠到父级的父级
    const newParentId = post.parentId ?? null
    posts.value.forEach((p) => {
      if (p.parentId === id) {
        p.parentId = newParentId
        p.updateDatetime = new Date()
      }
    })

    const idx = findIndexById(id)
    if (idx === -1)
      return

    posts.value.splice(idx, 1)
    currentPostId.value = posts.value[Math.min(idx, posts.value.length - 1)]?.id ?? ``
  }

  // 更新文章父 ID
  const updatePostParentId = (postId: string, parentId: string | null) => {
    const post = getPostById(postId)
    if (post) {
      post.parentId = parentId
      post.updateDatetime = new Date()
    }
  }

  // 更新文章内容
  const updatePostContent = (id: string, content: string) => {
    const post = getPostById(id)
    if (post) {
      post.content = content
      post.updateDatetime = new Date()
    }
  }

  // 收起所有文章
  const collapseAllPosts = () => {
    posts.value.forEach((post) => {
      post.collapsed = true
    })
  }

  // 展开所有文章
  const expandAllPosts = () => {
    posts.value.forEach((post) => {
      post.collapsed = false
    })
  }

  return {
    // State
    posts,
    currentPostId,
    currentPostIndex,
    currentPost,

    // Getters
    getPostById,
    findIndexById,

    // Actions
    addPost,
    renamePost,
    delPost,
    updatePostParentId,
    updatePostContent,
    collapseAllPosts,
    expandAllPosts,
  }
})
