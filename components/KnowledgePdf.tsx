'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface KnowledgePdfProps {
  pdfId: string
}

export default function KnowledgePdf({ pdfId }: KnowledgePdfProps) {
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const update = () => {
      if (!containerRef.current) return
      setDims({
        w: containerRef.current.clientWidth,
        h: containerRef.current.clientHeight,
      })
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [pdfId])

  // Pick the constraint that keeps the PDF within BOTH width and height.
  // Assume portrait PDF ratio ≈ 1 : 1.41 (A4-ish).
  const pageProps = (() => {
    if (!dims.w) return {}
    if (!dims.h) return { width: dims.w }
    // If constrained by width, would the height overflow?
    const heightAtWidth = dims.w * 1.41
    if (heightAtWidth <= dims.h) {
      return { width: dims.w }          // fits — use full width
    }
    // Otherwise constrain by height; PDF will be narrower than container
    return { height: dims.h }
  })()

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-white flex items-center justify-center relative"
    >
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
          <div className="w-10 h-10 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">กำลังโหลดการ์ดความรู้…</p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="text-4xl">😕</span>
          <p className="text-gray-500 text-sm">ไม่สามารถโหลดการ์ดได้</p>
        </div>
      )}
      {dims.w > 0 && (
        <Document
          file={`/api/pdf/${pdfId}`}
          onLoadSuccess={() => setLoading(false)}
          onLoadError={() => { setLoading(false); setError(true) }}
          loading=""
        >
          <Page
            pageNumber={1}
            {...pageProps}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      )}
    </div>
  )
}
