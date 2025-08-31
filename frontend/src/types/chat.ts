export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  reasoning?: string;
  answer?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface StreamResponse {
  type: 'reasoning' | 'reasoning_done' | 'answer' | 'complete' | 'error';
  content?: string;
  session_id?: string;
  message?: string;
}

export interface ChatRequest {
  query: string;
  system_prompt?: string;
}
