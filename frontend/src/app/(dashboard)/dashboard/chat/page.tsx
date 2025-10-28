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
import { getRAGUrl, RAG_DEFAULTS, API_CONFIG } from "@/config/services";

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
    console.log('[Chat] 🚀 Starting handleSendMessage');
    console.log('[Chat] Message:', message);
    console.log('[Chat] User:', user?.id);
    console.log('[Chat] Current messages count:', messages.length);
    
    if (!message.trim() || isLoading) {
      console.log('[Chat] ⚠️ Message empty or already loading, aborting');
      return;
    }

    // Check AI permission BEFORE sending (skip if API not available)
    if (user?.id) {
      try {
        console.log('[Chat] Checking AI permission...');
        const permission = await SubscriptionAPI.checkAIPermission(user.id);
        console.log('[Chat] Permission result:', permission);
        
        if (!permission.allowed) {
          console.warn('[Chat] ⚠️ AI permission denied:', permission.message);
          setUpgradeReason(permission.message || "AI query limit reached. Please upgrade your plan.");
          setShowUpgradeModal(true);
          toast.error("AI Limit Reached", {
            description: permission.message || "Upgrade to continue using AI chat"
          });
          return;
        }
        
        // Update remaining queries
        setAiQueriesRemaining(permission.remaining);
        console.log('[Chat] ✅ Permission granted, remaining:', permission.remaining);
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
      // ✅ Use RAG Service for chat
      // This enables the chatbot to answer questions using indexed receipts
      const endpoint = getRAGUrl('QUERY_STREAM');
      
      console.log('[Chat] 🤖 RAG Configuration:');
      console.log('[Chat] RAG Service URL:', API_CONFIG.RAG.BASE_URL);
      console.log('[Chat] Endpoint:', endpoint);
      console.log('[Chat] Collection:', RAG_DEFAULTS.COLLECTION_NAME);
      
      const requestBody = {
        question: message,
        collection_name: RAG_DEFAULTS.COLLECTION_NAME,
        top_k: RAG_DEFAULTS.TOP_K,
        rerank_top_k: RAG_DEFAULTS.RERANK_TOP_K,
        include_context: RAG_DEFAULTS.INCLUDE_CONTEXT,
      };
      
      console.log('[Chat] Request body:', requestBody);
      console.log('[Chat] Query:', requestBody.question);
      
      console.log('[Chat] Sending RAG query request...');
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[Chat] ✅ Response received');
      console.log('[Chat] Response status:', response.status);
      console.log('[Chat] Response statusText:', response.statusText);
      console.log('[Chat] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Chat] ❌ Error response body:', errorText);
        
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
        } else if (response.status === 403) {
          throw new Error('Akses ditolak. Periksa izin Anda.');
        } else if (response.status === 500) {
          throw new Error('Server error. Silakan coba lagi.');
        } else if (response.status === 404) {
          throw new Error('Endpoint tidak ditemukan. Periksa konfigurasi API.');
        } else {
          throw new Error(`API error ${response.status}: ${errorText}`);
        }
      }

      // ✅ Handle Server-Sent Events (SSE) streaming
      console.log('[Chat] 📡 Reading SSE stream...');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body for streaming');
      }
      
      let fullResponse = "";
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Chat] Stream ended');
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log('[Chat] 📦 Raw chunk received:', chunk.substring(0, 100) + '...');
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep incomplete line in buffer
        
        for (const line of lines) {
          console.log('[Chat] 📝 Processing line:', line.substring(0, 100));
          
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            console.log('[Chat] 🔍 JSON string:', jsonStr);
            
            try {
              const data = JSON.parse(jsonStr);
              console.log('[Chat] ✅ Parsed data:', data);
              
              // Try different field names for token/content
              const token = data.token || data.content || data.text || data.chunk || data.delta;
              
              if (token) {
                console.log('[Chat] 📝 Token received:', token);
                fullResponse += token;
                
                // Update message in real-time
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
              
              // Handle complete response
              if (data.response) {
                console.log('[Chat] 🎯 Complete response received:', data.response);
                fullResponse = data.response;
                
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
              
              // Log context if available
              if (data.context) {
                console.log('[Chat] 📚 Context used:', data.context.length, 'sources');
              }
            } catch (e) {
              console.warn('[Chat] ⚠️ Failed to parse JSON:', jsonStr, e);
              // If not JSON, treat as plain text
              const text = line.slice(6).trim();
              if (text && text !== '[DONE]') {
                console.log('[Chat] 📝 Plain text token:', text);
                fullResponse += text;
                
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
            }
          }
        }
      }
      
      // Mark streaming as complete
      const finalContent = fullResponse || "Maaf, tidak ada response dari AI.";
      console.log('[Chat] ✅ Streaming complete');
      console.log('[Chat] Full response length:', fullResponse.length, 'chars');
      console.log('[Chat] Final content:', finalContent.substring(0, 200) + '...');
      
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
        console.error('[Chat] ⚠️ WARNING: No tokens received from stream!');
      }
    } catch (error: any) {
      console.error('[Chat] ❌ Chat error:', error);
      console.error('[Chat] Error type:', error.constructor.name);
      console.error('[Chat] Error message:', error.message);
      console.error('[Chat] Error stack:', error.stack);
      
      // Determine error message
      let errorMessage = "Maaf, terjadi kesalahan. Silakan coba lagi.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
        console.error('[Chat] Network error - cannot reach server');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('[Chat] Final error message shown to user:', errorMessage);
      
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: errorMessage,
        };
        return newMessages;
      });
      
      // Show toast notification
      toast.error('Chat Error', {
        description: errorMessage
      });
    } finally {
      console.log('[Chat] 🏁 handleSendMessage complete, setting isLoading to false');
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
          <div className="flex items-center gap-2">
            {/* Test RAG Connection Button (Debug) */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const healthEndpoint = getRAGUrl('HEALTH');
                console.log('[Chat] 🔍 Testing RAG Service:', healthEndpoint);
                try {
                  const response = await fetch(healthEndpoint);
                  const data = await response.json();
                  console.log('[Chat] ✅ RAG Service healthy:', data);
                  toast.success('RAG Service OK', {
                    description: `Status: ${data.status || 'healthy'}\nCollection: ${RAG_DEFAULTS.COLLECTION_NAME}`
                  });
                } catch (error: any) {
                  console.error('[Chat] ❌ RAG Service check failed:', error);
                  toast.error('RAG Service Failed', {
                    description: `Cannot connect to ${API_CONFIG.RAG.BASE_URL}`
                  });
                }
              }}
              className="text-xs"
            >
              Test RAG
            </Button>
            
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
