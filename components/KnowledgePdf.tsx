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
  const [width, setWidth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const update = () => {
      if (!containerRef.current) return
      setWidth(containerRef.current.clientWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [pdfId])

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-white relative"
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
      {width > 0 && (
        <Document
          file={`/knowledge-cards/${pdfId}.pdf`}
          onLoadSuccess={() => setLoading(false)}
          onLoadError={() => { setLoading(false); setError(true) }}
          loading=""
        >
          <Page
            pageNumber={1}
            width={width}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>
      )}
    </div>
  )
}
