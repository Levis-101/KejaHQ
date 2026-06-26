'use client'

import Link from 'next/link'

interface FinancialMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  href?: string
  icon?: string
}

export default function FinancialMetricCard({
  title,
  value,
  subtitle,
  trend,
  href,
  icon = '💰',
}: FinancialMetricCardProps) {
  const trendColor = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  }[trend || 'neutral']

  return (
    <Link href={href || '#'} className="block">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="font-semibold">{title}</h3>
          </div>
          {trend && (
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend === 'up' && '▲'}
              {trend === 'down' && '▼'}
              {trend === 'neutral' && '●'}
            </span>
          )}
        </div>
        <p className="text-2xl font-mono">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </Link>
  )
}