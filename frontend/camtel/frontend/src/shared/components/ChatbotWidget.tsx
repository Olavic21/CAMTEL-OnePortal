import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { httpClient } from '@/shared/lib/axios';

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

// Widget chatbot IA basique (roadmap V3) - consomme une facade API cote backend
// (endpoint pressenti /chatbot/ask/), fallback local si l'API n'est pas disponible.
export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'bot', text: 'Bonjour ! Je peux vous aider a trouver un produit CAMTEL ou repondre a vos questions.' },
  ]);
  const [isSending, setIsSending] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', text: input };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setIsSending(true);
    try {
      const { data } = await httpClient.post<{ answer: string }>('/chatbot/ask/', { question: userMessage.text });
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'bot', text: data.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: "Je n'ai pas pu joindre le service d'assistance pour le moment. Contactez-nous via le formulaire de contact.",
        },
      ]);
    } finally {
      setIsSending(false);
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
            className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
              <p className="text-sm font-semibold">OnePortal IA</p>
              <button onClick={() => setIsOpen(false)} aria-label="Fermer l'assistant">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'ml-auto bg-primary text-white' : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
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
                placeholder="Posez votre question..."
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary dark:border-neutral-800"
                aria-label="Votre message"
              />
              <button
                type="submit"
                disabled={isSending}
                aria-label="Envoyer"
                className="rounded-lg bg-primary p-2 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Ouvrir l'assistant CAMTEL"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-600"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
