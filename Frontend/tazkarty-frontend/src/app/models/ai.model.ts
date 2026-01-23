export interface AIMessage {
  sender: 'user' | 'ai';
  text: string;
  time: Date;
}

export interface AIConversation {
  _id: string;
  user_id: string;
  session_id: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessageRequest {
  sessionId: string;
  text: string;
}

export interface AIMessageResponse {
  message: string;
  userMessage: AIMessage;
  aiMessage: AIMessage;
  conversation: AIConversation;
}

export interface AIRecommendation {
  event: Event;
  score: number;
  reason: string;
}