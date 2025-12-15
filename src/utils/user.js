/**
 * 用户信息管理工具
 * 
 * 生产环境：仅从URL获取用户信息并存储到localStorage，如果URL中没有则跳过存储
 * 开发环境：优先从URL获取用户信息，如果URL中没有则使用硬编码配置（DEV_MODE_USER_INFO）
 */

const USER_INFO_KEY = 'userInfo'
const USER_TOKEN_KEY = 'token'

// 开发环境硬编码的用户信息（仅在开发模式下使用）
// 当URL中没有用户信息时，将使用此配置
const DEV_MODE_USER_INFO = {
  // 在这里配置开发环境的用户信息
  // 例如：userId, userName, token, jobNo, role 等
  // userId: 'dev_user_001',
  // userName: '开发用户',
  // token: 'dev_token_123456',
  jobNo: 'CD0097',
  // role: 'admin',
  // name: '开发测试用户'
}

/**
 * 从URL查询参数中解析用户信息
 * @param {string} url - 可选，默认为当前窗口URL
 * @returns {Object} 用户信息对象
 */
export function parseUserInfoFromURL(url = window.location.href) {
  try {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)
    
    // 优先处理 storageData 参数（包含完整的localStorage数据）
    if (params.has('storageData')) {
      try {
        const storageDataStr = decodeURIComponent(params.get('storageData'))
        const storageData = JSON.parse(storageDataStr)
        
        // 提取 localStorage 对象中的所有数据
        if (storageData.localStorage && typeof storageData.localStorage === 'object') {
          const userInfo = { ...storageData.localStorage }
          
          // 如果 userInfo 是字符串，需要再次解析
          if (userInfo.userInfo && typeof userInfo.userInfo === 'string') {
            try {
              const parsedUserInfo = JSON.parse(userInfo.userInfo)
              // 合并解析后的userInfo到主对象
              Object.assign(userInfo, parsedUserInfo)
              // 保留原始userInfo字符串
              userInfo.userInfoRaw = userInfo.userInfo
            } catch (e) {
              console.warn('解析userInfo字符串失败:', e)
            }
          }
          
          // 提取 toolInfo 和 timestamp（如果需要）
          if (storageData.toolInfo) {
            userInfo.toolInfo = storageData.toolInfo
          }
          if (storageData.timestamp) {
            userInfo.timestamp = storageData.timestamp
          }
          
          return userInfo
        }
      } catch (e) {
        console.warn('解析storageData参数失败:', e)
      }
    }
    
    // 常见的用户信息参数名（兼容其他格式）
    const userInfo = {}
    
    // 解析可能的用户信息字段
    if (params.has('userId') || params.has('user_id') || params.has('id')) {
      userInfo.userId = params.get('userId') || params.get('user_id') || params.get('id')
    }
    
    if (params.has('userName') || params.has('user_name') || params.has('name')) {
      userInfo.userName = params.get('userName') || params.get('user_name') || params.get('name')
    }
    
    if (params.has('token') || params.has('access_token') || params.has('accessToken')) {
      userInfo.token = params.get('token') || params.get('access_token') || params.get('accessToken')
    }
    
    if (params.has('email')) {
      userInfo.email = params.get('email')
    }
    
    if (params.has('dept') || params.has('department')) {
      userInfo.dept = params.get('dept') || params.get('department')
    }
    
    if (params.has('employeeId') || params.has('employee_id')) {
      userInfo.employeeId = params.get('employeeId') || params.get('employee_id')
    }
    
    // 如果URL中有完整的用户信息JSON字符串（base64编码或直接JSON）
    if (params.has('userInfo')) {
      try {
        const decoded = decodeURIComponent(params.get('userInfo'))
        const parsed = JSON.parse(decoded)
        Object.assign(userInfo, parsed)
      } catch (e) {
        console.warn('解析userInfo参数失败:', e)
      }
    }
    
    // 如果URL中有base64编码的用户信息
    if (params.has('userInfoBase64')) {
      try {
        const decoded = atob(params.get('userInfoBase64'))
        const parsed = JSON.parse(decoded)
        Object.assign(userInfo, parsed)
      } catch (e) {
        console.warn('解析userInfoBase64参数失败:', e)
      }
    }
    
    return userInfo
  } catch (error) {
    console.error('解析URL用户信息失败:', error)
    return {}
  }
}

/**
 * 保存用户信息到localStorage
 * @param {Object} userInfo - 用户信息对象
 */
