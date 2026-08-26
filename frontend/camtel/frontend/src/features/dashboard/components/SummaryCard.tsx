import { type LucideIcon } from 'lucide-react';
import { Card } from '@/shared/components/Card';

export function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: 'primary' | 'accent';
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-lg ${
          tone === 'primary' ? 'bg-primary-50 text-primary' : 'bg-accent-50 text-accent-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>
    </Card>
  );
}
