import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MoreVertical, Send, Paperclip, WifiOff } from "lucide-react";

export function ChatScreen() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const isOnline = navigator.onLine;

  const messages = [
    {
      id: "1",
      text: "Hi! I'm interested in your White Maize listing.",
      sender: "them",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      text: "Hello! Yes, it's still available. I have 5 tonnes ready.",
      sender: "me",
      timestamp: "10:32 AM",
    },
    {
      id: "3",
      text: "Great! Can you deliver to Harare CBD?",
      sender: "them",
      timestamp: "10:35 AM",
    },
    {
      id: "4",
      text: "Yes, I can arrange delivery. There will be a small delivery fee.",
      sender: "me",
      timestamp: "10:37 AM",
    },
    {
      id: "5",
      text: "That works for me. What's the price for 2 tonnes including delivery?",
      sender: "them",
      timestamp: "10:40 AM",
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // In real app, would send message
      setMessage("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4" />
          <span>Messages will send when online</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#E0E0E0] px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-semibold">
            C
          </div>
          <div>
            <h2 className="font-semibold text-[#2C2C2C]">Chipo's Restaurant</h2>
            <p className="text-xs text-[#757575] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4CAF50]"></span>
              Online
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {/* Related Listing Card */}
      <div className="bg-white border-b border-[#E0E0E0] px-4 py-3">
        <div className="flex items-center gap-3 p-3 bg-[#F5F5F5] rounded-lg">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#E0E0E0]">
            <img
              src="https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWl6ZSUyMGNvcm4lMjBmaWVsZCUyMGhhcnZlc3R8ZW58MXx8fHwxNzcwNzY5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Product"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2C2C2C] truncate">White Maize</p>
            <p className="text-sm text-[#2D5016] font-bold">ZWL 450/kg</p>
          </div>
          <button
            onClick={() => navigate("/product/1")}
            className="text-xs text-[#4A90E2] font-medium hover:underline whitespace-nowrap"
          >
            View Listing
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[75%] ${msg.sender === "me" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`rounded-2xl px-4 py-2 ${
                  msg.sender === "me"
                    ? "bg-[#2D5016] text-white rounded-br-sm"
                    : "bg-white text-[#2C2C2C] rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <span className="text-xs text-[#757575] px-2">{msg.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Replies */}
      <div className="bg-white border-t border-[#E0E0E0] px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Is this still available?", "Can you negotiate?", "Do you offer delivery?"].map((quick) => (
            <button
              key={quick}
              onClick={() => setMessage(quick)}
              className="px-3 py-1.5 bg-[#F5F5F5] hover:bg-[#E0E0E0] rounded-full text-xs text-[#2C2C2C] whitespace-nowrap transition-colors"
            >
              {quick}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#E0E0E0] px-4 py-3">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors mb-1">
            <Paperclip className="w-5 h-5 text-[#757575]" />
          </button>

          <div className="flex-1 bg-[#F5F5F5] rounded-2xl border border-[#E0E0E0] px-4 py-2 focus-within:ring-2 focus-within:ring-[#2D5016] focus-within:border-transparent">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isOnline ? "Type a message..." : "Offline - message will send when connected"}
              rows={1}
              className="w-full bg-transparent focus:outline-none resize-none text-sm text-[#2C2C2C] placeholder:text-[#757575]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim() || !isOnline}
            className={`p-3 rounded-full mb-1 transition-all ${
              message.trim() && isOnline
                ? "bg-[#2D5016] hover:bg-[#234010] text-white"
                : "bg-[#E0E0E0] text-[#757575] cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