export function saveUserInfo(userInfo) {
  if (!userInfo || Object.keys(userInfo).length === 0) {
    return false
  }
  
  try {
    // 保存完整的用户信息
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
    
    // 如果用户信息中包含token，单独保存（兼容现有代码）
    if (userInfo.token) {
      localStorage.setItem(USER_TOKEN_KEY, userInfo.token)
      localStorage.setItem('token', userInfo.token) // 兼容其他可能的key
    }
    
    // 保存其他可能需要的字段到localStorage（如果存在）
    const fieldsToSave = [
      'username', 'userId', 'realName', 'userType', 
      'email', 'jobNo', 'role', 'product', 'lastLogin'
    ]
    
    fieldsToSave.forEach(field => {
      if (userInfo[field] !== undefined && userInfo[field] !== null) {
        localStorage.setItem(field, String(userInfo[field]))
      }
    })
    
    // 如果存在 userInfoRaw（原始userInfo字符串），也保存
    if (userInfo.userInfoRaw) {
      localStorage.setItem('userInfo', userInfo.userInfoRaw)
    }
    
    // 保存时间戳，用于判断信息是否过期
    localStorage.setItem(`${USER_INFO_KEY}_timestamp`, Date.now().toString())
    
    return true
  } catch (error) {
    console.error('保存用户信息到localStorage失败:', error)
    return false
  }
}

/**
 * 从localStorage获取用户信息
 * 生产环境：仅从localStorage读取
 * 开发环境：优先从localStorage读取，如果localStorage中没有则返回硬编码配置
 * @returns {Object|null} 用户信息对象，如果不存在则返回null
 */
export function getUserInfo() {
  try {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY)
    if (userInfoStr) {
      return JSON.parse(userInfoStr)
    }
    
    // localStorage中没有用户信息
    // 开发环境下，如果硬编码配置存在，则返回硬编码配置
    if (import.meta.env.DEV && Object.keys(DEV_MODE_USER_INFO).length > 0) {
      return DEV_MODE_USER_INFO
    }
    
    return null
  } catch (error) {
    console.error('从localStorage获取用户信息失败:', error)
    return null
  }
}

/**
 * 获取用户token
 * @returns {string|null} token字符串，如果不存在则返回null
 */
export function getUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY) || localStorage.getItem('token')
}

/**
 * 清除用户信息
 */
export function clearUserInfo() {
  try {
    localStorage.removeItem(USER_INFO_KEY)
    localStorage.removeItem(USER_TOKEN_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem(`${USER_INFO_KEY}_timestamp`)
  } catch (error) {
    console.error('清除用户信息失败:', error)
  }
}

/**
 * 检查用户信息是否存在
 * @returns {boolean} 是否存在用户信息
 */
export function hasUserInfo() {
  return getUserInfo() !== null
}

/**
 * 初始化用户信息（从URL获取并保存到localStorage）
 * 生产环境：仅从URL获取，如果URL中有则保存，没有则跳过
 * 开发环境：优先从URL获取，如果URL中没有则使用硬编码配置并保存
 * @param {string} url - 可选，默认为当前窗口URL
 * @returns {Object|null} 保存的用户信息，如果失败则返回null
 */
export function initUserInfoFromURL(url = window.location.href) {
  const isDev = import.meta.env.DEV
  const isProd = import.meta.env.PROD
  
  // 从URL解析用户信息
  const urlUserInfo = parseUserInfoFromURL(url)
  const hasUrlUserInfo = Object.keys(urlUserInfo).length > 0
  
  // 生产环境：仅从URL获取
  if (isProd) {
    if (hasUrlUserInfo) {
      const saved = saveUserInfo(urlUserInfo)
      if (saved) {
        console.log('生产环境：用户信息已从URL保存到localStorage:', urlUserInfo)
        return urlUserInfo
      }
    }
    // URL中没有用户信息，跳过存储
    return null
  }
  
  // 开发环境：优先使用URL中的信息，如果没有则使用硬编码配置
  if (isDev) {
    if (hasUrlUserInfo) {
      // URL中有用户信息，优先使用
      const saved = saveUserInfo(urlUserInfo)
      if (saved) {
        console.log('开发环境：用户信息已从URL保存到localStorage:', urlUserInfo)
        return urlUserInfo
      }
    } else {
      // URL中没有用户信息，使用硬编码配置
      if (Object.keys(DEV_MODE_USER_INFO).length > 0) {
        const saved = saveUserInfo(DEV_MODE_USER_INFO)
        if (saved) {
          console.log('开发环境：使用硬编码用户信息保存到localStorage:', DEV_MODE_USER_INFO)
          return DEV_MODE_USER_INFO
        }
      }
    }
  }
  
  return null
}

/**
 * 清除URL中的用户信息参数（可选功能）
 * 注意：这会修改浏览器历史记录，需要谨慎使用
 */
export function cleanUserInfoFromURL() {
  try {
    const url = new URL(window.location.href)
    const paramsToRemove = [
      'storageData', // 新增：清除storageData参数
      'userId', 'user_id', 'id',
      'userName', 'user_name', 'name',
      'token', 'access_token', 'accessToken',
      'email', 'dept', 'department',
      'employeeId', 'employee_id',
      'userInfo', 'userInfoBase64'
    ]
    
    let hasChanges = false
    paramsToRemove.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param)
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      // 使用replaceState避免在历史记录中留下记录
      window.history.replaceState({}, '', url.toString())
    }
  } catch (error) {
    console.error('清除URL用户信息参数失败:', error)
  }
}

