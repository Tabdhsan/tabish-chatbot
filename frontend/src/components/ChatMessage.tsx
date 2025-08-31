import React from 'react';
import type { Message } from '../types/chat';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Bot, User, Loader2 } from 'lucide-react';
import { TypingMessage } from './TypingMessage';
import { cn } from '../lib/utils';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming ?? false;
  const hasReasoning = message.reasoning && message.reasoning.trim();
  const hasAnswer = message.answer && message.answer.trim();

  return (
    <div className={cn(
      'flex w-full mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'flex max-w-[80%] gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        )}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <Card className={cn(
          'flex-1',
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/50'
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant={isUser ? 'secondary' : 'default'} className="text-xs">
                {isUser ? 'You' : 'AI Assistant'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="space-y-3">
              {isUser ? (
                // User message - simple display
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ) : (
                // AI message - use TypingMessage for proper animation
                <>
                  {(hasReasoning || hasAnswer) ? (
                    <TypingMessage
                      reasoning={message.reasoning || ''}
                      answer={message.answer || ''}
                      isStreaming={isStreaming}
                    />
                  ) : (
                    // Loading state when no content yet
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  )}

                  {/* Legacy content display for backward compatibility */}
                  {message.content && !hasReasoning && !hasAnswer && (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
