import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 px-6 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A]">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
