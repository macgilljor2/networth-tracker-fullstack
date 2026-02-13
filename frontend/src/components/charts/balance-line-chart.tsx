'use client'

import React, { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DataPoint {
  date: string
  balance: number
  created_at: string
}

interface BalanceLineChartProps {
  data: DataPoint[]
  height?: number
  currency?: string
}

export const BalanceLineChart: React.FC<BalanceLineChartProps> = ({
  data,
  height = 280,
  currency = 'GBP'
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[#5a5a5a]">
        No data available
      </div>
    )
  }

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'

  // Sort all balances by date and created_at
  const sortedData = [...data].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateCompare !== 0) return dateCompare
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  // Create labels - show month and year like dashboard
  const labels = sortedData.map(point => {
    const d = new Date(point.date)
    const month = d.toLocaleDateString('en-GB', { month: 'short' })
    const year = d.getFullYear()
    return `${month} ${year}`
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Balance',
        data: sortedData.map(point => point.balance),
        borderColor: '#2d5a27',
        backgroundColor: 'rgba(45, 90, 39, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2d5a27',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options: React.ComponentProps<typeof Line>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(250, 249, 246, 0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: 'rgba(45, 90, 39, 0.2)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: "'Quicksand', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Quicksand', sans-serif",
        },
        callbacks: {
          title: (context) => {
            const dataIndex = context[0].dataIndex
            const point = sortedData[dataIndex]
            const date = new Date(point.date)
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          },
          label: (context) => {
            const value = context.parsed.y
            if (value == null) return 'Balance: —'
            return `Balance: ${currencySymbol}${value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(213, 217, 208, 0.3)',
        },
        ticks: {
          color: '#5a5a5a',
          font: {
            size: 11,
            weight: 500,
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(213, 217, 208, 0.3)',
        },
        ticks: {
          color: '#5a5a5a',
          font: {
            size: 11,
            family: "'Quicksand', sans-serif",
          },
          callback: (value) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value as string)
            return `${currencySymbol}${numValue.toLocaleString()}`
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }

  return (
    <div className="w-full h-full" style={{ height }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
