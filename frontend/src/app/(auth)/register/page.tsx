"use client";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: integrate with Workers /api/auth/register
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded-lg p-6 bg-white dark:bg-slate-900">
        <h1 className="text-xl font-bold">Daftar</h1>
        <div className="mt-4 space-y-3">
          <input type="text" placeholder="Nama" value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2" required/>
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border rounded-md px-3 py-2" required/>
          <input type="password" placeholder="Kata sandi" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border rounded-md px-3 py-2" required/>
          <button disabled={loading} className="w-full px-4 py-2 rounded-md bg-blue-600 text-white">{loading?"Memproses...":"Daftar"}</button>
        </div>
        <p className="text-sm mt-3">Sudah punya akun? <Link href="/login" className="text-blue-600">Masuk</Link></p>
      </form>
    </div>
  );
}
