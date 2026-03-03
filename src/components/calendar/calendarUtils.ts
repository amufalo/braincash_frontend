export type CalendarDay = {
  date: string // YYYY-MM-DD
  label: string
  isCurrentMonth: boolean
  isToday: boolean
  transactions: { id: number; description: string; amount: number; transaction_type: string }[]
  totalIncome: number
  totalExpense: number
}

const getWeekdayIndex = (date: Date) => {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

export const formatDateKey = (date: Date) => date.toISOString().slice(0, 10)

export function buildCalendarDays(
  year: number,
  monthIndex: number,
  transactionsByDate: Map<string, { id: number; description: string; amount: number; transaction_type: string }[]>
): CalendarDay[] {
  const startOfMonth = new Date(year, monthIndex, 1)
  const offset = getWeekdayIndex(startOfMonth)
  const startDate = new Date(year, monthIndex, 1 - offset)
  const totalCells = 42
  const now = new Date()
  const todayKey = formatDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate()))

  const days: CalendarDay[] = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateKey = formatDateKey(d)
    const isCurrentMonth = d.getMonth() === monthIndex
    const list = transactionsByDate.get(dateKey) ?? []
    let totalIncome = 0
    let totalExpense = 0
    list.forEach((t) => {
      if (t.transaction_type === "INCOME") totalIncome += Number(t.amount)
      else totalExpense += Number(t.amount)
    })
    days.push({
      date: dateKey,
      label: String(d.getDate()),
      isCurrentMonth,
      isToday: dateKey === todayKey,
      transactions: list,
      totalIncome,
      totalExpense,
    })
  }
  return days
}

export const WEEK_DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
