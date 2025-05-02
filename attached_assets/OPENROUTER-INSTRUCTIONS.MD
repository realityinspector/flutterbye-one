# OpenRouter API Integration Guide

## Overview

OpenRouter provides a unified API interface to access various AI models from different providers, including OpenAI, Anthropic, and open-source models like Llama. This document explains how to use our service layer for interacting with these models.

## Features

- **Standard Chat Completions**: Generate text responses using various models
- **Web Search Capabilities**: Access AI models with web search functionality
- **Dynamic Model Selection**: Choose between different models based on your needs
- **Interaction Management**: Store and retrieve conversation history

## Usage

### Basic Chat Completion

```javascript
const { openRouterService } = require('./server/services/ai/openRouter');

// Example: Standard text completion
async function getCompletion() {
  const result = await openRouterService.chatCompletion(
    'Write a short poem about AI',
    {
      model: 'openai/gpt-4o', // Use GPT-4o
      temperature: 0.7,      // Control randomness
      maxTokens: 200         // Limit response length
    }
  );
  
  if (result.success) {
    console.log('Response:', result.data.text);
    console.log('Interaction ID:', result.interactionId);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Web Search Completion

```javascript
// Example: Web search functionality
async function searchWeb() {
  const result = await openRouterService.webSearchChatCompletion(
    'What are the latest developments in quantum computing?',
    {
      temperature: 0.5,
      maxTokens: 300
    }
  );
  
  if (result.success) {
    console.log('Response with web search results:', result.data.text);
  } else {
    console.error('Web search failed:', result.error);
  }
}
```

## Available Models

- `openai/gpt-4o` - Latest GPT-4 model (standard)
- `openai/gpt-4o:online` - GPT-4 with web search capabilities
- `anthropic/claude-3-opus` - Claude 3 Opus model (high quality, more expensive)
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet model (balanced)
- `anthropic/claude-3-haiku` - Claude 3 Haiku model (fastest)

For a complete list of available models, check the [OpenRouter documentation](https://openrouter.ai/docs).

## Configuration

The system uses an environment variable for authentication:

- `OPENROUTER_API_KEY`: Your API key from OpenRouter

## Performance Considerations

- Web search operations generally take longer than standard completions
- For time-sensitive operations, consider using faster models like Claude 3 Haiku
- Token usage is tracked for each interaction

## Troubleshooting

- If you encounter rate limits, consider using a different model provider
- Check your API key if you receive authentication errors
- For persistent errors, review the OpenRouter status page

## Testing

Use the test script to verify your setup:

```
node scripts/test-openrouter.js
```

Or use the workflow:

```
Running workflow: TestOpenRouter
```
