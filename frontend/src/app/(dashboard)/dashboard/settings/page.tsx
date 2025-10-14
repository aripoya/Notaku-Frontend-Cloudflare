"use client";

import { Save, Upload, Key, LogOut, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const handleSaveProfile = () => {
    toast.success("Profil berhasil diperbarui!", {
      description: "Perubahan Anda telah disimpan",
    });
  };

  const handleSaveBusiness = () => {
    toast.success("Informasi bisnis berhasil diperbarui!");
  };

  const handleSavePreferences = () => {
    toast.success("Preferensi berhasil disimpan!");
  };

  const handleChangePassword = () => {
    toast.success("Password berhasil diubah!", {
      description: "Silakan login kembali dengan password baru",
    });
  };

  const handleLogout = () => {
    logout();
    toast.success("Berhasil logout");
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      toast.error("Fitur hapus akun akan segera tersedia");
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Pengaturan
        </h1>
        <p className="text-muted-foreground">
          Kelola profil dan preferensi akun Anda
        </p>
      </div>

      {/* Section 1: Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profil Pengguna</CardTitle>
          <CardDescription>Informasi dasar akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl bg-blue-600 text-white">
                {user?.name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Ubah Foto
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                JPG atau PNG. Maks 2MB.
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              defaultValue={user?.name || "Demo User"}
              className="mt-1"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email || "demo@example.com"}
              className="mt-1"
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email tidak dapat diubah
            </p>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+62 812-3456-7890"
              className="mt-1"
            />
          </div>

          <Button onClick={handleSaveProfile}>
            <Save className="mr-2 h-4 w-4" />
            Simpan Perubahan
          </Button>
        </CardContent>
      </Card>

      {/* Section 2: Business Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informasi Bisnis</CardTitle>
          <CardDescription>Detail tentang bisnis Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business-name">Nama Bisnis</Label>
            <Input
              id="business-name"
              defaultValue={user?.businessName || "Demo Business"}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="business-type">Jenis Bisnis</Label>
            <Select defaultValue="warung">
              <SelectTrigger id="business-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warung">Warung/Toko</SelectItem>
                <SelectItem value="cafe">Cafe/Restoran</SelectItem>
                <SelectItem value="online">Online Shop</SelectItem>
                <SelectItem value="jasa">Jasa</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="npwp">NPWP (Opsional)</Label>
            <Input
              id="npwp"
              placeholder="00.000.000.0-000.000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              placeholder="Alamat lengkap bisnis"
              className="mt-1"
              rows={3}
            />
          </div>

          <Button onClick={handleSaveBusiness}>
            <Save className="mr-2 h-4 w-4" />
            Simpan Perubahan
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Preferences Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Preferensi</CardTitle>
          <CardDescription>
            Pengaturan aplikasi dan notifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="language">Bahasa</Label>
            <Select defaultValue="id">
              <SelectTrigger id="language" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timezone">Zona Waktu</Label>
            <Select defaultValue="jakarta">
              <SelectTrigger id="timezone" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jakarta">WIB - Jakarta</SelectItem>
                <SelectItem value="makassar">WITA - Makassar</SelectItem>
                <SelectItem value="jayapura">WIT - Jayapura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="currency">Mata Uang</Label>
            <Select defaultValue="idr">
              <SelectTrigger id="currency" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idr">IDR (Rp)</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifikasi Email</p>
                <p className="text-sm text-muted-foreground">
                  Terima update via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Laporan Mingguan</p>
                <p className="text-sm text-muted-foreground">
                  Ringkasan pengeluaran setiap minggu
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tips Hemat</p>
                <p className="text-sm text-muted-foreground">
                  Rekomendasi untuk menghemat biaya
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Button onClick={handleSavePreferences}>
            <Save className="mr-2 h-4 w-4" />
            Simpan Preferensi
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Security Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Keamanan</CardTitle>
          <CardDescription>
            Kelola password dan keamanan akun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-password">Password Saat Ini</Label>
            <Input id="current-password" type="password" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="new-password">Password Baru</Label>
            <Input id="new-password" type="password" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input id="confirm-password" type="password" className="mt-1" />
          </div>

          <Button onClick={handleChangePassword}>
            <Key className="mr-2 h-4 w-4" />
            Ubah Password
          </Button>
        </CardContent>
      </Card>

      {/* Section 5: Subscription/Plan Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Paket Langganan</CardTitle>
          <CardDescription>
            Kelola paket dan pembayaran Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div>
              <p className="font-semibold text-lg">
                Paket {user?.tier === "pro" ? "Pro" : "Starter"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.tier === "pro" ? "Rp 399.000/bulan" : "Rp 199.000/bulan"}
              </p>
            </div>
            <Badge className="bg-green-600">Aktif</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Nota digunakan bulan ini
              </span>
              <span className="font-medium">127 / 5,000</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "2.5%" }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Upgrade Paket
            </Button>
            <Button variant="outline">Lihat Riwayat Pembayaran</Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Zona Berbahaya
          </CardTitle>
          <CardDescription>
            Tindakan yang tidak dapat dibatalkan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Keluar dari Akun</p>
              <p className="text-sm text-muted-foreground">
                Keluar dari semua perangkat
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-red-600">Hapus Akun</p>
              <p className="text-sm text-muted-foreground">
                Hapus akun dan semua data secara permanen
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Akun
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
