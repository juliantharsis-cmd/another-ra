'use client'

import { AIAgentProfile, Tone, DetailLevel, ResponseStyle, DomainFocus } from '@/lib/api/aiAgentProfile'

interface AIAgentProfileSectionProps {
  profile: AIAgentProfile
  onChange: (field: keyof AIAgentProfile, value: any) => void
  isExpanded: boolean
  onToggle: () => void
}

export default function AIAgentProfileSection({
  profile,
  onChange,
  isExpanded,
  onToggle,
}: AIAgentProfileSectionProps) {
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <svg
            className={`w-5 h-5 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-neutral-900">AI Agent Profile</h4>
            <p className="text-xs text-neutral-500 mt-0.5">Customize how AI assistants behave and respond to you</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Communication Tone
            </label>
            <select
              value={profile.tone || 'professional'}
              onChange={(e) => onChange('tone', e.target.value as Tone)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="analytical">Analytical - Data-driven and logical</option>
              <option value="conversational">Conversational - Friendly and approachable</option>
              <option value="professional">Professional - Business-appropriate</option>
              <option value="friendly">Friendly - Warm and engaging</option>
              <option value="technical">Technical - Detailed and precise</option>
              <option value="concise">Concise - Brief and to the point</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Detail Level
            </label>
            <select
              value={profile.detailLevel || 'medium'}
              onChange={(e) => onChange('detailLevel', e.target.value as DetailLevel)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="low">Low - High-level summaries</option>
              <option value="medium">Medium - Balanced detail</option>
              <option value="high">High - Comprehensive responses</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Response Style
            </label>
            <select
              value={profile.responseStyle || 'balanced'}
              onChange={(e) => onChange('responseStyle', e.target.value as ResponseStyle)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="concise">Concise - Brief and focused</option>
              <option value="detailed">Detailed - Thorough and comprehensive</option>
              <option value="balanced">Balanced - Mix of conciseness and detail</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Domain Focus
            </label>
            <select
              value={profile.domainFocus || 'general'}
              onChange={(e) => onChange('domainFocus', e.target.value as DomainFocus)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="sustainability_data">Sustainability Data</option>
              <option value="energy_data">Energy Data</option>
              <option value="carbon_emissions">Carbon Emissions</option>
              <option value="compliance">Compliance</option>
              <option value="general">General</option>
              <option value="financial">Financial</option>
              <option value="operations">Operations</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Output Format
            </label>
            <select
              value={profile.outputFormat || 'paragraph'}
              onChange={(e) => onChange('outputFormat', e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="paragraph">Paragraph - Flowing text</option>
              <option value="bullet_points">Bullet Points - Lists</option>
              <option value="structured">Structured - Sections and headings</option>
              <option value="mixed">Mixed - Combination as needed</option>
            </select>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={profile.includeReasoning ?? true}
                onChange={(e) => onChange('includeReasoning', e.target.checked)}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-neutral-700">Include reasoning and thought process</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={profile.customInstructions || ''}
              onChange={(e) => onChange('customInstructions', e.target.value)}
              placeholder="e.g., Always include specific data points and percentages"
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {(profile.customInstructions || '').length}/1000 characters
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

