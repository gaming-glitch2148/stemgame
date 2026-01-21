'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Phone, MessageSquare, Send, X, CheckCircle2 } from 'lucide-react';

interface ContactFormProps {
  onClose: () => void;
}

export default function ContactForm({ onClose }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    topic: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
    >
      <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] p-8 max-w-lg w-full border border-white/10 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <X className="w-6 h-6" />
        </button>

        {status === 'success' ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Message Sent!</h3>
            <p className="text-zinc-500 dark:text-zinc-400">We'll get back to you soon.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Contact Us</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Have a question or feedback? We'd love to hear from you.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email or Phone</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    required
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full pl-11 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="Where should we reply?"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Topic</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full pl-11 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                  >
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Feedback</option>
                    <option>Subscription Help</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-medium resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Sending...' : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
              </div>
              {status === 'error' && <p className="text-center text-red-500 text-xs font-bold mt-2 uppercase tracking-widest">Failed to send. Please try again.</p>}
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
}
