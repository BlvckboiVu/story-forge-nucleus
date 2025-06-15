
import * as React from "react"

// Updated mobile breakpoint to be more industry standard
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Additional hook for tablet detection
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const onChange = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024)
    }
    
    const mql = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    mql.addEventListener("change", onChange)
    onChange()
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

// Hook for responsive breakpoint detection
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'tablet' | 'desktop' | 'large'>('desktop')

  React.useEffect(() => {
    const onChange = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile')
      } else if (width < 1024) {
        setBreakpoint('tablet')
      } else if (width < 1440) {
        setBreakpoint('desktop')
      } else {
        setBreakpoint('large')
      }
    }
    
    onChange()
    window.addEventListener("resize", onChange)
    return () => window.removeEventListener("resize", onChange)
  }, [])

  return breakpoint
}
