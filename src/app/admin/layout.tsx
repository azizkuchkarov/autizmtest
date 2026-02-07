export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-bold text-slate-900">Admin Panel</div>
          <nav className="flex gap-4 text-sm font-semibold text-slate-600">
            <a href="/admin" className="hover:text-slate-900">Dashboard</a>
            <a href="/admin/questions" className="hover:text-slate-900">Savollar</a>
            <a href="/admin/blocks" className="hover:text-slate-900">Bloklar</a>
            <a href="/admin/aba-centers" className="hover:text-slate-900">ABA markazlar</a>
            <a href="/admin/scoring" className="hover:text-slate-900">Scoring</a>
            <a href="/admin/ai-prompt" className="hover:text-slate-900">AI Prompt</a>
            <a href="/admin/logs" className="hover:text-slate-900">Loglar</a>
            <a href="/admin/feedback" className="hover:text-slate-900">Feedback</a>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
