const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  good: { dot: "bg-[#0ca30c]", text: "text-[#0ca30c] dark:text-[#0ca30c]" },
  warning: { dot: "bg-[#fab219]", text: "text-[#946a00] dark:text-[#fab219]" },
  critical: { dot: "bg-[#d03b3b]", text: "text-[#d03b3b] dark:text-[#e66767]" },
  neutral: { dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

export function StatusAmountRow({
  items,
}: {
  items: { label: string; amount: number; status: keyof typeof STATUS_STYLES }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
      {items.map((item) => {
        const style = STATUS_STYLES[item.status];
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${style.dot}`} />
              {item.label}
            </div>
            <div className={`text-lg font-semibold tabular-nums ${style.text}`}>
              ₹{item.amount.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
