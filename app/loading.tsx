export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-[28px] bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-64 rounded-[22px] bg-muted" />
        <div className="h-64 rounded-[22px] bg-muted" />
      </div>
    </div>
  );
}
