import { ArrowLeft, Clock, Loader2, MoreVertical, Paperclip, Send, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { listingsApi, messagingApi, resolveImageUrl } from "../../lib/api";
import type { Conversation, Listing, Message } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { useWebSocket } from "../../lib/useWebSocket";
import { BottomNav } from "../BottomNav";

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
      setMessages((prev) => {
        if (newMessage.client_id) {
          const existsIndex = prev.findIndex(m => m.client_id === newMessage.client_id);
          if (existsIndex !== -1) {
            const newMsgs = [...prev];
            newMsgs[existsIndex] = newMessage;
            return newMsgs;
          }
        }
        return [...prev, newMessage];
      });
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

    // Get current user id from local storage
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const currentUserId = currentUser ? String(currentUser.id) : "me";

    if (!isOnline) {
      // Queue for later, optimistically show in UI with a clock icon
      const offlineMsg: Message = {
        id: `offline-${Date.now()}`,
        sender_id: currentUserId,
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

    // Send via WebSocket or mock it if backend WS is unavailable
    const clientId = wsSendMessage(text);
    const optimisticMessage: Message = {
      id: clientId || `mock-${Date.now()}`,
      sender_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      is_read: false,
      client_id: clientId || `mock-${Date.now()}`,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    
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
    <div className="chat-page">
      <BottomNav />
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — messages will sync when you reconnect.</span>
        </div>
      )}



      {/* Header */}
      <div className="sticky-header px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-icon-hover">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold overflow-hidden">
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
            <h2 className="font-semibold text-fg">
              {conversation?.other_user?.name ?? "Loading..."}
            </h2>
            <p className="text-xs flex items-center gap-1">
              <span className={isOnline ? "online-dot" : "offline-dot"}></span>
              <span className={isOnline ? "text-success" : "text-muted"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </div>

        <button className="btn-icon-hover">
          <MoreVertical className="w-5 h-5" />
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
          ? resolveImageUrl(lst.images?.find((img: any) => img.is_primary) || lst.images?.[0], FALLBACK_IMG)
          : FALLBACK_IMG;
        return (
          <div className="bg-elevated border-b border-border px-4 py-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg truncate">{title}</p>
                {totalPrice && (
                  <p className="text-sm text-primary font-bold">
                    USD {totalPrice} per {qty} {unit}
                  </p>
                )}
              </div>
              {listingId && (
                <button
                  onClick={() => navigate(`/product/${listingId}`)}
                  className="text-xs text-info font-medium hover:underline whitespace-nowrap"
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
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-error">{error}</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const storedUser = localStorage.getItem('user');
              const currentUser = storedUser ? JSON.parse(storedUser) : null;
              const currentUserId = currentUser ? String(currentUser.id) : "me";
              
              const isMe = String(msg.sender_id) === currentUserId;
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
                    <div className={isMe ? "chat-bubble-sent" : "chat-bubble-received"}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs text-muted">{timestamp}</span>
                      {isMe && msg.is_read && <span className="text-xs text-muted"> • Read</span>}
                      {isMe && msg.id?.startsWith("offline-") && (
                        <span className="flex items-center gap-0.5 text-[10px] text-warning">
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
                <div className="chat-bubble-received">
                  <div className="flex gap-1">
                    <span className="typing-dot typing-dot--1"></span>
                    <span className="typing-dot typing-dot--2"></span>
                    <span className="typing-dot typing-dot--3"></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Replies */}
      <div className="bg-elevated border-t border-border px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Is this still available?", "Can you negotiate?", "Do you offer delivery?"].map((quick) => (
            <button
              key={quick}
              onClick={() => setMessage(quick)}
              className="quick-reply-btn"
            >
              {quick}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-elevated border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <button className="btn-icon-hover mb-1">
            <Paperclip className="w-5 h-5 text-muted" />
          </button>

          <div className="chat-input-wrap">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              placeholder={!isOnline ? "You're offline — message will queue" : connected ? "Type a message..." : "Connecting..."}
              rows={1}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`chat-send-btn ${
              message.trim()
                ? isOnline
                  ? "chat-send-ready"
                  : "chat-send-offline"
                : "chat-send-disabled"
            }`}
          >
            {isOnline ? <Send className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
