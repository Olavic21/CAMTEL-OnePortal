import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * Drawer lateral reutilisable (mobile/secondaire). Ferme sur Echap.
 * NB : le menu mobile admin utilisait un drawer inline ; ce composant le
 * centralise pour eviter la duplication (KEEP/REFACTOR de AdminLayout).
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'left' | 'right';
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`absolute top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl dark:bg-neutral-900 ${
              side === 'right' ? 'right-0' : 'left-0'
            }`}
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
              <button
                onClick={onClose}
                aria-label={t('common.a11y.close')}
                className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}