"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles, Bot, User, Send, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubscriptionAPI } from "@/lib/subscription-api";
import { API_BASE_URL } from "@/lib/api-config";
import { UpgradeModal } from "@/components/UpgradeModal";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatRequest } from "@/types/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiQueriesRemaining, setAiQueriesRemaining] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [thinkingText, setThinkingText] = useState("Sedang berpikir...");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    console.log("[Chat] User from AuthContext:", user);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, user]);

  // Thinking text animation with contextual messages
  useEffect(() => {
    if (isLoading) {
      const lastUserMessage =
        messages.filter((m) => m.role === "user").pop()?.content.toLowerCase() || "";

      let thinkingStates = [
        "Sedang berpikir...",
        "Sedang mengumpulkan data...",
        "Sedang menganalisa...",
        "Menyiapkan jawaban...",
      ];

      if (
        lastUserMessage.includes("berapa") ||
        lastUserMessage.includes("total") ||
        lastUserMessage.includes("jumlah")
      ) {
        thinkingStates = [
          "Sedang menghitung...",
          "Sedang mengumpulkan data transaksi...",
          "Sedang menganalisa angka...",
          "Menyiapkan laporan...",
        ];
      } else if (
        lastUserMessage.includes("supplier") ||
        lastUserMessage.includes("merchant") ||
        lastUserMessage.includes("toko")
      ) {
        thinkingStates = [
          "Sedang mencari data supplier...",
          "Sedang mengumpulkan informasi merchant...",
          "Sedang menganalisa pola belanja...",
          "Menyiapkan rekomendasi...",
        ];
      } else if (
        lastUserMessage.includes("bandingkan") ||
        lastUserMessage.includes("vs") ||
        lastUserMessage.includes("dibanding")
      ) {
        thinkingStates = [
          "Sedang membandingkan data...",
          "Sedang mengumpulkan periode...",
          "Sedang menganalisa perbedaan...",
          "Menyiapkan perbandingan...",
        ];
      } else if (
        lastUserMessage.includes("tips") ||
        lastUserMessage.includes("saran") ||
        lastUserMessage.includes("rekomendasi")
      ) {
        thinkingStates = [
          "Sedang menganalisa pola...",
          "Sedang mencari peluang hemat...",
          "Sedang menyusun strategi...",
          "Menyiapkan rekomendasi...",
        ];
      } else if (
        lastUserMessage.includes("tren") ||
        lastUserMessage.includes("trend") ||
        lastUserMessage.includes("grafik")
      ) {
        thinkingStates = [
          "Sedang menganalisa tren...",
          "Sedang mengumpulkan data historis...",
          "Sedang menghitung perubahan...",
          "Menyiapkan visualisasi...",
        ];
      }

      let index = 0;
      setThinkingText(thinkingStates[0]);

      const interval = setInterval(() => {
        index = (index + 1) % thinkingStates.length;
        setThinkingText(thinkingStates[index]);
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isLoading, messages]);

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
    const interval = setInterval(fetchAIQueries, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSendMessage = async (message: string) => {
    console.log("[Chat] 🚀 Starting handleSendMessage");
    console.log("[Chat] Message:", message);

    let bearerToken: string | undefined;
    try {
      const res = await fetch(`/api/auth/session`, { credentials: "include" });
      const freshSession = res.status === 200 ? await res.json() : null;
      bearerToken =
        freshSession?.backendAccessToken || freshSession?.accessToken || undefined;
      console.log(
        "[Chat] Token dari session:",
        bearerToken ? "ada" : "tidak ada (akan pakai cookie)"
      );
    } catch (err) {
      console.warn(
        "[Chat] Tidak bisa baca /api/auth/session, lanjut pakai cookie saja:",
        err
      );
    }

    const currentUser = user;

    // ❌ HAPUS: jangan mewajibkan token
    // if (!currentToken) {
    //   throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    // }

    console.log("[Chat] User:", currentUser?.id);
    console.log("[Chat] Current messages count:", messages.length);

    if (!message.trim() || isLoading) {
      console.log("[Chat] ⚠️ Message empty or already loading, aborting");
      return;
    }

    if (currentUser?.id) {
      try {
        console.log("[Chat] Checking AI permission...");
        const permission = await SubscriptionAPI.checkAIPermission(currentUser.id);
        console.log("[Chat] Permission result:", permission);

        if (!permission.allowed) {
          console.warn("[Chat] ⚠️ AI permission denied:", permission.message);
          setUpgradeReason(
            permission.message || "AI query limit reached. Please upgrade your plan."
          );
          setShowUpgradeModal(true);
          toast.error("AI Limit Reached", {
            description: permission.message || "Upgrade to continue using AI chat",
          });
          return;
        }

        setAiQueriesRemaining(permission.remaining);
        console.log("[Chat] ✅ Permission granted, remaining:", permission.remaining);
      } catch (error: any) {
        console.warn(
          "[Chat] AI permission check failed (API not available), allowing chat:",
          error?.message
        );
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
      // Request body
      const recentContext = messages
        .slice(-6)
        .filter((entry) => entry.content)
        .map((entry) => ({ role: entry.role, content: entry.content }));

      const requestBody: ChatRequest = {
        message,
        conversationId: `user-${user?.id || "anonymous"}`,
        context: recentContext,
      };

      console.log("[Chat] Request body:", requestBody);
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
          "X-Requested-With": "fetch", 
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[Chat] ✅ Response received from Backend API");
      console.log("[Chat] Response status:", response.status);
      console.log("[Chat] Response statusText:", response.statusText);
      console.log("[Chat] Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData: any;
        const contentType = response.headers.get("content-type") || "";

        try {
          if (contentType.includes("application/json")) {
            errorData = await response.json();
          } else {
            errorData = { error: await response.text() };
          }
        } catch (e) {
          errorData = { error: "Failed to parse error response" };
        }

        console.error("[Chat] ❌ Error response:", errorData);

        if (response.status === 503 && errorData.fallback_response) {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.content = errorData.fallback_response;
              lastMessage.isStreaming = false;
              lastMessage.isError = true;
            }
            return newMessages;
          });

          toast.error("Layanan AI Tidak Tersedia", {
            description: "Silakan coba lagi dalam beberapa menit",
          });
          return;
        } else if (response.status === 401) {
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        } else if (response.status === 403) {
          throw new Error("Akses ditolak. Periksa izin Anda.");
        } else if (response.status === 500) {
          throw new Error("Server error. Silakan coba lagi.");
        } else if (response.status === 404) {
          throw new Error("Endpoint tidak ditemukan. Periksa konfigurasi API.");
        } else {
          throw new Error(
            errorData.details || errorData.error || `API error ${response.status}`
          );
        }
      }

      console.log("[Chat] 📡 Reading SSE stream...");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body for streaming");
      }

      let fullResponse = "";
      let buffer = "";

      let streamCompleted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[Chat] Stream ended");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log("[Chat] 📦 Raw chunk received:", chunk.substring(0, 100) + "...");

        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; 

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            continue;
          }

          console.log("[Chat] 📝 Processing line:", trimmedLine.substring(0, 100));

          if (!trimmedLine.startsWith("data:")) {
            continue;
          }

          const jsonStr = trimmedLine.slice(5).trim().replace(/^:\s*/, "");
          if (!jsonStr || jsonStr === "[DONE]") {
            continue;
          }

          const payload = jsonStr.startsWith("{") ? jsonStr : trimmedLine.slice(6).trim();
          console.log("[Chat] 🔍 JSON string:", payload);

          try {
            const data = JSON.parse(payload);
            console.log("[Chat] ✅ Parsed data:", data);

            if (data.done) {
              streamCompleted = true;
              break;
            }

            const token =
              data.token ??
              data.content ??
              data.text ??
              data.chunk ??
              data.delta ??
              data.message ??
              data.response;

            if (token) {
              fullResponse += token;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: fullResponse,
                  isStreaming: true,
                };
                return newMessages;
              });
            }
          } catch (e) {
            console.warn("[Chat] ⚠️ Failed to parse SSE payload:", e);
          }
        }

        if (streamCompleted) {
          console.log("[Chat] ✅ Received done flag from stream");
          break;
        }
      }

      // Mark streaming as complete
      const finalContent = fullResponse || "Maaf, tidak ada response dari AI.";
      console.log("[Chat] ✅ Streaming complete");
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: finalContent,
          isStreaming: false,
        };
        return newMessages;
      });

      if (!fullResponse) {
        console.error("[Chat] ⚠️ WARNING: No tokens received from stream!");
      }
    } catch (error: any) {
      console.error("[Chat] ❌ Chat error:", error);

      let errorMessage = "Maaf, terjadi kesalahan. Silakan coba lagi.";
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: errorMessage,
          isStreaming: false,
          isError: true,
        };
        return newMessages;
      });

      toast.error("Chat Error", { description: errorMessage });
    } finally {
      console.log("[Chat] 🏁 handleSendMessage complete, setting isLoading to false");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const formatMessage = (content: string) => {
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chat AI</h1>
            <p className="text-sm text-muted-foreground">
              Tanya apapun tentang keuangan bisnis Anda
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Test RAG Connection Button (Debug) */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const healthEndpoint = `${API_BASE_URL}/health`;
                console.log("[Chat] 🔍 Testing Backend API:", healthEndpoint);
                try {
                  const response = await fetch(healthEndpoint);
                  const data = await response.json();
                  toast.success("Backend API OK", {
                    description: `Status: ${data.status || "healthy"}\nDiajeng ready for chat`,
                  });
                } catch (error: any) {
                  toast.error("Backend API Failed", {
                    description: `Cannot connect to ${API_BASE_URL}`,
                  });
                }
              }}
              className="text-xs"
            >
              Test Backend
            </Button>

            {/* AI Queries Remaining Badge */}
            {aiQueriesRemaining !== null && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${
                  aiQueriesRemaining === 0
                    ? "border-red-500 text-red-600"
                    : aiQueriesRemaining < 5
                    ? "border-orange-500 text-orange-600"
                    : "border-blue-500 text-blue-600"
                }`}
              >
                <Zap className="h-3 w-3" />
                {aiQueriesRemaining === -1
                  ? "Unlimited"
                  : `${aiQueriesRemaining} queries left`}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={
          user && "subscription_tier" in (user as any)
            ? ((user as any).subscription_tier as string)
            : "free"
        }
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
              Tanyakan tentang pengeluaran, supplier, atau minta rekomendasi untuk
              menghemat biaya
            </p>

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
                      : message.isError
                      ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {message.role === "assistant" && message.isStreaming && !message.content ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-muted-foreground animate-pulse">
                        {thinkingText}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap">
                        {message.role === "assistant"
                          ? formatMessage(message.content)
                          : message.content}
                      </p>
                      {message.role === "assistant" && message.isStreaming && message.content && (
                        <div className="flex items-center gap-1 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                          <span className="text-xs text-muted-foreground">Mengetik...</span>
                        </div>
                      )}
                    </div>
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI mungkin membuat kesalahan. Periksa informasi penting.
        </p>
      </div>
    </div>
  );
}
