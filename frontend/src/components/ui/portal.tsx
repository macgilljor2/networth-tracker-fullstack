'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
  children: React.ReactNode
}

export const Portal: React.FC<PortalProps> = ({ children }) => {
  const portalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create a new div element for the portal
    portalRef.current = document.createElement('div')
    portalRef.current.className = 'modal-portal'

    // Append it to document.body
    document.body.appendChild(portalRef.current)

    // Cleanup on unmount
    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current)
      }
    }
  }, [])

  // Render children into the portal div using createPortal
  if (!portalRef.current) return null

  return createPortal(children, portalRef.current)
}
