/**
 * 用户信息管理工具
 * 负责从URL获取用户信息并存储到localStorage
 */

const USER_INFO_KEY = 'userInfo'
const USER_TOKEN_KEY = 'token'

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
 * @returns {Object|null} 用户信息对象，如果不存在则返回null
 */
export function getUserInfo() {
  try {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY)
    if (!userInfoStr) {
      return null
    }
    return JSON.parse(userInfoStr)
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
 * @param {string} url - 可选，默认为当前窗口URL
 * @returns {Object|null} 保存的用户信息，如果失败则返回null
 */
export function initUserInfoFromURL(url = window.location.href) {
  // 如果localStorage中已有用户信息，可以选择是否覆盖
  // 这里默认如果URL中有用户信息，则更新localStorage
  const urlUserInfo = parseUserInfoFromURL(url)
  
  if (Object.keys(urlUserInfo).length > 0) {
    const saved = saveUserInfo(urlUserInfo)
    if (saved) {
      console.log('用户信息已从URL保存到localStorage:', urlUserInfo)
      
      // 可选：清除URL中的用户信息参数（避免敏感信息暴露在URL中）
      // 注意：这需要谨慎使用，可能会影响用户体验
      // cleanUserInfoFromURL()
      
      return urlUserInfo
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
 * 检查当前用户是否是管理员
 * 判断逻辑：
 * 1. 检查用户信息中的 role 字段是否为 'admin' 或 '管理员'
 * 2. 检查用户的 jobNo 是否与 localStorage 中的 adminJobNo 匹配
 * 3. 检查用户信息中是否有 isAdmin 字段为 true
 * @returns {boolean} 是否是管理员
 */
export function isAdmin() {
  try {
    const userInfo = getUserInfo()
    if (!userInfo) {
      return false
    }
    
    // 方式1: 检查 role 字段
    if (userInfo.role) {
      const role = String(userInfo.role).toLowerCase()
      if (role === 'admin' || role === '管理员' || role === 'administrator') {
        return true
      }
    }
    
    // 方式2: 检查 isAdmin 字段
    if (userInfo.isAdmin === true || userInfo.is_admin === true) {
      return true
    }
    
    // 方式3: 检查 jobNo 是否匹配管理员工号
    if (userInfo.jobNo) {
      const adminJobNo = localStorage.getItem('adminJobNo')
      if (adminJobNo && userInfo.jobNo === adminJobNo) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return false
  }
}

/**
 * 在dev模式下保存管理员工号到localStorage
 * 从环境变量 VITE_ADMIN_JOB_NO 中读取管理员工号
 * @returns {boolean} 是否成功保存
 */
export function saveAdminJobNoInDevMode() {
  // 检查是否是开发模式
  if (!import.meta.env.DEV) {
    return false
  }
  
  // 从环境变量中获取管理员工号
  const adminJobNo = import.meta.env.VITE_DEV_JOB_NO
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
  isAdmin
}

