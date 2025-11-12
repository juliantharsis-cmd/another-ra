/**
 * AI Agent Profile Types
 * 
 * Defines the structure for user-specific AI behavior preferences
 */

export type Tone = 'analytical' | 'conversational' | 'professional' | 'friendly' | 'technical' | 'concise'
export type DetailLevel = 'low' | 'medium' | 'high'
export type ResponseStyle = 'concise' | 'detailed' | 'balanced'
export type DomainFocus = 
  | 'sustainability_data' 
  | 'energy_data' 
  | 'carbon_emissions' 
  | 'compliance' 
  | 'general' 
  | 'financial' 
  | 'operations'

/**
 * AI Agent Profile - User-specific behavioral preferences for AI interactions
 */
export interface AIAgentProfile {
  /**
   * Tone of communication
   * @default 'professional'
   */
  tone?: Tone

  /**
   * Level of detail in responses
   * @default 'medium'
   */
  detailLevel?: DetailLevel

  /**
   * Response style preference
   * @default 'balanced'
   */
  responseStyle?: ResponseStyle

  /**
   * Domain/area of focus for AI responses
   * @default 'general'
   */
  domainFocus?: DomainFocus

  /**
   * Custom instructions for the AI (free-form text)
   * Example: "Always include specific data points and percentages"
   */
  customInstructions?: string

  /**
   * Whether to include reasoning/explanation in responses
   * @default true
   */
  includeReasoning?: boolean

  /**
   * Preferred output format
   * @default 'paragraph'
   */
  outputFormat?: 'paragraph' | 'bullet_points' | 'structured' | 'mixed'

  /**
   * Language preference (ISO 639-1 code)
   * @default 'en'
   */
  language?: string
}

/**
 * Default AI Agent Profile (neutral behavior)
 */
export const DEFAULT_AI_AGENT_PROFILE: Required<AIAgentProfile> = {
  tone: 'professional',
  detailLevel: 'medium',
  responseStyle: 'balanced',
  domainFocus: 'general',
  customInstructions: '',
  includeReasoning: true,
  outputFormat: 'paragraph',
  language: 'en',
}

/**
 * Merge user profile with defaults
 * User values override defaults, but all fields are guaranteed to be present
 */
export function mergeWithDefaults(profile?: Partial<AIAgentProfile>): Required<AIAgentProfile> {
  const merged = {
    tone: profile?.tone || DEFAULT_AI_AGENT_PROFILE.tone,
    detailLevel: profile?.detailLevel || DEFAULT_AI_AGENT_PROFILE.detailLevel,
    responseStyle: profile?.responseStyle || DEFAULT_AI_AGENT_PROFILE.responseStyle,
    domainFocus: profile?.domainFocus || DEFAULT_AI_AGENT_PROFILE.domainFocus,
    customInstructions: profile?.customInstructions || DEFAULT_AI_AGENT_PROFILE.customInstructions,
    includeReasoning: profile?.includeReasoning ?? DEFAULT_AI_AGENT_PROFILE.includeReasoning,
    outputFormat: profile?.outputFormat || DEFAULT_AI_AGENT_PROFILE.outputFormat,
    language: profile?.language || DEFAULT_AI_AGENT_PROFILE.language,
  }
  
  // Log if custom profile is being used
  if (profile && Object.keys(profile).length > 0) {
    const hasCustomValues = Object.keys(profile).some(key => {
      const profileKey = key as keyof AIAgentProfile
      return profile[profileKey] !== undefined && 
             profile[profileKey] !== DEFAULT_AI_AGENT_PROFILE[profileKey as keyof typeof DEFAULT_AI_AGENT_PROFILE]
    })
    if (hasCustomValues) {
      console.log(`📋 [AI Agent Profile] Using custom profile with overrides:`, 
        Object.keys(profile).filter(k => profile[k as keyof AIAgentProfile] !== undefined)
      )
    }
  }
  
  return merged
}

/**
 * Convert AI Agent Profile to system prompt instructions
 */
export function profileToSystemPrompt(profile: Required<AIAgentProfile>): string {
  const instructions: string[] = []

  // Tone instructions
  const toneInstructions: Record<Tone, string> = {
    analytical: 'Use an analytical, data-driven approach. Focus on facts, metrics, and logical reasoning.',
    conversational: 'Use a conversational, approachable tone. Be friendly and engaging while remaining professional.',
    professional: 'Maintain a professional, business-appropriate tone throughout.',
    friendly: 'Use a warm, friendly tone while maintaining professionalism.',
    technical: 'Use technical terminology and detailed explanations appropriate for technical audiences.',
    concise: 'Be brief and to the point. Avoid unnecessary elaboration.',
  }
  instructions.push(toneInstructions[profile.tone])

  // Detail level
  const detailInstructions: Record<DetailLevel, string> = {
    low: 'Provide high-level summaries. Avoid excessive detail.',
    medium: 'Provide balanced detail with key information and context.',
    high: 'Provide comprehensive, detailed responses with full context and background.',
  }
  instructions.push(detailInstructions[profile.detailLevel])

  // Response style
  const styleInstructions: Record<ResponseStyle, string> = {
    concise: 'Keep responses brief and focused. Prioritize essential information.',
    detailed: 'Provide thorough, comprehensive responses with full context.',
    balanced: 'Balance conciseness with necessary detail.',
  }
  instructions.push(styleInstructions[profile.responseStyle])

  // Domain focus
  const domainInstructions: Record<DomainFocus, string> = {
    sustainability_data: 'Focus on sustainability metrics, environmental impact, and ESG considerations.',
    energy_data: 'Emphasize energy consumption, efficiency, and energy-related metrics.',
    carbon_emissions: 'Prioritize carbon footprint, emissions data, and decarbonization strategies.',
    compliance: 'Focus on regulatory compliance, standards, and reporting requirements.',
    general: 'Provide general business and data analysis insights.',
    financial: 'Emphasize financial metrics, cost analysis, and ROI considerations.',
    operations: 'Focus on operational efficiency, processes, and operational metrics.',
  }
  instructions.push(domainInstructions[profile.domainFocus])

  // Reasoning
  if (profile.includeReasoning) {
    instructions.push('Include your reasoning and thought process when providing analysis or recommendations.')
  }

  // Output format
  const formatInstructions: Record<typeof profile.outputFormat, string> = {
    paragraph: 'Format responses as flowing paragraphs.',
    bullet_points: 'Use bullet points or lists for clarity.',
    structured: 'Use structured formats with clear sections and headings.',
    mixed: 'Use a mix of paragraphs and lists as appropriate.',
  }
  instructions.push(formatInstructions[profile.outputFormat])

  // Custom instructions
  if (profile.customInstructions && profile.customInstructions.trim()) {
    instructions.push(profile.customInstructions.trim())
  }

  return instructions.join(' ')
}

