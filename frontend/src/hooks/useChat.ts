import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { Message, StreamResponse } from '../types/chat';
import { sendMessage as apiSendMessage } from '../services/api';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateLastMessage = useCallback((updates: Partial<Message>) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        Object.assign(lastMessage, updates);
      }
      return newMessages;
    });
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    addMessage({ role: 'user', content: content.trim() });

    // Add assistant message placeholder
    const assistantMessage = addMessage({ 
      role: 'assistant', 
      content: '',
      reasoning: '',
      answer: '',
      isStreaming: true 
    });

    setIsLoading(true);
    setError(null);

    // Track accumulated content
    let accumulatedReasoning = '';
    let accumulatedAnswer = '';
    let buffer = ''; // Buffer for incomplete chunks

    try {
      console.log('Starting streaming request for:', content);
      
      // Use our API service
      const response = await apiSendMessage(content);

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed');
          break;
        }

        // Decode the chunk and add to buffer (ensure proper streaming decode)
        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 Raw chunk received:', chunk.length, 'chars at', new Date().toISOString());
        buffer += chunk;

        // Split by lines and process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamResponse;
              console.log('Received SSE data:', data.type, data.content?.substring(0, 20) + '...');
              
              switch (data.type) {
                case 'reasoning':
                  if (data.content) {
                    accumulatedReasoning += data.content;
                    console.log('🧠 Updating reasoning UI immediately:', data.content);
                    // Force immediate UI update to prevent React batching delays
                    flushSync(() => {
                      updateLastMessage({
                        reasoning: accumulatedReasoning,
                        isStreaming: true
                      });
                    });
                  }
                  break;
                  
                case 'reasoning_done':
                  console.log('Reasoning phase completed');
                  // Force update at phase completion
                  flushSync(() => {
                    updateLastMessage({
                      reasoning: accumulatedReasoning,
                      isStreaming: true
                    });
                  });
                  break;
                  
                case 'answer':
                  if (data.content) {
                    accumulatedAnswer += data.content;
                    console.log('📝 Updating answer UI immediately:', data.content);
                    // Force immediate UI update for each answer chunk
                    flushSync(() => {
                      updateLastMessage({
                        reasoning: accumulatedReasoning,
                        answer: accumulatedAnswer,
                        isStreaming: true
                      });
                    });
                  }
                  break;
                  
                case 'complete':
                  console.log('Stream complete, session ID:', data.session_id);
                  // Mark streaming as complete and set final content
                  updateLastMessage({
                    reasoning: accumulatedReasoning,
                    answer: accumulatedAnswer,
                    isStreaming: false,
                    content: accumulatedReasoning + (accumulatedAnswer ? '\n\n' + accumulatedAnswer : '')
                  });
                  break;
                  
                case 'error':
                  throw new Error(data.message || 'Streaming error occurred');
              }
            } catch (e) {
              console.error('Failed to parse stream data:', e, 'Line:', line);
            }
          }
        }
      }

    } catch (err) {
      console.error('Streaming error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the assistant message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [addMessage, updateLastMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
