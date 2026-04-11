'use client'

import React, { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const RATE_MAP: Record<string, number> = {
  USD: 1,
  CNY: 7.24,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 153.2,
  HKD: 7.81,
}

const CURRENCY_OPTIONS = Object.keys(RATE_MAP)

export const ExchangeRateCalculatorPlayground: React.FC = () => {
  const [amountText, setAmountText] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('CNY')
  const [resultText, setResultText] = useState('')

  const amount = useMemo(() => {
    const parsed = Number(amountText)
    return Number.isFinite(parsed) ? parsed : NaN
  }, [amountText])

  const convert = () => {
    if (!Number.isFinite(amount) || amount <= 0) {
      setResultText('请输入大于 0 的有效金额')
      return
    }

    const baseUsd = amount / RATE_MAP[from]
    const converted = baseUsd * RATE_MAP[to]

    setResultText(`${amount.toFixed(2)} ${from} ≈ ${converted.toFixed(2)} ${to}`)
  }

  const swapCurrency = () => {
    setFrom(to)
    setTo(from)
    setResultText('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="space-y-2">
          <Label htmlFor="amount">金额</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="例如 100"
            className="bg-black/20 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="from">源货币</Label>
          <select
            id="from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to">目标货币</Label>
          <select
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={convert}>开始换算</Button>
          <Button variant="outline" onClick={swapCurrency}>
            交换币种
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">换算结果</h3>
        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 min-h-[200px] whitespace-pre-wrap font-mono text-sm">
          {resultText || '输入金额与币种后，点击“开始换算”'}
        </div>
        <p className="text-xs text-muted-foreground">
          说明：当前为演示版静态汇率（非实时行情），用于流程打通与交互验证。
        </p>
      </div>
    </div>
  )
}
