import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AIPersonality, ChatMessage } from '../types';
import { testPersonalityChat } from '../services/adminService';
import Button from './Button';
import { X, Send, Bot, User, Trash2 } from 'lucide-react';

interface PersonalityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  personality: AIPersonality | null;
  teacherName?: string;
}

const PersonalityTestModal: React.FC<PersonalityTestModalProps> = ({ 
  isOpen, 
  onClose, 
  personality,
  teacherName 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame for better timing with DOM painting
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    } else {
      setMessages([]);
      setInput('');
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // If not open or no portal target (document.body), don't render
  if (!isOpen || !personality || typeof document === 'undefined') return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add User Message
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // API Call
      const aiResponse = await testPersonalityChat(personality.systemPrompt, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: Failed to get response from AI." }]);
    } finally {
      setLoading(false);
      // Re-focus input after sending
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        // Only close if clicking the backdrop itself
        if (e.target === e.currentTarget) {
           onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] relative overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
              <Bot className="w-6 h-6 text-orange-500" />
              Test Personality
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Simulating: <span className="font-medium text-gray-700">{personality.personalityName}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
              <Bot className="w-12 h-12 text-gray-300" />
              <div className="text-center">
                <p className="font-medium text-gray-500">Start testing this personality</p>
                <p className="text-xs mt-1">Try asking specific subject questions.</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setInput("Hello teacher!");
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-orange-300 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  "Hello teacher!"
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setInput("Explain this topic");
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-orange-300 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  "Explain this topic"
                </button>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                }
              `}>
                <div className="flex items-center gap-2 mb-1.5 opacity-80 text-[10px] uppercase tracking-wider font-bold">
                  {msg.role === 'user' ? (
                    <>
                      <span>You</span>
                      <User className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3" />
                      <span>{teacherName || 'AI Teacher'}</span>
                    </>
                  )}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-4 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0 z-10">
            <form onSubmit={handleSend} className="flex gap-3 relative">
            <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400 transition-all shadow-sm"
                autoComplete="off"
            />
            <Button 
                type="submit" 
                variant="admin" 
                className={`w-auto px-6 rounded-xl flex items-center justify-center flex-shrink-0 ${loading || !input.trim() ? 'opacity-50' : 'hover:scale-105'}`} 
                disabled={loading || !input.trim()}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Send className="w-5 h-5" />
                )}
            </Button>
            </form>
            <div className="text-center mt-2">
                <button 
                  type="button"
                  onClick={() => setMessages([])} 
                  className="text-[10px] text-gray-400 hover:text-red-500 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                >
                    <Trash2 className="w-3 h-3" /> Clear Chat
                </button>
            </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PersonalityTestModal;