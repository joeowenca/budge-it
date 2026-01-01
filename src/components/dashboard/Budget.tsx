export default function Budget() {
  return (
    <div className="h-full flex flex-col p-6 border rounded-lg shadow bg-card">
      <div className="flex-none mb-4">
        <h2 className="text-xl font-semibold mb-4">Budget</h2>
        <p className="text-muted-foreground">Budget content will go here</p>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full lg:overflow-y-auto">
          <div className="space-y-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-md">
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

