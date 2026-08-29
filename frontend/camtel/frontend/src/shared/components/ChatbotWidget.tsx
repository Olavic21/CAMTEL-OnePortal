import { useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { httpClient } from '@/shared/lib/axios';
import { CAMTELAssistantLogo } from '@/shared/components/OnePortalAILogo';
import { useTranslation } from 'react-i18next';

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

// Widget assistant IA professionnel : suggestions, indicateur de saisie,
// auto-scroll et gestion des erreurs. Consomme /chatbot/ask/ avec repli local.
export function ChatbotWidget() {
  const { t } = useTranslation();
  const SUGGESTIONS = t('chatbot.suggestions', { returnObjects: true }) as string[];
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'bot',
      text: t('chatbot.welcomeMessage'),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: content };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setIsTyping(true);
    try {
      const { data } = await httpClient.post<{ answer: string }>('/chatbot/ask/', { question: userMessage.text });
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'bot', text: data.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: t('chatbot.errorMessage'),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mb-3 flex h-[26rem] w-80 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:w-96"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-primary-900 via-primary to-primary-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <CAMTELAssistantLogo variant="icon" className="h-8 w-8 rounded-lg" />
                <div>
                  <p className="text-sm font-semibold text-white">{t('chatbot.title')}</p>
                  <p className="flex items-center gap-1 text-[11px] text-white/80">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t('chatbot.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label={t('chatbot.close')}
                className="rounded-lg p-1 text-white/90 transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div className="flex w-16 items-center justify-center gap-1 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0.2s]" />
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-3 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
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
                sendMessage();
              }}
              className="flex items-center gap-2 border-t border-neutral-200 p-2 dark:border-neutral-800"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatbot.inputPlaceholder')}
                aria-label={t('chatbot.inputLabel')}
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-700 dark:bg-neutral-950"
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                aria-label={t('chatbot.send')}
                className="rounded-lg bg-primary p-2 text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t('chatbot.open')}
        className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </div>
  );
}
