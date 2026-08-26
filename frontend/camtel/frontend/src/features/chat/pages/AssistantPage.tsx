import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, RotateCcw } from 'lucide-react';
import { useAskChat } from '../hooks/useChat';
import { OnePortalAILogo } from '@/shared/components/OnePortalAILogo';
import { Button } from '@/shared/components/Button';

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string;
  source?: string;
}

// Page Assistant (route /assistant) — interface full-size du chatbot IA.
// Consomme le meme endpoint public /chatbot/ask/ que le ChatbotWidget,
// mais en mode conversation pleine page (trace de l'historique).
export default function AssistantPage() {
  const { t } = useTranslation();
  const askChat = useAskChat();
  const SUGGESTIONS = t('chatbot.suggestions', { returnObjects: true }) as string[];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'bot', text: t('chatbot.welcomeMessage') },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, askChat.isPending]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || askChat.isPending) return;
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', text: content };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    try {
      const data = await askChat.mutateAsync(content);
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: 'bot', text: data.answer, source: data.source },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: 'bot', text: t('chatbot.errorMessage') },
      ]);
    }
  }

  function reset() {
    setMessages([{ id: Date.now(), role: 'bot', text: t('chatbot.welcomeMessage') }]);
    setInput('');
  }

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-center gap-4">
        <OnePortalAILogo variant="header" className="shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('chatbot.title')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('chatbot.subtitle')}</p>
        </div>
        <div className="ml-auto">
          {messages.length > 1 && (
            <Button variant="tertiary" size="sm" onClick={reset} className="gap-1">
              <RotateCcw className="h-4 w-4" /> {t('common.reset')}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div ref={scrollRef} className="max-h-[34rem] space-y-2.5 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] whitespace-pre-line rounded-lg px-3.5 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'ml-auto bg-primary text-white'
                  : 'mr-auto bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'
              }`}
            >
              {m.text}
              {m.role === 'bot' && m.source ? (
                <span className="mt-1 block text-[10px] opacity-60">source: {m.source}</span>
              ) : null}
            </div>
          ))}
          {askChat.isPending && (
            <div className="mr-auto flex w-16 items-center justify-center gap-1 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]" />
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-primary/30 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary-50 dark:border-primary-300/40 dark:text-primary-300 dark:hover:bg-primary-900/30"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatbot.inputPlaceholder')}
            aria-label={t('chatbot.inputLabel')}
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-950"
          />
          <Button type="submit" disabled={askChat.isPending || !input.trim()} className="gap-1">
            <Send className="h-4 w-4" /> {t('chatbot.send')}
          </Button>
        </form>
      </div>
    </div>
  );
}