"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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
import { useAuth } from "@/hooks/useAuth";
import { ApiStatusIndicator } from "@/components/ApiStatusIndicator";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Call auth store login
      await login(data.email, data.password);

      // Success
      toast.success("Login berhasil!", {
        description: "Mengalihkan ke dashboard...",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast.error("Login gagal", {
        description: error?.message || "Email atau password salah",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('[Login] 🔐 Starting Google Sign-In...');
      
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (result?.error) {
        console.error('[Login] ❌ Google Sign-In error:', result.error);
        toast.error("Login gagal", {
          description: "Gagal login dengan Google. Silakan coba lagi.",
        });
        setIsGoogleLoading(false);
        return;
      }

      if (result?.ok) {
        console.log('[Login] ✅ Google Sign-In successful');
        toast.success("Login berhasil!", {
          description: "Mengalihkan ke dashboard...",
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('[Login] ❌ Google Sign-In exception:', error);
      toast.error("Login gagal", {
        description: "Terjadi kesalahan. Silakan coba lagi.",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 sm:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">NotaKu</div>
              <ApiStatusIndicator />
            </div>
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
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Lupa password?
                </Link>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</span>
                ) : (
                  "Masuk"
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-500">atau</span><span className="h-px flex-1 bg-slate-200" /></div>

              {/* Google Sign-In */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> 
                    Memproses...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Masuk dengan Google
                  </span>
                )}
              </Button>

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

