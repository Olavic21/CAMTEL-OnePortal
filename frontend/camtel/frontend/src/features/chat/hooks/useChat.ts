import { useMutation } from '@tanstack/react-query';
import { chatApi, type ChatAskResponse } from '../api/chatApi';

export function useAskChat() {
  return useMutation<ChatAskResponse, Error, string>({
    mutationFn: (question) => chatApi.ask(question),
  });
}