/**
 * 获取用户信息的特定字段
 * @param {string} key - 字段名
 * @param {*} defaultValue - 默认值
 * @returns {*} 字段值
 */
export function getUserInfoField(key, defaultValue = null) {
  const userInfo = getUserInfo()
  return userInfo?.[key] ?? defaultValue
}

/**
 * 获取用户角色
 * @returns {string|null} 用户角色（'super' | 'admin' | 'common'），如果不存在则返回 null
 */
export function getUserRole() {
  try {
    const userInfo = getUserInfo()
    if (!userInfo) {
      return null
    }
    
    // 优先检查 role 字段
    if (userInfo.role) {
      const role = String(userInfo.role).toLowerCase().trim()
      // 支持 'super', 'admin', 'common' 以及中文 '超级管理员', '管理员', '普通用户'
      if (role === 'super' || role === '超级管理员') {
        return 'super'
      }
      if (role === 'admin' || role === '管理员' || role === 'administrator') {
        return 'admin'
      }
      if (role === 'common' || role === '普通用户' || role === '普通') {
        return 'common'
      }
      // 如果 role 字段存在但不在预期范围内，返回原始值
      return role
    }
    
    // 兼容旧的 isAdmin 字段
    if (userInfo.isAdmin === true || userInfo.is_admin === true) {
      return 'admin'
    }
    
    // 仅在开发模式下检查 jobNo 是否匹配管理员工号
    if (import.meta.env.DEV && userInfo.jobNo) {
      const adminJobNo = import.meta.env.VITE_ADMIN_JOB_NO
      if (adminJobNo && userInfo.jobNo === adminJobNo) {
        return 'admin'
      }
    }
    
    return null
  } catch (error) {
    console.error('获取用户角色失败:', error)
    return null
  }
}

/**
 * 检查当前用户是否是超级管理员
 * 超级管理员（role='super'）可以访问所有页面
 * @returns {boolean} 是否是超级管理员
 */
export function isSuperAdmin() {
  const role = getUserRole()
  return role === 'super'
}

/**
 * 检查当前用户是否是管理员
 * 管理员包括超级管理员和普通管理员
 * 判断逻辑：
 * 1. 检查用户信息中的 role 字段是否为 'super', 'admin' 或对应的中文
 * 2. 检查用户信息中是否有 isAdmin 字段为 true
 * 3. 仅在开发模式下：检查用户的 jobNo 是否与环境变量 VITE_ADMIN_JOB_NO 匹配
 * 
 * 注意：生产环境下只依赖后端返回的用户信息，不依赖前端环境变量
 * @returns {boolean} 是否是管理员（包括超级管理员）
 */
export function isAdmin() {
  const role = getUserRole()
  return role === 'super' || role === 'admin'
}

/**
 * 在dev模式下保存管理员工号到localStorage
 * 从环境变量 VITE_ADMIN_JOB_NO 中读取管理员工号
 * 
 * 注意：现在推荐直接在 DEV_MODE_USER_INFO 中硬编码用户信息，
 * 此函数保留用于从环境变量读取的场景
 * @returns {boolean} 是否成功保存
 */
export function saveAdminJobNoInDevMode() {
  // 检查是否是开发模式
  if (!import.meta.env.DEV) {
    return false
  }
  
  // 从环境变量中获取管理员工号
  const adminJobNo = import.meta.env.VITE_ADMIN_JOB_NO
  const adminName = import.meta.env.VITE_DEV_NAME
  if (!adminJobNo) {
    console.warn('开发模式下未找到管理员工号环境变量 VITE_ADMIN_JOB_NO')
    return false
  }
  
  try {
    // 保存管理员工号到localStorage
    localStorage.setItem('adminJobNo', adminJobNo)
    localStorage.setItem('adminName', adminName)
    // 同时更新用户信息中的jobNo（如果当前没有用户信息或用户信息中没有jobNo）
    const currentUserInfo = getUserInfo()
    if (!currentUserInfo || !currentUserInfo.jobNo || !currentUserInfo.name) {
      const updatedUserInfo = currentUserInfo ? { ...currentUserInfo } : {}
      updatedUserInfo.jobNo = adminJobNo
      updatedUserInfo.name = adminName
      saveUserInfo(updatedUserInfo)
      console.log('开发模式：已将管理员工号保存到localStorage:', adminJobNo)
    } else {
      console.log('开发模式：非管理员工号已存在，跳过覆盖')
    }
    
    return true
  } catch (error) {
    console.error('开发模式下保存管理员工号失败:', error)
    return false
  }
}

// 导出默认对象，方便使用
export default {
  parseUserInfoFromURL,
  saveUserInfo,
  getUserInfo,
  getUserToken,
  clearUserInfo,
  hasUserInfo,
  initUserInfoFromURL,
  cleanUserInfoFromURL,
  getUserInfoField,
  saveAdminJobNoInDevMode,
  getUserRole,
  isSuperAdmin,
  isAdmin
}

