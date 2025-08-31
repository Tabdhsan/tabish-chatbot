import type { StreamResponse, ChatRequest } from '../types/chat';

// Real API call to the backend
export const sendMessage = async (query: string, systemPrompt?: string): Promise<Response> => {
  const requestBody: ChatRequest = {
    query,
    system_prompt: systemPrompt || "You are an expert financial analyst. Provide detailed analysis with step-by-step reasoning. Be professional and thorough in your explanations."
  };

  try {
    const response = await fetch('/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    console.warn('Backend API not available, falling back to mock:', error);
    // Fallback to mock API if backend is not available
    const stream = await mockStreamResponse(query);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
};

// Fallback mock for development/testing when backend is not available
export const mockStreamResponse = async (message: string): Promise<ReadableStream> => {
  const encoder = new TextEncoder();
  
  const isFinancialQuery = message.toLowerCase().includes('tesla') || 
                          message.toLowerCase().includes('apple') || 
                          message.toLowerCase().includes('market') ||
                          message.toLowerCase().includes('financial') ||
                          message.toLowerCase().includes('revenue') ||
                          message.toLowerCase().includes('performance');

  // Simulate the exact SSE pattern you showed
  const reasoningChunks = isFinancialQuery ? [
    "**Clar",
    "ifying",
    " Tesla",
    "'s",
    " Q",
    "3",
    " Analysis",
    "**\n\nI",
    " need",
    " to",
    " analyze",
    " the",
    " financial",
    " data",
    " step",
    " by",
    " step",
    "..."
  ] : [
    "Let",
    " me",
    " think",
    " about",
    " this",
    " step",
    " by",
    " step",
    "..."
  ];

  const answerChunks = isFinancialQuery ? [
    "Based",
    " on",
    " my",
    " analysis",
    ":\n\n",
    "•",
    " Revenue",
    " growth",
    " is",
    " strong",
    "\n•",
    " Profit",
    " margins",
    " improved",
    "\n•",
    " Market",
    " position",
    " remains",
    " solid"
  ] : [
    "Here",
    " is",
    " my",
    " analysis:\n\n",
    "The",
    " key",
    " points",
    " are",
    " clear",
    " and",
    " well",
    " documented."
  ];

  return new ReadableStream({
    async start(controller) {
      // Send reasoning chunks one by one
      for (const chunk of reasoningChunks) {
        const data: StreamResponse = {
          type: 'reasoning',
          content: chunk
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }

      // Send reasoning_done
      const reasoningDone: StreamResponse = { type: 'reasoning_done' };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(reasoningDone)}\n\n`));
      await new Promise(resolve => setTimeout(resolve, 200));

      // Send answer chunks one by one
      for (const chunk of answerChunks) {
        const data: StreamResponse = {
          type: 'answer',
          content: chunk
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 80));
      }

      // Send complete
      const complete: StreamResponse = { 
        type: 'complete', 
        session_id: `session_${Date.now()}` 
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(complete)}\n\n`));

      controller.close();
    }
  });
};

