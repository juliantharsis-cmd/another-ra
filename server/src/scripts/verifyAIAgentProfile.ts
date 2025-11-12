/**
 * Script to verify AI Agent Profile is being loaded and used
 * 
 * This script checks if your AI Agent Profile is saved and can be retrieved,
 * and shows what instructions would be injected into AI calls.
 * 
 * Run with: npx tsx server/src/scripts/verifyAIAgentProfile.ts [userId]
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { AIAgentProfileService } from '../services/AIAgentProfileService'
import { profileToSystemPrompt, DEFAULT_AI_AGENT_PROFILE } from '../types/AIAgentProfile'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config()

async function verifyProfile() {
  const userId = process.argv[2] || 'default-user'
  
  console.log(`🔍 Verifying AI Agent Profile for user: ${userId}\n`)

  try {
    const profileService = new AIAgentProfileService()
    
    // Get the profile
    console.log('📥 Fetching profile...')
    const profile = await profileService.getProfile(userId)
    
    // Check if it's custom or default
    const isDefault = Object.keys(profile).every(key => {
      const profileKey = key as keyof typeof profile
      return profile[profileKey] === DEFAULT_AI_AGENT_PROFILE[profileKey as keyof typeof DEFAULT_AI_AGENT_PROFILE]
    })
    
    if (isDefault) {
      console.log('⚠️  Using DEFAULT profile (no custom preferences found)\n')
    } else {
      console.log('✅ Using CUSTOM profile\n')
    }
    
    // Show profile details
    console.log('📋 Profile Details:')
    console.log('─────────────────────────────────────────')
    console.log(`  Tone:              ${profile.tone}`)
    console.log(`  Detail Level:      ${profile.detailLevel}`)
    console.log(`  Response Style:    ${profile.responseStyle}`)
    console.log(`  Domain Focus:      ${profile.domainFocus}`)
    console.log(`  Output Format:     ${profile.outputFormat}`)
    console.log(`  Include Reasoning: ${profile.includeReasoning}`)
    console.log(`  Language:          ${profile.language}`)
    if (profile.customInstructions) {
      console.log(`  Custom Instructions:`)
      console.log(`    "${profile.customInstructions.substring(0, 100)}${profile.customInstructions.length > 100 ? '...' : ''}"`)
    }
    console.log('─────────────────────────────────────────\n')
    
    // Show what instructions would be injected
    console.log('📝 System Prompt Instructions:')
    console.log('─────────────────────────────────────────')
    const instructions = profileToSystemPrompt(profile)
    console.log(instructions)
    console.log('─────────────────────────────────────────\n')
    
    // Compare with defaults
    console.log('🔍 Comparison with Defaults:')
    console.log('─────────────────────────────────────────')
    const differences: string[] = []
    if (profile.tone !== DEFAULT_AI_AGENT_PROFILE.tone) {
      differences.push(`Tone: ${DEFAULT_AI_AGENT_PROFILE.tone} → ${profile.tone}`)
    }
    if (profile.detailLevel !== DEFAULT_AI_AGENT_PROFILE.detailLevel) {
      differences.push(`Detail Level: ${DEFAULT_AI_AGENT_PROFILE.detailLevel} → ${profile.detailLevel}`)
    }
    if (profile.responseStyle !== DEFAULT_AI_AGENT_PROFILE.responseStyle) {
      differences.push(`Response Style: ${DEFAULT_AI_AGENT_PROFILE.responseStyle} → ${profile.responseStyle}`)
    }
    if (profile.domainFocus !== DEFAULT_AI_AGENT_PROFILE.domainFocus) {
      differences.push(`Domain Focus: ${DEFAULT_AI_AGENT_PROFILE.domainFocus} → ${profile.domainFocus}`)
    }
    if (profile.outputFormat !== DEFAULT_AI_AGENT_PROFILE.outputFormat) {
      differences.push(`Output Format: ${DEFAULT_AI_AGENT_PROFILE.outputFormat} → ${profile.outputFormat}`)
    }
    if (profile.includeReasoning !== DEFAULT_AI_AGENT_PROFILE.includeReasoning) {
      differences.push(`Include Reasoning: ${DEFAULT_AI_AGENT_PROFILE.includeReasoning} → ${profile.includeReasoning}`)
    }
    if (profile.customInstructions && profile.customInstructions !== DEFAULT_AI_AGENT_PROFILE.customInstructions) {
      differences.push(`Custom Instructions: (has custom text)`)
    }
    
    if (differences.length === 0) {
      console.log('  ✅ No differences - using all default values')
    } else {
      console.log('  📊 Custom overrides:')
      differences.forEach(diff => console.log(`    • ${diff}`))
    }
    console.log('─────────────────────────────────────────\n')
    
    console.log('✅ Verification complete!')
    console.log('\n💡 When you make AI calls, check the server logs for:')
    console.log('   🤖 [AI Agent Profile] Injecting custom profile for user...')
    console.log('   📝 [AI Agent Profile] Merged profile instructions...')
    
  } catch (error) {
    console.error('❌ Error verifying profile:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
verifyProfile()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

