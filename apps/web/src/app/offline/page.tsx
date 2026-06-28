export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl mb-6">🧘</div>
      <h1 className="text-2xl font-black text-white mb-3">You're Offline</h1>
      <p className="text-[#8B9BB4] mb-8 max-w-xs leading-relaxed">
        No connection right now. Your saved wisdom, notes, and daily quotes are still available.
      </p>
      <div className="bg-[#1A2A3D] border border-white/10 rounded-2xl p-6 max-w-xs w-full mb-6 text-left">
        <p className="text-[#F4A261] text-xs font-bold uppercase tracking-widest mb-3">Available Offline</p>
        {['📖 Cached book summaries', '📝 Your knowledge vault', '✨ Today\'s daily wisdom', '📊 Your analytics snapshot'].map(item => (
          <p key={item} className="text-[#8B9BB4] text-sm py-2 border-b border-white/5 last:border-0">{item}</p>
        ))}
      </div>
      <button onClick={() => window.location.reload()} className="bg-[#F4A261] text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
        Try Again
      </button>
    </div>
  );
}
