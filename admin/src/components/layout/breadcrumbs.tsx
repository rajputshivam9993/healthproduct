import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

/** Reusable breadcrumb trail for nested pages (Req 19.10). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.to && !last ? (
              <Link to={item.to} className="hover:text-foreground">{item.label}</Link>
            ) : (
              <span className={last ? 'text-foreground' : ''}>{item.label}</span>
            )}
            {!last && <ChevronRight className="h-3.5 w-3.5" />}
          </span>
        );
      })}
    </nav>
  );
}
