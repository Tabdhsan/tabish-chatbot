import React from 'react';
import { Brain, MessageSquare } from 'lucide-react';

interface TypingMessageProps {
  reasoning: string;
  answer: string;
  isStreaming: boolean;
  onComplete?: () => void;
}

export const TypingMessage: React.FC<TypingMessageProps> = ({
  reasoning,
  answer,
  isStreaming,
  onComplete
}) => {
  const hasReasoning = reasoning.trim();
  const hasAnswer = answer.trim();

  return (
    <div className="space-y-3">
      {/* Reasoning Phase */}
      {hasReasoning && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
            <Brain className="w-4 h-4" />
            Chain of Thought
          </div>
          <div className="prose prose-sm max-w-none text-sm">
            <div className="whitespace-pre-wrap bg-blue-500/10 p-3 rounded-md border border-blue-500/20">
              <span className="typing-text">
                {reasoning}
                {isStreaming && !hasAnswer && (
                  <span className="typing-cursor">|</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Answer Phase */}
      {hasAnswer && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-400">
            <MessageSquare className="w-4 h-4" />
            Final Answer
          </div>
          <div className="prose prose-sm max-w-none text-sm">
            <div className="whitespace-pre-wrap bg-green-500/10 p-3 rounded-md border border-green-500/20">
              <span className="typing-text">
                {answer}
                {isStreaming && (
                  <span className="typing-cursor">|</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
