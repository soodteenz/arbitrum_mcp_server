import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import 'dotenv/config'

const server = new McpServer({
  name: "Arbitrum Analytics Service",
  version: "1.0.0",
});

interface GetArbitrumDataParams {
  fullPrompt: string;
  address?: string;
}

server.tool(
  "getArbitrumData",
  {
    fullPrompt: z.string().describe("The complete user query about Arbitrum data"),
    address: z.string().optional().describe("Optional specific address to focus on"),
  },
  async ({ fullPrompt, address }: GetArbitrumDataParams) => {
    try {
      // Get account balance if address is provided
      let accountData = null;
      if (address) {
        const balanceResponse = await fetch(`https://api.arbiscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ARBISCAN_API_KEY || ''}`);
        accountData = await balanceResponse.json();
      }

      // Get general stats
      const statsResponse = await fetch(`https://api.arbiscan.io/api?module=stats&action=ethsupply&apikey=${process.env.ARBISCAN_API_KEY || ''}`);
      const statsData = await statsResponse.json();

      // Get latest block number
      const latestBlockResponse = await fetch(`https://api.arbiscan.io/api?module=proxy&action=eth_blockNumber&apikey=${process.env.ARBISCAN_API_KEY || ''}`);
      const latestBlockData = await latestBlockResponse.json();

      // Get latest block transactions using proxy API
      const latestBlockNumber = latestBlockData.result;
      const txListResponse = await fetch(`https://api.arbiscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${latestBlockNumber}&boolean=true&apikey=${process.env.ARBISCAN_API_KEY || ''}`);
      const txListData = await txListResponse.json();

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `
                You are an Arbitrum blockchain data assistant. Your task is to analyze Arbitrum data and respond to user queries.
                
                Here is the data from the Arbiscan API:
                ${JSON.stringify({
                  accountData: accountData,
                  statsData: statsData,
                  latestBlock: latestBlockData,
                  latestBlockTransactions: txListData
                }, null, 2)}
                
                User query: ${fullPrompt}
                ${address ? `Address: ${address}` : ''}
                
                Provide a well-structured response that directly addresses the user's query about the Arbitrum data.
                Focus on being accurate, informative, and comprehensive.
                
                When discussing transaction data:
                1. List the transactions in chronological order (newest first)
                2. Include relevant details like hash, from/to addresses (abbreviated), value, and transaction type
                3. Format the response in a clear, readable way
                4. Highlight any interesting patterns or notable transactions
                5. Explain the context of the Arbitrum network for users who may be unfamiliar
                
                For transaction values in Wei, convert them to ETH (1 ETH = 1e18 Wei).
                Format addresses as shortened versions (e.g., 0x1234...5678).
              `
            }
          ]
        })
      })
      const claudeJson = await claudeResponse.json()

      return {
        content: [
          {
            type: "text",
            text: `${claudeJson.content[0].text}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching Arbitrum data: ${err}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
