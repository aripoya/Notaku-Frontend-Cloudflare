"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles, Bot, User, Send, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionAPI } from "@/lib/subscription-api";
import { UpgradeModal } from "@/components/UpgradeModal";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiQueriesRemaining, setAiQueriesRemaining] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch AI queries remaining
  useEffect(() => {
    const fetchAIQueries = async () => {
      if (!user?.id) return;
      
      try {
        const remaining = await SubscriptionAPI.getRemainingAIQueries(user.id);
        setAiQueriesRemaining(remaining);
      } catch (error) {
        console.error("[Chat] Error fetching AI queries:", error);
      }
    };
    
    fetchAIQueries();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAIQueries, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Check AI permission BEFORE sending (skip if API not available)
    if (user?.id) {
      try {
        const permission = await SubscriptionAPI.checkAIPermission(user.id);
        
        if (!permission.allowed) {
          setUpgradeReason(permission.message || "AI query limit reached. Please upgrade your plan.");
          setShowUpgradeModal(true);
          toast.error("AI Limit Reached", {
            description: permission.message || "Upgrade to continue using AI chat"
          });
          return;
        }
        
        // Update remaining queries
        setAiQueriesRemaining(permission.remaining);
      } catch (error: any) {
        console.warn("[Chat] AI permission check failed (API not available), allowing chat:", error.message);
        // Continue anyway if check fails - allows app to work without subscription backend
      }
    }

    // Add user message
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Add streaming placeholder
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Call real backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.notaku.cloud"}/api/v1/chat/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for auth
          body: JSON.stringify({
            message: message,
            context: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response || "Maaf, tidak ada response dari AI.";

      // Simulate streaming by updating word by word
      const words = aiResponse.split(" ");
      let currentText = "";

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? " " : "") + words[i];
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: currentText,
            isStreaming: i < words.length - 1,
          };
          return newMessages;
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Format message content (simple markdown-like formatting)
  const formatMessage = (content: string) => {
    // Split by ** for bold
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header (Fixed Top) */}
      <div className="border-b p-4 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Chat AI
            </h1>
            <p className="text-sm text-muted-foreground">
              Tanya apapun tentang keuangan bisnis Anda
            </p>
          </div>
          {/* AI Queries Remaining Badge */}
          {aiQueriesRemaining !== null && (
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${
                aiQueriesRemaining === 0 ? 'border-red-500 text-red-600' : 
                aiQueriesRemaining < 5 ? 'border-orange-500 text-orange-600' : 
                'border-blue-500 text-blue-600'
              }`}
            >
              <Zap className="h-3 w-3" />
              {aiQueriesRemaining === -1 ? 'Unlimited' : `${aiQueriesRemaining} queries left`}
            </Badge>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={user && 'subscription_tier' in user ? (user as any).subscription_tier : 'free'}
        reason={upgradeReason}
      />

      {/* Messages Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.length === 0 ? (
          // Welcome screen
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            <div className="rounded-full bg-blue-100 dark:bg-blue-950 p-6 mb-4">
              <MessageSquare className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
              Mulai percakapan dengan AI
            </h2>
            <p className="text-muted-foreground mb-6">
              Tanyakan tentang pengeluaran, supplier, atau minta rekomendasi
              untuk menghemat biaya
            </p>

            {/* Suggested questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {[
                "Berapa total belanja bulan ini?",
                "Supplier mana yang paling mahal?",
                "Bandingkan pengeluaran bulan ini vs bulan lalu",
                "Apa kategori pengeluaran terbesar?",
                "Berikan tips hemat biaya",
                "Tren pengeluaran 3 bulan terakhir",
              ].map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300"
                  onClick={() => handleSendMessage(question)}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {message.role === "assistant" && message.isStreaming ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-muted-foreground">
                        Sedang berpikir...
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.role === "assistant"
                        ? formatMessage(message.content)
                        : message.content}
                    </p>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Fixed Bottom) */}
      <div className="border-t p-4 bg-white dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ketik pertanyaan Anda..."
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI mungkin membuat kesalahan. Periksa informasi penting.
        </p>
      </div>
    </div>
  );
}
