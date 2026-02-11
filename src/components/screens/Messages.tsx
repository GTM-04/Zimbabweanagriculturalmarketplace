import { useNavigate } from "react-router";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
import { BottomNav } from "../BottomNav";
import { farmers, buyers } from "../../lib/data";

const sampleConversations = [
  {
    id: "1",
    name: "Chipo's Restaurant",
    lastMessage: "Is this still available?",
    timestamp: "2 hours ago",
    unread: true,
    userType: "buyer",
    productImage: "https://images.unsplash.com/photo-1649251037465-72c9d378acb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWl6ZSUyMGNvcm4lMjBmaWVsZCUyMGhhcnZlc3R8ZW58MXx8fHwxNzcwNzY5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "2",
    name: "Fresh Market Retailers",
    lastMessage: "Can you deliver to Bulawayo?",
    timestamp: "5 hours ago",
    unread: false,
    userType: "buyer",
    productImage: "https://images.unsplash.com/photo-1700064165267-8fa68ef07167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHRvbWF0b2VzJTIwcHJvZHVjZXxlbnwxfHx8fDE3NzA3MDk4NDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "3",
    name: "Sarah Khumalo",
    lastMessage: "Thank you! I'll take 50kg",
    timestamp: "1 day ago",
    unread: false,
    userType: "buyer",
    productImage: "https://images.unsplash.com/photo-1695590293008-50388acdd7fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXR0ZXJudXQlMjBzcXVhc2glMjB2ZWdldGFibGVzfGVufDF8fHx8MTc3MDc2OTc4NHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export function Messages() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#E0E0E0] z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
          </button>
          <h1 className="text-xl font-semibold text-[#2C2C2C] flex-1">Messages</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#757575]" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full h-10 pl-10 pr-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-[#E0E0E0]">
        {sampleConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => navigate(`/messages/${conversation.id}`)}
            className="w-full bg-white hover:bg-[#F5F5F5] transition-colors p-4 flex items-start gap-3 text-left"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#2D5016] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {conversation.name[0]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`font-semibold truncate ${conversation.unread ? "text-[#2C2C2C]" : "text-[#757575]"}`}>
                  {conversation.name}
                </h3>
                <span className="text-xs text-[#757575] whitespace-nowrap">
                  {conversation.timestamp}
                </span>
              </div>
              <p className={`text-sm truncate ${conversation.unread ? "text-[#2C2C2C] font-medium" : "text-[#757575]"}`}>
                {conversation.lastMessage}
              </p>
            </div>

            {/* Product Thumbnail */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F5F5] flex-shrink-0">
              <img
                src={conversation.productImage}
                alt="Product"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Unread Badge */}
            {conversation.unread && (
              <div className="absolute right-16 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-[#4A90E2] rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {sampleConversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-[#757575]" />
          </div>
          <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">No messages yet</h3>
          <p className="text-sm text-[#757575] text-center">
            Start browsing to connect with farmers and buyers
          </p>
        </div>
      )}

      <BottomNav userType="farmer" />
    </div>
  );
}
