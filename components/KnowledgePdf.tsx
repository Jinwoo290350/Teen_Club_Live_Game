'use client'

import Image from 'next/image'
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
    <Image
      src={`/knowledge-cards/${pdfId}.png`}
      alt="การ์ดความรู้"
      fill
      className="object-contain"
      onError={() => setError(true)}
      priority
    />
  )
}
