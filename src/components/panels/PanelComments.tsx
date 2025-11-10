'use client'

import { useState } from 'react'

interface Comment {
  id: string
  text: string
  author: string
  timestamp: string
}

interface PanelCommentsProps {
  title?: string
  comments?: Comment[]
  onSubmit?: (comment: string) => void
  placeholder?: string
  className?: string
}

export default function PanelComments({ 
  title = 'Comments',
  comments = [],
  onSubmit,
  placeholder = 'Add a comment...',
  className = '' 
}: PanelCommentsProps) {
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    if (comment.trim() && onSubmit) {
      onSubmit(comment.trim())
      setComment('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className={`border-t border-neutral-200 pt-6 ${className}`}>
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">{title}</h3>
      <div className="space-y-3">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
        />
        {comments.length === 0 ? (
          <p className="text-sm text-neutral-500">No comments yet</p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-neutral-50 rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-900">{comment.author}</span>
                  <span className="text-xs text-neutral-500">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-neutral-700">{comment.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

