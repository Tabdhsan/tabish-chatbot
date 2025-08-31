import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../hooks/useChat';
import { MessageCircle, Trash2, AlertCircle } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                AI Financial Analyst
              </h1>
              <p className="text-sm text-slate-400">
                Powered by advanced AI for financial insights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Online
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              disabled={messages.length === 0 || isLoading}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-full px-6 py-4"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Welcome to AI Financial Analyst
                </h3>
                <p className="text-slate-400 max-w-md">
                  Ask me anything about financial analysis, market trends, or investment insights. 
                  I'll provide detailed analysis with real-time streaming responses.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("Analyze Tesla's Q3 performance")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Tesla Q3 Analysis
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("What are the key market trends for 2024?")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    2024 Market Trends
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage("Compare Apple vs Microsoft financials")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Apple vs Microsoft
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-shrink-0 px-6 pb-4">
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Chat Input */}
      <div className="flex-shrink-0 p-6 border-t border-slate-700/50">
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!!error}
        />
        <div className="mt-2 text-xs text-slate-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
