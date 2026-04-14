'use client'
import React, { useState, useEffect } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter } from 'next/navigation'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(`/search${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, router])

  return (
    <form
      className="search-bar-wrap"
      onSubmit={(e) => e.preventDefault()}
      data-focused={focused || undefined}
    >
      <SearchIcon className="search-bar__icon" size={20} strokeWidth={1.8} aria-hidden />
      <label htmlFor="search" className="sr-only">搜索</label>
      <input
        id="search"
        className="search-bar__input"
        placeholder="搜索文章、工具、slug…"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <button type="submit" className="sr-only">搜索</button>
    </form>
  )
}
