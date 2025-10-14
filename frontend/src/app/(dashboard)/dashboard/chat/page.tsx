"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Sparkles, Bot, User, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

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
      // Mock API call with streaming effect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock responses based on question
      let response = "";
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("total") || lowerMessage.includes("belanja")) {
        response =
          "Berdasarkan 127 nota yang Anda miliki, total pengeluaran bulan ini adalah **Rp 12.450.000**, meningkat 18% dibanding bulan lalu (Rp 10.550.000).\n\nKategori terbesar:\n• Bahan Baku: Rp 5.2M (42%)\n• Operasional: Rp 3.1M (25%)\n• Marketing: Rp 2.4M (19%)";
      } else if (lowerMessage.includes("supplier")) {
        response =
          "Dari analisis 127 nota terakhir:\n\n**Top 5 Supplier:**\n1. Supplier A - Rp 3.2M (harga terbaik)\n2. Supplier B - Rp 2.8M\n3. Supplier C - Rp 2.1M\n4. Supplier D - Rp 1.5M\n5. Supplier E - Rp 1.2M\n\n💡 **Rekomendasi:** Supplier A memberikan harga 12% lebih murah untuk bahan plastik.";
      } else if (lowerMessage.includes("bandingkan")) {
        response =
          "**Perbandingan Periode:**\n\nBulan Ini: Rp 12.45M\nBulan Lalu: Rp 10.55M\nPerubahan: +Rp 1.9M (+18%)\n\n**Perbedaan utama:**\n• Bahan Baku naik Rp 1.2M\n• Marketing naik Rp 500K\n• Operasional turun Rp 200K\n\n⚠️ Perhatian: Kenaikan signifikan di Bahan Baku.";
      } else if (lowerMessage.includes("kategori")) {
        response =
          "**Breakdown Kategori Pengeluaran:**\n\n🔵 Bahan Baku: Rp 5.2M (42%)\n🟢 Operasional: Rp 3.1M (25%)\n🟣 Marketing: Rp 2.4M (19%)\n🟠 Transportasi: Rp 1.75M (14%)\n\nKategori terbesar adalah Bahan Baku dengan 45 transaksi.";
      } else if (lowerMessage.includes("hemat") || lowerMessage.includes("tips")) {
        response =
          "💡 **Tips Hemat Biaya:**\n\n1. **Konsolidasi Pembelian**\n   Beli bahan baku dalam jumlah lebih besar dari Supplier A untuk diskon volume (potensi hemat 8-12%)\n\n2. **Ganti Supplier untuk Produk Tertentu**\n   Beralih ke Supplier C untuk produk X bisa hemat 15%\n\n3. **Timing Pembelian**\n   Belanja di hari Selasa-Rabu 12% lebih murah dibanding Jumat-Sabtu\n\n4. **Negosiasi Volume**\n   Dengan total pembelian Rp 5.2M/bulan, Anda berhak minta diskon 5-10%\n\n✨ Estimasi total hemat: **Rp 850K/bulan**";
      } else if (lowerMessage.includes("tren")) {
        response =
          "📈 **Tren Pengeluaran 3 Bulan Terakhir:**\n\nOktober: Rp 9.8M\nNovember: Rp 10.5M (+7%)\nDesember: Rp 12.4M (+18%)\n\n**Analisis:**\n• Tren naik konsisten\n• Kenaikan terbesar di bulan Desember\n• Rata-rata pertumbuhan: 12% per bulan\n\n⚠️ **Perhatian:** Jika tren berlanjut, pengeluaran Januari bisa mencapai Rp 14M+. Pertimbangkan kontrol biaya.";
      } else {
        response =
          "Saya dapat membantu Anda menganalisis:\n\n• Total pengeluaran dan perbandingan periode\n• Analisis supplier dan rekomendasi\n• Breakdown per kategori\n• Tips hemat biaya\n• Tren dan prediksi pengeluaran\n\nSilakan tanya hal spesifik tentang keuangan bisnis Anda! 😊";
      }

      // Simulate streaming by updating word by word
      const words = response.split(" ");
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Chat AI
        </h1>
        <p className="text-sm text-muted-foreground">
          Tanya apapun tentang keuangan bisnis Anda
        </p>
      </div>

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
