import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Trash2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { useAI } from "@/hooks/useApi";
import { ChatMessage } from "@/types/api";
import { toast } from "sonner";
import Spinner from "./components/Spinner";

/**
 * AI chat interface with streaming support
 * Features: message bubbles, streaming responses, example prompts
 */
export default function AIChatExample() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chatStream, streaming, response, reset } = useAI({
    onChunk: () => {
      // Auto-scroll on new chunk
      scrollToBottom();
    },
    onComplete: () => {
      // Add AI response to messages
      if (response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response,
            timestamp: new Date().toISOString(),
          },
        ]);
        reset();
      }
    },
    onError: (err) => {
      toast.error("Chat failed: " + err.message);
    },
  });

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Handle send message
   */
  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      await chatStream({
        message: userMessage.content,
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  /**
   * Handle key press (Enter to send)
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Clear chat
   */
  const handleClear = () => {
    setMessages([]);
    reset();
    toast.success("Chat cleared");
  };

  /**
   * Use example prompt
   */
  const useExamplePrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, response]);

  const examplePrompts = [
    "Jelaskan tentang OCR",
    "Apa itu nota digital?",
    "Bagaimana cara upload receipt?",
    "Apa keuntungan menggunakan Notaku?",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Assistant</h1>
                <p className="text-sm text-purple-100">
                  Powered by DeepSeek R1 14B
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={messages.length === 0 && !response}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear chat"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && !response && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to AI Chat!
              </h2>
              <p className="text-slate-600 mb-8">
                Ask me anything about Notaku, receipts, or financial management
              </p>

              {/* Example Prompts */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Try these examples:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {examplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => useExamplePrompt(prompt)}
                      className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">
                          {prompt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, idx) => (
            <MessageBubble key={idx} message={message} />
          ))}

          {/* Streaming Response */}
          {streaming && response && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl rounded-tl-none p-4 border border-purple-200">
                <p className="text-slate-900 whitespace-pre-wrap">{response}</p>
                <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse ml-1" />
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {streaming && !response && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl rounded-tl-none p-4 border border-purple-200">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                streaming ? "AI is typing..." : "Type your message..."
              }
              disabled={streaming}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              aria-label="Message input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold"
              aria-label="Send message"
            >
              {streaming ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-blue-600"
            : "bg-gradient-to-r from-purple-600 to-blue-600"
        }`}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 max-w-[80%] ${
          isUser ? "flex flex-col items-end" : ""
        }`}
      >
        <div
          className={`rounded-2xl p-4 ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-none"
              : "bg-gradient-to-r from-purple-50 to-blue-50 text-slate-900 rounded-tl-none border border-purple-200"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <p className="text-xs text-slate-500 mt-1 px-2">
            {new Date(message.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
