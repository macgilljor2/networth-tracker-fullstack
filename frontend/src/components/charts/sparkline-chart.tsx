'use client'

import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { cn } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)

export interface SparklineChartProps {
  data: number[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { width: 80, height: 40 },
  md: { width: 120, height: 60 },
  lg: { width: 160, height: 80 },
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  size = 'md',
  className,
}) => {
  const dimensions = SIZE_MAP[size]

  const trend = useMemo(() => {
    if (data.length < 2) return 'neutral'
    const first = data[0]
    const last = data[data.length - 1]
    return last > first ? 'up' : last < first ? 'down' : 'neutral'
  }, [data])

  const color = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#9ca3af'

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
        borderColor: color,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: false,
      },
    ],
  }

  const options: React.ComponentProps<typeof Line>['options'] = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    layout: {
      padding: 0,
    },
  }

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-400', className)} style={dimensions}>
        <span className="text-xs">No data</span>
      </div>
    )
  }

  return (
    <div className={cn('inline-block', className)} style={dimensions}>
      <Line data={chartData} options={options} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}
