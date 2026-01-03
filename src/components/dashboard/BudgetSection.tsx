interface BudgetSectionProps {
  title: string;
  items: unknown[];
}

export default function BudgetSection({ title, items }: BudgetSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="p-4 bg-muted/50 rounded-md">
              {/* Item content will be rendered here */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

