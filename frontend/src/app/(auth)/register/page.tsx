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
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    preferredName: z.string().optional(), // ✅ ADD THIS - Optional nickname for chat
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
    businessName: z.string().min(2, "Nama bisnis minimal 2 karakter"),
    businessType: z.string().min(1, "Pilih jenis bisnis"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "Anda harus menyetujui syarat & ketentuan",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { agreeToTerms: false },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // ✅ Smart preferred name logic
      // Priority: 1) provided preferredName, 2) first word of name, 3) username
      const preferredName = data.preferredName?.trim() || 
                           data.name.split(' ')[0] || 
                           data.name.toLowerCase().replace(/\s+/g, '');
      
      console.log('[Register] Preferred name:', preferredName);
      
      // Call auth store register
      // API expects: email, username, password, full_name, preferred_name
      await registerUser({
        email: data.email,
        username: data.name.toLowerCase().replace(/\s+/g, ''), // Convert name to username
        password: data.password,
        full_name: data.name, // ✅ ADD THIS
        preferred_name: preferredName, // ✅ ADD THIS
      });

      // Success
      toast.success("Akun berhasil dibuat!", {
        description: "Selamat datang di NotaKu 🎉",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast.error("Pendaftaran gagal", {
        description: error?.message || "Terjadi kesalahan",
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 sm:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="text-sm font-semibold">NotaKu</div>
            <CardTitle className="text-2xl">Daftar Akun Baru</CardTitle>
            <p className="text-sm text-slate-500">Mulai kelola keuangan bisnis Anda</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" type="text" placeholder="Ari Wibowo" {...register("name")} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {/* Nama Panggilan - NEW! */}
              <div className="space-y-2">
                <Label htmlFor="preferredName">
                  Nama Panggilan <span className="text-xs text-muted-foreground">(opsional)</span>
                </Label>
                <Input 
                  id="preferredName" 
                  type="text" 
                  placeholder="Ari" 
                  {...register("preferredName")} 
                  aria-invalid={!!errors.preferredName} 
                />
                <p className="text-xs text-muted-foreground">
                  💬 Diajeng akan memanggil Anda dengan nama ini saat chat
                </p>
                {errors.preferredName && <p className="text-sm text-red-600">{errors.preferredName.message}</p>}
              </div>

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
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Minimal 8 karakter" {...register("password")} aria-invalid={!!errors.password} />
                  <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Ulangi password" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
                  <button type="button" aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700" onClick={() => setShowConfirmPassword((s) => !s)}>
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              {/* Nama Bisnis */}
              <div className="space-y-2">
                <Label htmlFor="businessName">Nama Bisnis</Label>
                <Input id="businessName" type="text" placeholder="Nama bisnis Anda" {...register("businessName")} aria-invalid={!!errors.businessName} />
                {errors.businessName && <p className="text-sm text-red-600">{errors.businessName.message}</p>}
              </div>

              {/* Jenis Bisnis */}
              <div className="space-y-2">
                <Label htmlFor="businessType">Jenis Bisnis</Label>
                <select id="businessType" {...register("businessType")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-invalid={!!errors.businessType}>
                  <option value="">Pilih jenis bisnis</option>
                  <option value="warung">Warung/Toko</option>
                  <option value="cafe">Cafe/Restoran</option>
                  <option value="online">Online Shop</option>
                  <option value="jasa">Jasa</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                {errors.businessType && <p className="text-sm text-red-600">{errors.businessType.message}</p>}
              </div>

              {/* Agree to Terms */}
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" {...register("agreeToTerms")} />
                  <span>
                    Saya setuju dengan{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Syarat & Ketentuan
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>}
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </span>
                ) : (
                  "Daftar"
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-500">atau</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Login */}
              <p className="text-center text-sm text-slate-600">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Masuk sekarang
                </Link>
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
          <p className="mt-4 text-3xl font-bold leading-snug">Bergabung dengan 2,500+ UMKM yang sudah mempercayai NotaKu</p>
          <p className="mt-3 text-white/80">— Mulai gratis, tanpa kartu kredit</p>
        </div>
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
    </div>
  );
}
