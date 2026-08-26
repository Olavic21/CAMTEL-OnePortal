import { httpClient } from '@/shared/lib/axios';

// Endpoint public /chatbot/ask/ (apps/core/views.py#ChatbotView).
// Renvoie { answer, source, provider?, model?, confidence? }.
export interface ChatAskResponse {
  answer: string;
  source: string;
  provider?: string;
  model?: string;
  confidence?: number;
  sources?: string[];
}

export const chatApi = {
  ask: (question: string) =>
    httpClient
      .post<ChatAskResponse>('/chatbot/ask/', { question })
      .then((r) => r.data),
};