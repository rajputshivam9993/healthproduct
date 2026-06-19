import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PagePlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Temporary page body used by scaffolded routes. Replaced with real tables/forms
 * as features are implemented; centralised so stub pages stay consistent (Req 20.1).
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {description ?? 'This section will be implemented in a later task.'}
        </CardContent>
      </Card>
    </div>
  );
}
