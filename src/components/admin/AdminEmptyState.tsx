import { Inbox, type LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

const AdminEmptyState = ({ icon: Icon = Inbox, title, description }: AdminEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in duration-500">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-sm border border-border">
          <Icon className="w-9 h-9 text-muted-foreground/40" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent -z-10" />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground mb-1.5 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
};

export default AdminEmptyState;
