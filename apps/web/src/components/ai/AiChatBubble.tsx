'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Mic, MicOff, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

const AGENTS = [
  { key: 'life_coach',    label: '🧘 Life Coach' },
  { key: 'health_coach',  label: '💪 Health' },
  { key: 'purpose_coach', label: '🎯 Purpose' },
  { key: 'happiness_coach', label: '✨ Happiness' },
  { key: 'executive_coach', label: '🏢 Executive' },
] as const;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  defaultAgent?: string;
  compact?: boolean;
}

export function AiChatBubble({ defaultAgent = 'life_coach', compact = false }: Props) {
  const [agent, setAgent] = useState(defaultAgent);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/ai/chat', { message, agentType: agent, sessionId }),
    onSuccess: (data) => {
      setSessionId(data.data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data.message,
        timestamp: new Date(),
      }]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setInput('');
    sendMutation.mutate(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetSession = () => {
    setSessionId(undefined);
    setMessages([]);
  };

  return (
    <div className="card flex flex-col" style={{ height: compact ? '320px' : '460px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--navy)]">SthirMind AI</p>
            <p className="text-xs text-[var(--muted)]">Powered by Claude</p>
          </div>
        </div>
        <button onClick={resetSession} className="text-[var(--muted)] hover:text-[var(--navy)] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Agent selector */}
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
        {AGENTS.map(a => (
          <button
            key={a.key}
            onClick={() => { setAgent(a.key); resetSession(); }}
            className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${
              agent === a.key
                ? 'bg-[var(--navy)] text-white'
                : 'bg-[var(--border)] text-[var(--muted)] hover:bg-[var(--navy)] hover:text-white'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-[var(--muted)] text-sm py-8">
            <p className="text-2xl mb-2">🙏</p>
            <p className="font-medium">Start a conversation</p>
            <p className="text-xs mt-1">Your AI coach is here, fully present.</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--navy)] text-white rounded-br-sm'
                    : 'bg-[var(--border)] text-[var(--text)] rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sendMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-[var(--border)] px-4 py-2 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border)] flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach anything…"
          rows={1}
          className="flex-1 resize-none bg-[var(--bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--navy)] transition-colors"
          style={{ maxHeight: '80px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          className="w-9 h-9 rounded-xl bg-[var(--navy)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
