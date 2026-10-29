export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="h-1 bg-blue-600" />
      {children}
    </div>
  );
}
