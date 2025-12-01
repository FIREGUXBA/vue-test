// 数据生成函数
export const generateData = () => {
  const depts = ['TGFW测试组', 'USM测试组', '前端架构组', '后端服务组']
  const names = ['苟鸿林', '侯佳林', '刘凯', '邱宇', '巫静波', '肖洋', '赵燕子', '陈泉有', '刘广航', '刘爽', '刘潇', '郑一博', '李明', '王强']
  const months = ['25.01', '25.02', '25.03', '25.04', '25.05', '25.06', '25.07', '25.08', '25.09', '25.10', '25.11', '25.12']

  return names.map((name, i) => {
    const dept = depts[i % depts.length]
    const monthlyHours = {}
    months.forEach(m => {
      monthlyHours[m] = parseFloat((Math.random() * 3 + 8.5).toFixed(2))
    })

    return {
      id: `u-${i}`,
      name: name,
      dept,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`,
      monthlyHours,
      stats: {
        missingCard: Math.floor(Math.random() * 5),
        businessTrip: Math.floor(Math.random() * 3),
        compLeave: Math.floor(Math.random() * 2),
        leave: Math.floor(Math.random() * 4),
        late: Math.floor(Math.random() * 6),
      },
      role: '高级工程师',
      hours: Math.floor(monthlyHours['25.06'] * 22),
      standard: 176,
      percentage: Math.min(100, Math.round((monthlyHours['25.06'] * 22 / 176) * 100)),
      status: monthlyHours['25.06'] > 10 ? 'overtime' : (monthlyHours['25.06'] < 9 ? 'under' : 'normal')
    }
  })
}

export const allMonthKeys = ['25.01', '25.02', '25.03', '25.04', '25.05', '25.06', '25.07', '25.08', '25.09', '25.10', '25.11', '25.12']

// 工具函数
export const getCellColor = (val, allValuesInColumn) => {
  // 小于9小时
  if (val < 9) return 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]/50 font-medium shadow-[0_1px_2px_rgba(220,38,38,0.05)]'

  const sorted = [...allValuesInColumn].sort((a, b) => b - a)
  // 前3
  const top3 = sorted.slice(0, 3)
  // 后3
  const bottom3 = sorted.slice(-3)

  if (top3.includes(val)) return 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]/50 font-medium shadow-[0_1px_2px_rgba(22,163,74,0.05)]'
  if (bottom3.includes(val)) return 'bg-[#FEFCE8] text-[#A16207] border border-[#FEF08A]/50 font-medium shadow-[0_1px_2px_rgba(202,138,4,0.05)]'

  return 'text-gray-600'
}

