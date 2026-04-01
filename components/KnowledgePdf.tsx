'use client'

import { useState } from 'react'

interface KnowledgePdfProps {
  pdfId: string
}

export default function KnowledgeCard({ pdfId }: KnowledgePdfProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-white">
        <span className="text-4xl">😕</span>
        <p className="text-gray-500 text-sm">ไม่สามารถโหลดการ์ดได้</p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/knowledge-cards/${pdfId}.png`}
      alt="การ์ดความรู้"
      className="w-full h-full object-contain block"
      onError={() => setError(true)}
    />
  )
}
