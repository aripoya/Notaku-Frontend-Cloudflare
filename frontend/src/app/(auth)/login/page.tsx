"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Quote } from "lucide-react";
import { mockApi } from "@/lib/mockApi";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const result = await mockApi.login(data.email, data.password);
      localStorage.setItem("auth_token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      toast.success("Login berhasil!", { description: "Mengalihkan ke dashboard..." });
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (error: any) {
      toast.error("Login gagal", { description: error?.message || "Email atau password salah" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 sm:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-sm font-semibold">NotaKu</div>
            <CardTitle className="text-2xl">Masuk ke Akun Anda</CardTitle>
            <p className="text-sm text-slate-500">Kelola keuangan bisnis dengan lebih mudah</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nama@bisnis.com" {...register("email")} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" {...register("password")} aria-invalid={!!errors.password} />
                  <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register("remember")} />
                  <span>Ingat saya</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Lupa password?
                </Link>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</span>
                ) : (
                  "Masuk"
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-500">atau</span><span className="h-px flex-1 bg-slate-200" /></div>

              {/* Register */}
              <p className="text-center text-sm text-slate-600">
                Belum punya akun? <Link href="/register" className="text-blue-600 hover:underline">Daftar sekarang</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Quote */}
      <div className="hidden md:flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600" />
        <div className="relative max-w-lg text-white">
          <Quote className="w-10 h-10 opacity-80" />
          <p className="mt-4 text-3xl font-bold leading-snug">NotaKu menghemat 10+ jam per minggu untuk pembukuan UMKM</p>
          <p className="mt-3 text-white/80">— 2,500+ UMKM Indonesia</p>
        </div>
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
    </div>
  );
}

