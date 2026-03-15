import { ArrowLeft, Loader2, MessageCircle, Search, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { messagingApi } from "../../lib/api";
import type { Conversation } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { AppShell } from "../layout/AppShell";

// Static fallback conversations
const FALLBACK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    other_user: { id: "b1", name: "Chipo's Restaurant" },
    last_message: "Is this still available?",
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread_count: 1,
  },
  {
    id: "2",
    other_user: { id: "b2", name: "Fresh Market Retailers" },
    last_message: "Can you deliver to Bulawayo?",
    last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
  },
  {
    id: "3",
    other_user: { id: "b3", name: "Sarah Khumalo" },
    last_message: "Thank you! I'll take 50kg",
    last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread_count: 0,
  },
];

function formatTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Messages() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const data = await messagingApi.listConversations();
        setConversations(data);
        setUsingFallback(false);
      } catch {
        setConversations(FALLBACK_CONVERSATIONS);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const filtered = conversations.filter((c) =>
    c.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.last_message ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell
      title="Messages"
      subtitle="Conversations between farmers and buyers"
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner flex items-center gap-2 text-sm font-medium">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You're offline — showing cached conversations.</span>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[var(--gray-200)] z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--gray-100)] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--gray-800)]" />
          </button>
          <h1
            className="flex-1 text-[var(--gray-900)]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", fontWeight: 800 }}
          >
            Messages
          </h1>
          {loading && <Loader2 className="w-5 h-5 text-[var(--primary-700)] animate-spin" />}
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray-500)]" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-600)] focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Fallback notice */}
      {isOnline && usingFallback && !loading && (
        <div className="px-4 py-2 bg-[#FFF8E1] border-b border-[#FFE082] text-xs text-[#856404]">
          ⚠️ Could not load conversations from server — showing demo data.
        </div>
      )}

      {/* Conversations List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-[var(--primary-700)] animate-spin mb-3" />
          <p className="text-[var(--gray-600)]">Loading conversations…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-20 h-20 rounded-full bg-[var(--gray-100)] flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-[var(--gray-500)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-2">
            {searchQuery ? "No results" : "No messages yet"}
          </h3>
          <p className="text-sm text-[var(--gray-600)] text-center">
            {searchQuery
              ? "Try a different search term"
              : "Start browsing to connect with farmers and buyers"}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-2 text-sm text-[var(--primary-800)] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[var(--gray-200)]">
          {filtered.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => navigate(`/messages/${conversation.id}`)}
              className="w-full bg-white hover:bg-[var(--gray-50)] transition-colors p-4 flex items-center gap-3 text-left"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-700)] flex items-center justify-center text-white font-semibold">
                  {conversation.other_user.name[0]}
                </div>
                {conversation.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#4A90E2] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className={`font-semibold truncate ${conversation.unread_count > 0 ? "text-[var(--gray-900)]" : "text-[var(--gray-600)]"}`}>
                    {conversation.other_user.name}
                  </h3>
                  <span className="text-xs text-[var(--gray-500)] whitespace-nowrap flex-shrink-0">
                    {formatTime(conversation.last_message_at)}
                  </span>
                </div>
                <p className={`text-sm truncate ${conversation.unread_count > 0 ? "text-[var(--gray-900)] font-medium" : "text-[var(--gray-600)]"}`}>
                  {conversation.last_message ?? "Start a conversation"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}
