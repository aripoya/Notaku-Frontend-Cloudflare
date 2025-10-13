"use client";
import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
export default function ReceiptChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = { role: "user" as const, content: input };
    setMessages((m) => [...m, msg]);
    setInput("");
    const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: msg.content }) });
    const reader = res.body?.getReader();
    if (!reader) return;
    let assistant = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      assistant += new TextDecoder().decode(value);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: assistant };
        return copy;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={boxRef} className="flex-1 overflow-auto border rounded-md p-4 space-y-3">
        {messages.length === 0 ? <p className="text-sm text-slate-500">Mulai percakapan. Contoh: "Berapa total belanja bulan ini?"</p> : null}
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-md text-sm ${m.role === "user" ? "bg-blue-50 dark:bg-blue-950/40" : "bg-slate-50 dark:bg-slate-800"}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border rounded-md px-3 py-2" placeholder="Tulis pertanyaan..." />
        <button onClick={send} className="px-4 py-2 rounded-md bg-blue-600 text-white">Kirim</button>
      </div>
    </div>
  );
}
