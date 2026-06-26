'use client'

import { useEffect, useState } from 'react'

interface FinancialChartProps {
  data: { name: string; value: number }[]
  title: string
  height?: number
}

export default function FinancialChart({ data, title, height = 200 }: FinancialChartProps) {
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(data)

  useEffect(() => {
    setChartData(data)
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
        <h3 className="font-semibold mb-4">{title}</h3>
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Simple bar chart implementation using divs
  const maxValue = Math.max(...chartData.map(d => d.value))
  const barHeight = 20
  const barSpacing = 8
  const chartHeight = height || 200

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="relative h-[200px]">
        {chartData.map((item, index) => {
          const percentage = item.value / maxValue
          const barWidth = percentage * 100

          return (
            <div
              key={index}
              className="absolute bottom-0 left-[calc(20%_+_(index_*_80px))] w-[60px] flex flex-col items-center"
            >
              <div
                className={`w-full bg-teal-500 h-[${barWidth * 2}px] rounded-t`}
                style={{ height: `${barWidth * 2}px` }}
              ></div>
              <span className="text-xs text-muted-foreground mt-1">{item.name}</span>
              <span className="text-xs text-muted-foreground mt-1">{item.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}