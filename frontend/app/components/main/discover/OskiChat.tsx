'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BACKEND_URL, CHATBOT_URL } from '@/lib/apiEndPoints';
import { useMap } from './MapContext';
interface OskiChatProps {
  onLibrarySelect: (name: string) => void;
}

export default function OskiChat({ onLibrarySelect }: OskiChatProps) {
    const { goToBestMatch } = useMap();
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: 'Hey! I’m OskiChat. New to campus? I can help you get around. Feel free to tap around the map above. What are you looking for?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [makingRequest, setMakingRequest] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (makingRequest || !chatInput.trim()) return;

    const trimmedInput = chatInput.trim();
    const newHistory = [...chatHistory, { role: "user", text: trimmedInput }].slice(-5);

    setChatHistory(newHistory);
    setChatInput("");

    if (trimmedInput.length < 10) {
      setChatHistory((prev) =>
        [...prev, { role: "bot", text: "You gotta write a little more than that :)" }].slice(-5)
      );
      return;
    }

    setMakingRequest(true);
    setChatHistory((prev) => [...prev, { role: "bot", text: "Thinking..." }].slice(-5));

    try {
      const res = await fetch(CHATBOT_URL + "/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_lat: 37.8715,
          user_lng: -122.2730,
          query: trimmedInput.length > 250 ? trimmedInput.substring(0, 250) : trimmedInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.error || "Request failed");

      const recommendation = data.final_json;
      
      // Secondary background store fetch (non-blocking)
      fetch(BACKEND_URL + "/api/oskichat/store_search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_lat: 37.8715,
          user_lng: -122.2730,
          query: trimmedInput.length > 250 ? trimmedInput.substring(0, 250) : trimmedInput,
          output: data || {}
        }),
      }).catch((err) => console.error("Store search log failed:", err));

      setChatHistory((prev) => {
        const withoutLoading = prev.filter((msg) => !(msg.role === "bot" && msg.text === "Thinking..."));
        return [...withoutLoading, { role: "bot", text: recommendation.pitch }].slice(-5);
      });

    //   onLibrarySelect(recommendation.name);
    goToBestMatch(recommendation.name);
    } catch (error) {
      console.error("Failed to fetch recommendation:", error);
      setChatHistory((prev) => {
        const withoutLoading = prev.filter((msg) => !(msg.role === "bot" && msg.text === "Thinking..."));
        return [...withoutLoading, { role: "bot", text: "I couldn't find anything meeting your criteria, try sending me the message again." }].slice(-5);
      });
    } finally {
      setMakingRequest(false);
    }
  };

  return (
    <div 
      className={`absolute bottom-[150px] left-4 right-4 max-w-lg pointer-events-auto flex flex-col shrink-0 order-1 bg-white/95 backdrop-blur-md border border-gray-200 rounded-[2rem] shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
        isChatMinimized ? 'h-[40px] cursor-pointer hover:bg-gray-50' : 'h-[260px]'
      }`}
    >
      <div 
        className="flex shrink-0 items-center justify-between px-5 py-2 bg-gray-50/80 cursor-pointer h-[40px]"
        onClick={() => setIsChatMinimized(!isChatMinimized)}
      >
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          OskiChat
        </span>
        <button className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
          {isChatMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!isChatMinimized && (
        <>
          <div className="flex-grow flex flex-col gap-2 p-3 overflow-y-auto hide-scrollbar bg-white/50 border-t border-gray-100">
            <div className="flex-grow" /> 
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] rounded-2xl px-3.5 py-1.5 text-sm shadow-sm shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white self-end rounded-br-sm' 
                    : 'bg-gray-200 text-gray-800 self-start rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="shrink-0 p-2 relative flex items-center bg-white border-t border-gray-100 h-14">
            <Input
              type="text"
              placeholder="Ask Oski about Berkeley spots..."
              className="w-full pl-4 pr-10 py-5 bg-white border border-gray-200 rounded-full focus:ring-0 text-md"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <Button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="absolute right-3.5 h-7 w-7 rounded-full bg-blue-500 p-0 text-white border-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
              </svg>
            </Button>
          </form>
        </>
      )}
    </div>
  );
}