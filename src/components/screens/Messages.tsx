import { Leaf, Loader2, MessageCircle, Search, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { messagingApi } from "../../lib/api";
import type { Conversation } from "../../lib/types";
import { useOnlineStatus } from "../../lib/useOnlineStatus";
import { BottomNav } from "../BottomNav";

const FALLBACK_CONVERSATIONS: Conversation[] = [
  { id: "1", other_user: { id: "b1", name: "Chipo's Restaurant" }, last_message: "Is this still available?", last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), unread_count: 1 },
  { id: "2", other_user: { id: "b2", name: "Fresh Market Retailers" }, last_message: "Can you deliver to Bulawayo?", last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), unread_count: 0 },
  { id: "3", other_user: { id: "b3", name: "Sarah Khumalo" }, last_message: "Thank you! I'll take 50kg", last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), unread_count: 0 },
];

function formatTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const AVATAR_TONES = [
  "primary",
  "listings",
  "messages",
  "analytics",
  "neutral",
];

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
      try { const data = await messagingApi.listConversations(); setConversations(data); setUsingFallback(false); }
      catch { setConversations(FALLBACK_CONVERSATIONS); setUsingFallback(true); }
      finally { setLoading(false); }
    };
    fetchConversations();
  }, []);

  const filtered = conversations.filter(
    (c) => c.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const unreadCount = conversations.filter((c) => c.unread_count > 0).length;

  return (
    <div className="msg-page">
      <BottomNav />

      {!isOnline && (
        <div className="msg-banner msg-banner--offline">
          <WifiOff size={15} className="msg-banner__icon" />
          <span>Offline — showing cached conversations.</span>
        </div>
      )}

      {isOnline && usingFallback && !loading && (
        <div className="msg-banner msg-banner--warn">
          <span>⚠️ Could not load from server — showing demo conversations.</span>
        </div>
      )}

      {/* Header */}
      <header className="msg-header">
        <div className="msg-header__top">
          <div className="msg-header__title-wrap">
            <div className="msg-header__icon">
              <MessageCircle size={16} className="msg-header__icon-svg" />
            </div>
            <h1 className="msg-header__title">Messages</h1>
          </div>
          {loading && <Loader2 size={18} className="fd-spin" />}
          {!loading && unreadCount > 0 && (
            <span className="msg-unread-badge">{unreadCount} unread</span>
          )}
        </div>

        <div className="msg-search-wrap">
          <Search size={16} className="msg-search-icon" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="msg-search"
          />
        </div>
      </header>

      {/* Loading Skeletons */}
      {loading && (
        <div className="msg-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="msg-conv msg-conv--skeleton">
              <div className="msg-conv__avatar shimmer" />
              <div className="msg-conv__body">
                <div className="shimmer skeleton-line skeleton-line--msg-title" />
                <div className="shimmer skeleton-line skeleton-line--msg-body" />
              </div>
              <div className="shimmer skeleton-line skeleton-line--xs" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="msg-empty">
          <div className="msg-empty__icon">
            <Leaf className="msg-empty__icon-svg" />
          </div>
          <h3 className="msg-empty__title">
            {searchQuery ? "No results found" : "No messages yet"}
          </h3>
          <p className="msg-empty__desc">
            {searchQuery ? "Try a different search term" : "Start browsing to connect with farmers and buyers."}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="msg-empty__clear">Clear search</button>
          )}
        </div>
      )}

      {/* Conversation List */}
      {!loading && filtered.length > 0 && (
        <div className="msg-list">
          {filtered.map((conversation, i) => {
            const avatarTone = AVATAR_TONES[i % AVATAR_TONES.length];
            const hasUnread = conversation.unread_count > 0;
            return (
              <button
                key={conversation.id}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className={`msg-conv animate-fade-in-up ${hasUnread ? "msg-conv--unread" : ""}`}
              >
                {/* Avatar */}
                <div className="msg-conv__avatar-wrap">
                  <div className={`msg-conv__avatar msg-conv__avatar--${avatarTone}`}>
                    {conversation.other_user.name[0]}
                  </div>
                  {hasUnread && (
                    <div className="msg-conv__count">
                      {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="msg-conv__body">
                  <div className="msg-conv__top-row">
                    <h3 className={`msg-conv__name ${hasUnread ? "msg-conv__name--unread" : ""}`}>
                      {conversation.other_user.name}
                    </h3>
                    <span className="msg-conv__time">{formatTime(conversation.last_message_at)}</span>
                  </div>
                  <p className={`msg-conv__preview ${hasUnread ? "msg-conv__preview--unread" : ""}`}>
                    {conversation.last_message ?? "Start a conversation"}
                  </p>
                </div>

                {hasUnread && <div className="msg-conv__dot" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
