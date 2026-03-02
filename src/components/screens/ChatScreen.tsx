import { ArrowLeft, Clock, Loader2, MoreVertical, Paperclip, Send, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { listingsApi, messagingApi, resolveImageUrl } from "../../lib/api";
import type { Conversation, Listing, Message } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { useWebSocket } from "../../lib/useWebSocket";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

export function ChatScreen() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnline = useOnlineStatus();
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);

  // Dynamic conversation + listing state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [relatedListing, setRelatedListing] = useState<Listing | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation details + messages in parallel
  useEffect(() => {
    if (!conversationId) return;

    const loadAll = async () => {
      try {
        setLoading(true);

        // Fetch messages
        const [msgs, conv] = await Promise.all([
          messagingApi.getMessages(conversationId),
          messagingApi.getConversation(conversationId).catch(() => null),
        ]);
        setMessages(msgs);

        if (conv) {
          setConversation(conv);
          // Try to load the related listing if the conversation carries one
          const listingId = conv.listing?.id ?? (conv as any).listing_id ?? null;
          if (listingId) {
            try {
              const lst = await listingsApi.get(String(listingId));
              setRelatedListing(lst);
            } catch {
              // listing fetch is optional — silent fail
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [conversationId]);

  // WebSocket connection
  const { connected, sendMessage: wsSendMessage, sendTyping, sendReadReceipt } = useWebSocket({
    conversationId: conversationId || "",
    onMessage: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      // Send read receipt
      if (newMessage.id) {
        sendReadReceipt(newMessage.id);
      }
    },
    onTyping: (_userId, _userName, isTyping) => {
      setOtherUserTyping(isTyping);
      if (isTyping) {
        // Auto-hide typing indicator after 3 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    },
    onError: (errorMsg) => {
      console.error("WebSocket error:", errorMsg);
    },
  });

  // Handle typing indicator
  const handleTyping = () => {
    if (connected) {
      sendTyping(true);
      // Clear typing after 1 second of no input
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (!message.trim() || !conversationId) return;
    const text = message.trim();

    if (!isOnline || !connected) {
      // Queue for later, optimistically show in UI with a clock icon
      const offlineMsg: Message = {
        id: `offline-${Date.now()}`,
        sender_id: "me",
        text,
        created_at: new Date().toISOString(),
        is_read: false,
        client_id: `offline-${Date.now()}`,
      };
      setMessages((prev) => [...prev, offlineMsg]);
      setOfflineQueue((q) => [...q, text]);
      setMessage("");
      return;
    }

    // Send via WebSocket
    const clientId = wsSendMessage(text);
    if (clientId) {
      const optimisticMessage: Message = {
        id: clientId,
        sender_id: "me",
        text,
        created_at: new Date().toISOString(),
        is_read: false,
        client_id: clientId,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
    }
    setMessage("");
    sendTyping(false);
  };

  // When we come back online, flush the offline queue
  useEffect(() => {
    if (isOnline && connected && offlineQueue.length > 0) {
      offlineQueue.forEach((text) => wsSendMessage(text));
      setOfflineQueue([]);
    }
  }, [isOnline, connected]);

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — messages will sync when you reconnect.</span>
        </div>
      )}

      {/* Connection Status */}
      {isOnline && !connected && (
        <div className="bg-[#FFA726] text-[#2C2C2C] px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting to chat...</span>
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
          <div className="w-10 h-10 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-semibold overflow-hidden">
            {conversation?.other_user?.profile_picture ? (
              <img
                src={conversation.other_user.profile_picture}
                alt={conversation.other_user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(conversation?.other_user?.name ?? "?")[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-[#2C2C2C]">
              {conversation?.other_user?.name ?? "Loading..."}
            </h2>
            <p className="text-xs flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-[#4CAF50]" : "bg-[#757575]"}`}></span>
              <span className={isOnline ? "text-[#4CAF50]" : "text-[#757575]"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </div>

        <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-[#2C2C2C]" />
        </button>
      </div>

      {/* Related Listing Card */}
      {(relatedListing || conversation?.listing) && (() => {
        const lst = relatedListing;
        const convLst = conversation?.listing;
        const listingId = lst?.id ?? convLst?.id ?? null;
        const title =
          lst?.title ??
          lst?.produce_type?.name ??
          convLst?.title ??
          convLst?.produce_type ??
          "Listing";
        const pricePerUnit =
          lst?.price_per_unit ?? convLst?.price_per_unit ?? null;
        const qty =
          lst?.quantity_available ?? convLst?.quantity_available ?? null;
        const unit = lst?.unit ?? convLst?.unit ?? "";
        const totalPrice =
          pricePerUnit != null && qty != null
            ? (pricePerUnit * qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : null;
        const imgSrc = lst
          ? resolveImageUrl(lst.images?.[0], FALLBACK_IMG)
          : FALLBACK_IMG;
        return (
          <div className="bg-white border-b border-[#E0E0E0] px-4 py-3">
            <div className="flex items-center gap-3 p-3 bg-[#F5F5F5] rounded-lg">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#E0E0E0] flex-shrink-0">
                <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{title}</p>
                {totalPrice && (
                  <p className="text-sm text-[#2D5016] font-bold">
                    USD {totalPrice} per {qty} {unit}
                  </p>
                )}
              </div>
              {listingId && (
                <button
                  onClick={() => navigate(`/product/${listingId}`)}
                  className="text-xs text-[#4A90E2] font-medium hover:underline whitespace-nowrap"
                >
                  View Listing
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-[#2D5016] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#EF5350]">{error}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.sender_id === "me";
              const timestamp = new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMe
                          ? "bg-[#2D5016] text-white rounded-br-sm"
                          : "bg-white text-[#2C2C2C] rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-[#757575]">{timestamp}</span>
                      {isMe && msg.is_read && <span className="text-xs text-[#757575]"> • Read</span>}
                      {isMe && msg.id?.startsWith("offline-") && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[#FFA726]">
                          <Clock className="w-3 h-3" /> Will sync when online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#757575] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#757575] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#757575] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
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
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              placeholder={!isOnline ? "You're offline — message will queue" : connected ? "Type a message..." : "Connecting..."}
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
            disabled={!message.trim()}
            className={`p-3 rounded-full mb-1 transition-all ${
              message.trim()
                ? isOnline && connected
                  ? "bg-[#2D5016] hover:bg-[#234010] text-white"
                  : "bg-[#FFA726] hover:bg-[#FB8C00] text-white"
                : "bg-[#E0E0E0] text-[#757575] cursor-not-allowed"
            }`}
          >
            {isOnline && connected ? <Send className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
