'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { dashboardService } from '@/lib/api/dashboard.service'
import { groupsService } from '@/lib/api/groups.service'
import { useDashboardStore } from '@/stores/dashboard-store'
import { LineChart } from '@/components/charts/line-chart'
import { DoughnutChart } from '@/components/charts/doughnut-chart'
import { AccountGroupCard } from '@/components/dashboard/account-group-card'
import { GroupDetailModal } from '@/components/groups/group-detail-modal'
import { CreateGroupModal } from '@/components/groups/create-group-modal'
import { DashboardHistoryResponse, AccountGroup } from '@/types'
import { AccountGroupIcon } from '@/lib/icons'
import { useTheme } from '@/components/providers/theme-provider'

type TimeRange = '1M' | '3M' | '1Y' | 'ALL'

export default function DashboardPage() {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const {
    dashboardData,
    balanceHistory,
    selectedSeries,
    isLoading,
    error,
    setDashboardData,
    setBalanceHistory,
    setSelectedSeries,
    setLoading,
    setError,
  } = useDashboardStore()

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('ALL')
  const [fullHistoryResponse, setFullHistoryResponse] = useState<DashboardHistoryResponse | null>(null)
  const [fullGroups, setFullGroups] = useState<AccountGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<AccountGroup | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pinnedGroups, setPinnedGroups] = useState<string[]>(() => {
    // Load pinned groups from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pinnedGroups')
      return saved ? JSON.parse(saved) : []
    }
    return []
  }) // Store pinned group IDs
  const [isDraggingOver, setIsDraggingOver] = useState(false) // Track drag over state

  // Save pinned groups to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinnedGroups', JSON.stringify(pinnedGroups))
    }
  }, [pinnedGroups])

  const refreshDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch dashboard data (includes groups with balances)
      const data = await dashboardService.getDashboardData()
      setDashboardData(data)

      // Fetch full balance history response (includes group histories)
      const historyResponse = await dashboardService.getBalanceHistory()
      setFullHistoryResponse(historyResponse)
      setBalanceHistory(historyResponse.total_history || [])

      // Fetch full account groups with account counts
      const groupsData = await groupsService.getGroups()
      setFullGroups(groupsData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const refreshGroups = async () => {
    try {
      const groupsData = await groupsService.getGroups()
      setFullGroups(groupsData)
      // Also refresh dashboard data to update totals
      await refreshDashboard()
    } catch (error) {
      console.error('Failed to refresh groups:', error)
    }
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return

    setIsDeleting(true)
    try {
      await groupsService.deleteGroup(groupToDelete.id)
      setGroupToDelete(null)
      await refreshGroups()
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Failed to delete group. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    refreshDashboard()
  }, [])

  // Filter balance history based on selected time range
  const filteredBalanceHistory = useMemo(() => {
    if (!balanceHistory.length) return []

    const now = new Date()
    const cutoffDate = new Date()

    switch (selectedTimeRange) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case 'ALL':
      default:
        return balanceHistory
    }

    return balanceHistory.filter(point => new Date(point.date) >= cutoffDate)
  }, [balanceHistory, selectedTimeRange])

  // Calculate percentage change from prior month
  const calculatePercentageChange = () => {
    if (filteredBalanceHistory.length < 2) return { value: 0, percentage: 0 }
    const current = filteredBalanceHistory[filteredBalanceHistory.length - 1].total_balance_gbp
    const prior = filteredBalanceHistory[filteredBalanceHistory.length - 2].total_balance_gbp
    const valueDiff = current - prior
    const percentageDiff = prior > 0 ? ((valueDiff / prior) * 100) : 0
    return { value: valueDiff, percentage: percentageDiff }
  }

  const percentageChange = calculatePercentageChange()

  // Format X-axis labels - show month/year properly
  const chartLabels = useMemo(() => {
    return filteredBalanceHistory.map(point => {
      const date = new Date(point.date)
      const month = date.toLocaleDateString('en-GB', { month: 'short' })
      const year = date.getFullYear()
      return `${month} ${year}`
    })
  }, [filteredBalanceHistory])

  // Prepare chart data with Total and all group histories
  const chartData = useMemo(() => {
    // Get primary color from theme for charts
    const primaryColor = currentTheme?.colors?.primary || '#2d5a27'

    // Convert hex to rgba for background
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 45, g: 90, b: 39 }
    }
    const rgb = hexToRgb(primaryColor)
    const primaryBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`

    // Calculate cutoff date based on selected time range
    const now = new Date()
    const cutoffDate = new Date()
    switch (selectedTimeRange) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case 'ALL':
      default:
        // No cutoff
        break
    }

    // Collect ALL unique dates from total and all group histories (filtered by time range)
    const allDatesSet = new Set<string>()

    // Add total dates
    filteredBalanceHistory.forEach(p => allDatesSet.add(p.date))

    // Add filtered group dates
    if (fullHistoryResponse?.group_histories) {
      fullHistoryResponse.group_histories.forEach(gh => {
        gh.history.forEach(h => {
          if (selectedTimeRange === 'ALL' || new Date(h.date) >= cutoffDate) {
            allDatesSet.add(h.date)
          }
        })
      })
    }

    const sortedDates = Array.from(allDatesSet).sort()

    // Format labels from all dates
    const allLabels = sortedDates.map(dateStr => {
      const date = new Date(dateStr)
      const month = date.toLocaleDateString('en-GB', { month: 'short' })
      const year = date.getFullYear()
      return `${month} ${year}`
    })

    // Create map for total data
    const totalDataMap = new Map<string, number>()
    filteredBalanceHistory.forEach(p => totalDataMap.set(p.date, p.total_balance_gbp))

    const datasets: any[] = [
      {
        label: 'Total Net Worth',
        data: sortedDates.map(date => totalDataMap.get(date) || null),
        borderColor: primaryColor,
        backgroundColor: primaryBg,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: primaryColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        spanGaps: true,
      },
    ]

    // Add group series from API response - each plots on its own dates
    if (fullHistoryResponse?.group_histories) {
      const colors = ['#7d8471', '#c17f59', '#a6926a', '#16a34a']

      fullHistoryResponse.group_histories.forEach((groupHist, index) => {
        const color = colors[index % colors.length]
        const isVisible = selectedSeries.includes(groupHist.group_id)

        // Filter group history by time range
        const filteredGroupHistory = groupHist.history.filter(h => {
          return selectedTimeRange === 'ALL' || new Date(h.date) >= cutoffDate
        })

        // Create map of date to balance for this group
        const groupDataMap = new Map<string, number>()
        filteredGroupHistory.forEach(h => groupDataMap.set(h.date, h.total_balance_gbp))

        // Map to all dates (each dataset plots independently)
        datasets.push({
          label: groupHist.group_name,
          data: sortedDates.map(date => groupDataMap.get(date) || null),
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: color,
          hidden: !isVisible,
          spanGaps: true,
        })
      })
    }

    return { labels: allLabels, datasets }
  }, [filteredBalanceHistory, fullHistoryResponse, selectedSeries, currentTheme, selectedTimeRange])

  // Series configuration - Total + all groups from API
  const seriesConfig = useMemo(() => {
    const config = [
      { key: 'total', label: 'Total Net Worth', color: 'var(--color-primary)', disabled: true },
    ]

    // Add all groups from history response
    if (fullHistoryResponse?.group_histories) {
      const colors = ['#7d8471', '#c17f59', '#a6926a', '#16a34a']
      fullHistoryResponse.group_histories.forEach((groupHist, index) => {
        const color = colors[index % colors.length]
        config.push({
          key: groupHist.group_id,
          label: groupHist.group_name,
          color,
          disabled: false,
        })
      })
    }

    return config
  }, [fullHistoryResponse])

  const handleSeriesToggle = (seriesKey: string) => {
    if (seriesKey === 'total') return // Can't toggle total
    setSelectedSeries(
      selectedSeries.includes(seriesKey)
        ? selectedSeries.filter(s => s !== seriesKey)
        : [...selectedSeries, seriesKey]
    )
  }

  const handleToggleAll = () => {
    // Get all currently enabled series (excluding total)
    const enabledSeries = seriesConfig.filter(s => !s.disabled && s.key !== 'total')

    // Toggle all of them - if they're all selected, deselect all, otherwise select all
    const allSelected = enabledSeries.every(s => selectedSeries.includes(s.key))

    if (allSelected) {
      // Deselect all
      setSelectedSeries(['total'])
    } else {
      // Select all
      setSelectedSeries(['total', ...enabledSeries.map(s => s.key)])
    }
  }

  const handleClearAll = () => {
    setSelectedSeries(['total'])
  }

  const handleDragStart = (e: React.DragEvent, groupId: string) => {
    console.log('Drag start:', groupId)
    e.dataTransfer.setData('text/plain', groupId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    console.log('Drop event fired')
    const groupId = e.dataTransfer.getData('text/plain')
    console.log('Dropped groupId:', groupId)
    if (groupId && !pinnedGroups.includes(groupId)) {
      console.log('Adding to pinned groups:', groupId)
      setPinnedGroups([...pinnedGroups, groupId])
    }
  }

  const handleUnpinGroup = (groupId: string) => {
    setPinnedGroups(pinnedGroups.filter(id => id !== groupId))
  }

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range)
  }

  // Generate consistent color for account type based on name
  const getAccountTypeColor = (accountType: string, forBackground = false) => {
    // System defaults
    const systemColors: Record<string, string> = {
      savings: currentTheme?.colors?.primary || '#2d5a27',
      investment: '#7d8471',
      current: '#c17f59',
      loan: '#c17f59',
      credit: '#c17f59',
    }

    if (systemColors[accountType]) {
      // For system type backgrounds, add opacity to hex
      if (forBackground) {
        return systemColors[accountType]
      }
      return systemColors[accountType]
    }

    // Generate softer, more muted color for custom types based on name hash
    const hash = accountType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue = hash % 360
    // For backgrounds, use much lighter version
    if (forBackground) {
      return `hsl(${hue}, 25%, 94%)`
    }
    return `hsl(${hue}, 30%, 45%)`
  }

  // Helper to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return hex
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Prepare distribution data for pie chart
  const distributionData = useMemo(() => {
    const byTypeMap = dashboardData?.by_account_type?.reduce((acc, item) => {
      acc[item.account_type] = item.total_balance_gbp
      return acc
    }, {} as Record<string, number>) || {}

    const distributionLabels = Object.keys(byTypeMap)
    const distributionValues = Object.values(byTypeMap)

    return {
      labels: distributionLabels,
      values: distributionValues,
      colors: distributionLabels.map(label => getAccountTypeColor(label)),
    }
  }, [dashboardData, currentTheme])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-8"></div>
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-80">
          <div className="lg:col-span-2 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="lg:col-span-7 bg-gray-200 rounded-2xl animate-pulse"></div>
          <div className="lg:col-span-3 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-600">{typeof error === 'string' ? error : 'Failed to load dashboard'}</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Total Net Worth Card with Pinned Groups */}
      <div
        className={`glass-card rounded-2xl p-8 transition-all duration-200 ${
          pinnedGroups.length === 0 && isDraggingOver ? 'ring-2 ring-primary ring-opacity-50' : ''
        }`}
        onDragOver={pinnedGroups.length === 0 ? handleDragOver : undefined}
        onDragLeave={pinnedGroups.length === 0 ? handleDragLeave : undefined}
        onDrop={pinnedGroups.length === 0 ? handleDrop : undefined}
      >
        {/* Total Net Worth Section */}
        <div className={`flex items-center justify-between ${pinnedGroups.length > 0 ? 'mb-6' : ''}`}>
          <div>
            <p className="text-sm font-medium text-muted uppercase tracking-wider mb-2">Total Net Worth</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-bold font-mono text-primary">£</span>
              <span className="text-5xl font-bold font-mono text-primary">
                {dashboardData.total_balance_gbp.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Change amount */}
            <div
              className="flex items-center space-x-2 px-4 py-2 rounded-full border"
              style={{
                backgroundColor: percentageChange.value >= 0 ? 'var(--color-primary-bg)' : 'var(--color-accent-bg)',
                borderColor: percentageChange.value >= 0 ? 'var(--color-primary)' : 'var(--color-accent)'
              }}
            >
              <svg
                className="w-4 h-4"
                style={{ color: percentageChange.value >= 0 ? 'var(--color-primary)' : 'var(--color-accent)', transform: percentageChange.value < 0 ? 'rotate(180deg)' : 'none' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              <span
                className="text-sm font-mono font-medium"
                style={{ color: percentageChange.value >= 0 ? 'var(--color-primary)' : 'var(--color-accent)' }}
              >
                {percentageChange.value >= 0 ? '+' : ''}£{Math.abs(percentageChange.value).toLocaleString()}
              </span>
            </div>
            {/* Percentage */}
            <div
              className="flex items-center space-x-2 px-4 py-2 rounded-full border"
              style={{
                backgroundColor: percentageChange.percentage >= 0 ? 'var(--color-primary-bg)' : 'var(--color-accent-bg)',
                borderColor: percentageChange.percentage >= 0 ? 'var(--color-primary)' : 'var(--color-accent)'
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: percentageChange.percentage >= 0 ? 'var(--color-primary)' : 'var(--color-accent)' }}
              >
                {percentageChange.percentage >= 0 ? '+' : ''}{percentageChange.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Pinned Groups Section - Drop Zone */}
        {pinnedGroups.length > 0 && (
          <div
            className={`pt-6 border-t transition-all duration-200 ${
              isDraggingOver ? 'ring-2 ring-primary ring-opacity-50 rounded-xl -m-2 p-4' : ''
            }`}
            style={{ borderColor: 'var(--color-border)' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedGroups.map((groupId) => {
                const group = fullGroups.find(g => g.id === groupId)
                if (!group) return null

                const colors = ['var(--color-primary)', '#7d8471', '#c17f59']
                const colorIndex = fullGroups.findIndex(g => g.id === groupId)
                const color = colors[colorIndex % colors.length]

                return (
                  <div
                    key={group.id}
                    className="relative rounded-xl p-4 pr-10 transition-all duration-200 hover:shadow-sm"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: `1px solid ${color}`,
                      borderLeft: `4px solid ${color}`
                    }}
                  >
                    <button
                      onClick={() => handleUnpinGroup(group.id)}
                      className="absolute top-3 right-3 p-1 rounded text-muted hover:text-primary transition-colors"
                      title="Unpin"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">{group.name}</p>
                    <p className="text-xl font-bold font-mono" style={{ color }}>
                      £{group.total_balance_gbp?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Chart + Series Toggle (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Balance History Chart */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-primary">Net Worth History</h2>
                <p className="text-sm text-secondary">Track your growth over time</p>
              </div>
              <div className="flex items-center space-x-2">
                {(['1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      selectedTimeRange === range
                        ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm'
                        : 'bg-card text-muted hover:bg-primary/10 hover:text-primary border border-primary/20'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-container" style={{ height: 320 }}>
              <LineChart data={chartData} />
            </div>
          </div>

          {/* Show on Chart - Below the line chart */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">Show on Chart</h3>
                <p className="text-sm text-muted">Toggle series to display • Drag groups to pin them above</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleAll}
                  className="py-2 px-4 text-xs font-medium rounded-lg bg-secondary text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  Toggle All
                </button>
                <button
                  onClick={handleClearAll}
                  className="py-2 px-4 text-xs font-medium rounded-lg bg-secondary text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {seriesConfig.map((series) => (
                <label
                  key={series.key}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 ${
                    series.disabled
                      ? 'opacity-50'
                      : 'cursor-pointer hover:bg-secondary'
                  }`}
                  draggable={!series.disabled && series.key !== 'total'}
                  onDragStart={(e) => handleDragStart(e, series.key)}
                  onDragOver={handleDragOver}
                  style={{ cursor: !series.disabled && series.key !== 'total' ? 'grab' : 'default' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSeries.includes(series.key)}
                    disabled={series.disabled}
                    onChange={() => handleSeriesToggle(series.key)}
                    className="w-4 h-4 rounded border-secondary bg-secondary text-primary focus:ring-primary focus:ring-offset-0 transition-all duration-200"
                  />
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: series.color }}
                    ></div>
                    <span className={`text-sm font-medium ${
                      series.disabled ? 'text-primary' : 'text-primary'
                    }`}>
                      {series.label}
                    </span>
                    {!series.disabled && series.key !== 'total' && (
                      <svg className="w-3 h-3 text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"/>
                    </svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Account Type Distribution (3 cols) */}
        <div className="lg:col-span-3 glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-primary mb-2">By Account Type</h2>
          <p className="text-sm text-secondary mb-4">Distribution breakdown</p>
          <div className="chart-container mb-6 flex justify-center" style={{ height: 180 }}>
            <DoughnutChart
              data={{
                labels: distributionData.labels,
                values: distributionData.values,
                colors: distributionData.colors,
              }}
              size={170}
              showLegend={false}
            />
          </div>
          <div className="space-y-2">
            {distributionData.labels.map((label, i) => {
              const color = getAccountTypeColor(label)
              // For backgrounds, use rgba with 0.12 opacity for muted effect
              const bgColor = hexToRgba(getAccountTypeColor(label, true), 0.12)
              return (
                <div
                  key={label}
                  className="flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                    <span className="text-sm text-primary capitalize">{label}</span>
                  </div>
                  <span className="text-sm font-mono font-medium text-primary">
                    £{distributionData.values[i]?.toLocaleString() || '0'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Account Groups */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-primary">Account Groups</h2>
            <p className="text-sm text-secondary">Your organized portfolios</p>
          </div>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="btn-primary px-4 py-2 text-sm font-medium rounded-lg text-white shadow-md hover:shadow-glow-strong transition-all duration-300"
          >
            + New Group
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fullGroups.map((group, index) => {
            const colors = ['var(--color-primary)', '#7d8471', '#c17f59']
            const color = colors[index % colors.length]

            return (
              <div
                key={group.id}
                className="group relative p-5 rounded-xl bg-card border hover:border-opacity-50 hover:shadow-md cursor-pointer transition-all duration-300"
                style={{ borderColor: index === 0 ? 'var(--color-primary)' : index === 1 ? 'rgba(125, 132, 113, 0.3)' : 'rgba(193, 127, 89, 0.3)' }}
                onClick={() => setSelectedGroupId(group.id)}
              >
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/groups/${group.id}`)
                    }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary/10 text-primary hover:text-primary-hover transition-all duration-200"
                    title="View full details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setGroupToDelete(group)
                    }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all duration-200"
                    title="Delete group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <svg className="w-5 h-5 transition-colors duration-300" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={AccountGroupIcon.content}/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary group-hover:text-primary transition-colors duration-300">{group.name}</h3>
                    <p className="text-xs text-muted">{group.account_count || 0} accounts</p>
                  </div>
                </div>
                <p className="text-xl font-bold font-mono transition-colors duration-300" style={{ color }}>
                  £{group.total_balance_gbp?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </p>
              </div>
            )
          })}

          {/* Add New Group Card */}
          <div
            onClick={() => setShowCreateGroupModal(true)}
            className="group p-5 rounded-xl border-2 border-dashed hover:border-primary cursor-pointer flex items-center justify-center min-h-[140px] transition-all duration-300 hover:shadow-glow"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-secondary group-hover:bg-primary/10 mx-auto mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-muted group-hover:text-primary transition-colors duration-300">
                Create New Group
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedGroupId && (
        <GroupDetailModal
          groupId={selectedGroupId}
          onClose={() => setSelectedGroupId(null)}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={refreshGroups}
        />
      )}

      {/* Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setGroupToDelete(null)}>
          <div
            className="glass-card rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Delete Group</h2>
              <p className="text-secondary mb-6">
                Are you sure you want to delete <span className="font-semibold text-primary">"{groupToDelete.name}"</span>?
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setGroupToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl border text-primary font-semibold hover:bg-card transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
