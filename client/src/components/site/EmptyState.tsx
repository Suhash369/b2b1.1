import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";

type EmptyStateProps = {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function EmptyState({ icon: Icon, eyebrow = "Nothing published yet", title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} strokeWidth={1.8} /></div>
      <div className="empty-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="button button-outline button-small">{actionLabel}<span aria-hidden="true">↗</span></Link>
        )}
      </div>
    </div>
  );
}
