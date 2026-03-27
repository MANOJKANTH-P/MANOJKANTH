/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

const FAQ_CONTEXT = `
You are a helpful FAQ assistant for "StudioBuild", a platform for building web applications using natural language.
Here are some common questions and answers you should know:
- What is StudioBuild? It's an AI-powered platform that turns natural language prompts into full-stack web applications.
- How do I start? Just type what you want to build in the chat, and the AI will handle the rest.
- Is it free? There is a free tier for hobbyists and paid plans for professional developers.
- Can I export my code? Yes, you can export to GitHub or download as a ZIP file.
- Does it support React? Yes, it defaults to React with TypeScript and Tailwind CSS.
- Can I add a database? Yes, you can use Firebase or SQLite.
- How do I deploy? You can deploy directly to Cloud Run from the settings menu.

If a user asks something outside of these FAQs, answer based on your general knowledge but keep the tone professional and helpful.
`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', content: 'Hi! I\'m your StudioBuild assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })), { role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: FAQ_CONTEXT,
        },
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response.text || "I'm sorry, I couldn't process that request.",
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "Sorry, I encountered an error. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">StudioBuild Support</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">AI Assistant • Online</p>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center text-slate-400 ml-11">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm italic">Assistant is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 md:p-6">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about StudioBuild..."
            className="w-full bg-slate-100 border-none rounded-full py-4 pl-6 pr-14 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-semibold">
          Powered by Gemini AI • StudioBuild FAQ System
        </p>
      </footer>
    </div>
  );
}
