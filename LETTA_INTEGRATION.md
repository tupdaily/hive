# Letta Cloud Integration Guide

This document explains how to properly integrate with Letta Cloud using the official SDK.

## Current Implementation

Our current implementation (`src/ai/lettaCloud.ts`) uses direct API calls to Letta Cloud. This works but is not the recommended approach for production.

## Recommended Approach: Official Letta SDK

### 1. Install the Official SDK

```bash
npm install @letta-ai/letta-client
```

### 2. Update Environment Variables

Make sure your `.env` file has the correct Letta credentials:

```env
LETTA_API_KEY=your_letta_api_key
LETTA_PROJECT_ID=your_project_id
LETTA_ORGANIZATION_ID=your_organization_id
```

### 3. Use the Official SDK

Replace the current `LettaCloudService` with the official SDK implementation:

```typescript
import { Letta } from '@letta-ai/letta-client';

const client = new Letta({ 
  apiKey: process.env.LETTA_API_KEY 
});

// Create an agent
const agent = await client.agents.create({
  name: 'My Agent',
  description: 'A helpful AI agent'
});

// List agents
const agents = await client.agents.list();

// Create a memory block
const block = await client.blocks.create({
  label: 'shared_memory',
  value: 'This is shared knowledge'
});

// List projects
const projects = await client.projects.list();
```

## Available API Methods

Based on the official documentation, here are the key methods available:

### Agents
- `client.agents.create()` - Create a new agent
- `client.agents.list()` - List all agents
- `client.agents.retrieve(agentId)` - Get a specific agent
- `client.agents.modify(agentId, data)` - Update an agent
- `client.agents.delete(agentId)` - Delete an agent

### Memory Blocks
- `client.blocks.create()` - Create a memory block
- `client.blocks.list()` - List all blocks
- `client.blocks.retrieve(blockId)` - Get a specific block
- `client.blocks.modify(blockId, data)` - Update a block
- `client.blocks.delete(blockId)` - Delete a block

### Projects
- `client.projects.list()` - List all projects
- `client.projects.create()` - Create a new project

### Tools
- `client.tools.create()` - Create a tool
- `client.tools.list()` - List all tools
- `client.tools.attach(agentId, toolId)` - Attach tool to agent

### Sources
- `client.sources.create()` - Create a data source
- `client.sources.list()` - List all sources
- `client.sources.attach(agentId, sourceId)` - Attach source to agent

## Migration Steps

1. **Install the SDK**: `npm install @letta-ai/letta-client`

2. **Update the service**: Replace `src/ai/lettaCloud.ts` with the SDK-based implementation

3. **Update imports**: Change imports from the custom service to the SDK

4. **Test the integration**: Verify that agents and memory blocks sync properly

## Example Implementation

See `src/ai/lettaCloudSDK.ts` for a complete example of how to implement the service using the official SDK.

## Benefits of Using the Official SDK

1. **Type Safety**: Full TypeScript support with proper types
2. **Error Handling**: Built-in error handling and retry logic
3. **Authentication**: Automatic API key management
4. **Updates**: Automatic updates when Letta adds new features
5. **Documentation**: Full documentation and examples
6. **Support**: Official support from Letta team

## Current Status

- ✅ Basic integration working with direct API calls
- ✅ Mock mode for development without credentials
- ✅ Frontend UI for managing Letta Cloud integration
- ⏳ Ready to migrate to official SDK when needed

## Next Steps

1. Install the official `@letta/ai` package
2. Replace the current implementation with the SDK-based one
3. Test the integration thoroughly
4. Deploy and monitor the integration

## Troubleshooting

### Common Issues

1. **API Key Issues**: Make sure your `LETTA_API_KEY` is valid and has the right permissions
2. **Project ID**: Ensure `LETTA_PROJECT_ID` matches your Letta Cloud project
3. **Organization ID**: Verify `LETTA_ORGANIZATION_ID` is correct
4. **Rate Limits**: Be aware of API rate limits and implement proper retry logic

### Debug Mode

Enable debug logging by setting the environment variable:
```env
DEBUG=letta:*
```

This will show detailed logs of all API calls and responses.
