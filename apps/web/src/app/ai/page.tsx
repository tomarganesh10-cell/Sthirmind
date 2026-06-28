'use client';

import { AiChatBubble } from '@/components/ai/AiChatBubble';

export default function AiPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] pt-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold mb-1">AI Life Coaches</h1>
          <p className="text-[#8B9BB4] text-sm">15 specialized Claude-powered coaches with full context about your life</p>
        </div>
        <AiChatBubble fullPage />
      </div>
    </div>
  );
}
