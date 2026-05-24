import { useEffect, useState } from 'react'

/** Subscribe to a CSS media query; re-renders when it changes. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True on phone-sized viewports. Single source of truth for the layout switch. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}
