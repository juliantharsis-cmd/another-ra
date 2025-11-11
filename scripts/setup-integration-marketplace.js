/**
 * Integration Marketplace Airtable Setup Script
 * 
 * This script helps verify and document the Airtable table structure.
 * Run this after creating the table in Airtable to verify the setup.
 * 
 * Note: This is a documentation/verification script.
 * The actual table must be created manually in Airtable.
 */

const REQUIRED_FIELDS = [
  { name: 'Name', type: 'singleLineText', required: true },
  { name: 'Provider ID', type: 'singleLineText', required: true },
  { name: 'Description', type: 'multilineText', required: true },
  { name: 'Icon', type: 'singleLineText', required: false },
  { name: 'Category', type: 'singleSelect', required: true, options: ['llm', 'vision', 'speech', 'custom'] },
  { name: 'Auth Type', type: 'singleSelect', required: true, options: ['api_key', 'pat', 'oauth', 'custom'] },
  { name: 'Base URL', type: 'url', required: false },
  { name: 'Documentation URL', type: 'url', required: false },
  { name: 'Supported Models', type: 'multilineText', required: false },
  { name: 'Default Model', type: 'singleLineText', required: false },
  { name: 'Features', type: 'multilineText', required: false },
  { name: 'Enabled', type: 'checkbox', required: true, defaultValue: true },
  { name: 'Sort Order', type: 'number', required: false },
]

const INITIAL_RECORDS = [
  {
    'Name': 'OpenAI',
    'Provider ID': 'openai',
    'Description': 'GPT-4, GPT-3.5, and other OpenAI models for chat, embeddings, and vision',
    'Icon': 'openai',
    'Category': 'llm',
    'Auth Type': 'api_key',
    'Base URL': 'https://api.openai.com/v1',
    'Documentation URL': 'https://platform.openai.com/docs',
    'Supported Models': 'gpt-4, gpt-4-turbo, gpt-3.5-turbo, text-embedding-ada-002, gpt-4-vision-preview',
    'Default Model': 'gpt-3.5-turbo',
    'Features': 'chat, embeddings, vision',
    'Enabled': true,
    'Sort Order': 1,
  },
  {
    'Name': 'Anthropic Claude',
    'Provider ID': 'anthropic',
    'Description': 'Claude AI models for advanced reasoning and long-context conversations',
    'Icon': 'anthropic',
    'Category': 'llm',
    'Auth Type': 'api_key',
    'Base URL': 'https://api.anthropic.com/v1',
    'Documentation URL': 'https://docs.anthropic.com',
    'Supported Models': 'claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307',
    'Default Model': 'claude-3-sonnet-20240229',
    'Features': 'chat, embeddings',
    'Enabled': true,
    'Sort Order': 2,
  },
  {
    'Name': 'Google Gemini',
    'Provider ID': 'google',
    'Description': 'Google\'s Gemini AI models for multimodal understanding',
    'Icon': 'google',
    'Category': 'llm',
    'Auth Type': 'api_key',
    'Base URL': 'https://generativelanguage.googleapis.com/v1',
    'Documentation URL': 'https://ai.google.dev/docs',
    'Supported Models': 'gemini-pro, gemini-pro-vision',
    'Default Model': 'gemini-pro',
    'Features': 'chat, vision',
    'Enabled': true,
    'Sort Order': 3,
  },
  {
    'Name': 'Custom AI Provider',
    'Provider ID': 'custom',
    'Description': 'Connect to a custom AI service endpoint with your own API key',
    'Icon': 'custom',
    'Category': 'custom',
    'Auth Type': 'custom',
    'Base URL': '',
    'Documentation URL': '',
    'Supported Models': '',
    'Default Model': '',
    'Features': 'chat',
    'Enabled': true,
    'Sort Order': 99,
  },
]

console.log('=== Integration Marketplace Airtable Setup Guide ===\n')
console.log('TABLE NAME: Integration Marketplace\n')
console.log('REQUIRED FIELDS:')
REQUIRED_FIELDS.forEach((field, index) => {
  console.log(`${index + 1}. ${field.name}`)
  console.log(`   Type: ${field.type}`)
  if (field.options) {
    console.log(`   Options: ${field.options.join(', ')}`)
  }
  if (field.defaultValue !== undefined) {
    console.log(`   Default: ${field.defaultValue}`)
  }
  console.log(`   Required: ${field.required ? 'Yes' : 'No'}\n`)
})

console.log('\nINITIAL RECORDS TO CREATE:')
INITIAL_RECORDS.forEach((record, index) => {
  console.log(`\n${index + 1}. ${record.Name}`)
  Object.entries(record).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      console.log(`   ${key}: ${value}`)
    }
  })
})

console.log('\n=== Setup Complete ===')
console.log('\nNext Steps:')
console.log('1. Create the table in Airtable with the fields listed above')
console.log('2. Create the initial records as shown')
console.log('3. Create views: "Active Integrations" and "All Integrations"')
console.log('4. Configure backend API to connect to this table')
console.log('5. Test the Integration Marketplace UI')

