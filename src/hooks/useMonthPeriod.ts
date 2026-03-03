import { useSearchParams } from "react-router-dom"
import { useMemo } from "react"

const PERIOD_PARAM = "period"

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

export function useMonthPeriod() {
  const [searchParams, setSearchParams] = useSearchParams()
  const now = new Date()
  const defaultYear = now.getFullYear()
  const defaultMonth = now.getMonth() + 1
  const defaultPeriod = formatPeriod(defaultYear, defaultMonth)

  const periodParam = searchParams.get(PERIOD_PARAM)
  const { period, year, month, monthName, periodLabel } = useMemo(() => {
    if (!periodParam || periodParam.length !== 7) {
      return {
        period: defaultPeriod,
        year: defaultYear,
        month: defaultMonth,
        monthName: MONTH_NAMES[defaultMonth - 1],
        periodLabel: `${MONTH_NAMES[defaultMonth - 1]} ${defaultYear}`,
      }
    }
    const [y, m] = periodParam.split("-").map(Number)
    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
      return {
        period: defaultPeriod,
        year: defaultYear,
        month: defaultMonth,
        monthName: MONTH_NAMES[defaultMonth - 1],
        periodLabel: `${MONTH_NAMES[defaultMonth - 1]} ${defaultYear}`,
      }
    }
    const monthName = MONTH_NAMES[m - 1] ?? ""
    return {
      period: formatPeriod(y, m),
      year: y,
      month: m,
      monthName,
      periodLabel: `${monthName} ${y}`,
    }
  }, [periodParam, defaultPeriod, defaultYear, defaultMonth])

  const setPeriod = (newPeriod: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(PERIOD_PARAM, newPeriod)
    setSearchParams(next, { replace: true })
  }

  const prevPeriod = useMemo(() => {
    if (month === 1) return formatPeriod(year - 1, 12)
    return formatPeriod(year, month - 1)
  }, [year, month])

  const nextPeriod = useMemo(() => {
    if (month === 12) return formatPeriod(year + 1, 1)
    return formatPeriod(year, month + 1)
  }, [year, month])

  const isCurrentMonth = period === defaultPeriod

  return {
    period,
    periodLabel,
    year,
    month,
    monthName,
    setPeriod,
    prevPeriod,
    nextPeriod,
    isCurrentMonth,
    defaultPeriod,
  }
}

export { PERIOD_PARAM, MONTH_NAMES }
