# Arbitrum MCP Server

A Model Context Protocol (MCP) server that provides real-time Arbitrum blockchain data analysis using the Arbiscan API and Claude AI.

## Features

- Real-time Arbitrum blockchain data fetching
- Latest block information
- Transaction analysis
- Account balance checking
- Network statistics
- AI-powered data interpretation using Claude

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API keys:
```
ARBISCAN_API_KEY=your_arbiscan_api_key
CLAUDE_API_KEY=your_claude_api_key
```

3. Run the server:
```bash
npx tsx arbitrum-mcp.ts
```

## Usage

The server provides a tool called "getArbitrumData" that accepts:
- `fullPrompt`: Your query about Arbitrum data
- `address` (optional): Specific Ethereum address to analyze

## Example Queries

- "What is the latest block?"
- "Show me recent transactions"
- "What's the current ETH supply on Arbitrum?"
- "Check balance for address 0x..."

## License

MIT 