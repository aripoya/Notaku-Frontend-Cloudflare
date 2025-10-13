import { User } from "@/types/user";
import { Receipt } from "@/types/receipt";

// Small helper to simulate network delay
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Types
export type LoginResponse = {
  success: boolean;
  user: User & { businessName?: string };
  token: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  businessName?: string;
};

export type UploadReceiptResponse = {
  jobId: string;
  status: "queued" | "processing" | "completed";
};

export type ReceiptJobResult = {
  status: "processing" | "completed" | "failed";
  receipt?: Receipt;
  error?: string;
};

export type PaginatedReceipts = {
  data: Receipt[];
  page: number;
  limit: number;
  total: number;
};

export type AnalyticsSummary = {
  period: "7d" | "30d" | "90d";
  totalSpending: number;
  avgPerDay: number;
  receiptsCount: number;
  topCategory: string;
};

export type CategorySpending = Array<{
  category: string;
  amount: number;
}>;

export type SupplierStat = Array<{
  supplier: string;
  total: number;
  transactions: number;
}>;

export type ChatMessageResponse = {
  id: string;
  message: string;
  reply: string;
  createdAt: string;
};

// Mock data generators
const mockUser = (email: string): User & { businessName?: string } => ({
  id: "user-123",
  email,
  name: "Demo User",
  tier: "pro",
});

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const mockReceipt = (id: string, userId = "user-123"): Receipt => ({
  id,
  userId,
  imageUrl: `https://picsum.photos/seed/${id}/800/600`,
  total: rand(50000, 750000),
  supplier: ["Alfamart", "Indomaret", "Tokopedia", "Bukalapak", "Warung Maju Jaya"][rand(0, 4)],
  date: new Date(Date.now() - rand(0, 1000 * 60 * 60 * 24 * 30)).toISOString(),
  status: "completed",
  items: [
    { name: "Produk A", qty: 1, price: rand(5000, 50000) },
    { name: "Produk B", qty: 2, price: rand(5000, 50000) },
  ],
});

// In-memory mock store
const memory = {
  jobs: new Map<string, ReceiptJobResult>(),
  receipts: Array.from({ length: 22 }).map((_, i) => mockReceipt(`r-${i + 1}`)),
};

export const mockApi = {
  // Auth
  login: async (email: string, password: string): Promise<LoginResponse> => {
    await wait(1500);
    if (email === "demo@example.com" && password === "password123") {
      return {
        success: true,
        user: { ...mockUser(email), businessName: "Demo Business" },
        token: "mock-token-" + Date.now(),
      };
    }
    throw new Error("Email atau password salah");
  },

  register: async (data: RegisterInput): Promise<LoginResponse> => {
    await wait(1200);
    return {
      success: true,
      user: { ...mockUser(data.email), name: data.name ?? "Pengguna Baru", businessName: data.businessName },
      token: "mock-token-" + Date.now(),
    };
  },

  // Receipts
  uploadReceipt: async (file: File): Promise<UploadReceiptResponse> => {
    await wait(800);
    const jobId = `job-${Date.now()}`;
    // Seed job as processing, then complete after a short time
    memory.jobs.set(jobId, { status: "processing" });
    // Simulate background completion
    setTimeout(() => {
      const newReceipt = mockReceipt(`r-${memory.receipts.length + 1}`);
      memory.receipts.unshift(newReceipt);
      memory.jobs.set(jobId, { status: "completed", receipt: newReceipt });
    }, 1500);
    return { jobId, status: "processing" };
  },

  getReceipt: async (jobId: string): Promise<ReceiptJobResult> => {
    await wait(900);
    const res = memory.jobs.get(jobId);
    if (!res) return { status: "failed", error: "Job tidak ditemukan" };
    return res;
  },

  getReceipts: async (page = 1, limit = 10): Promise<PaginatedReceipts> => {
    await wait(700);
    const start = (page - 1) * limit;
    const data = memory.receipts.slice(start, start + limit);
    return { data, page, limit, total: memory.receipts.length };
  },

  // Analytics
  getAnalyticsSummary: async (period: "7d" | "30d" | "90d"): Promise<AnalyticsSummary> => {
    await wait(600);
    const base = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const totalSpending = base * rand(500000, 2000000);
    return {
      period,
      totalSpending,
      avgPerDay: Math.round(totalSpending / base),
      receiptsCount: base + rand(3, 25),
      topCategory: ["Bahan Baku", "Operasional", "Perlengkapan", "Transportasi"][rand(0, 3)],
    };
  },

  getSpendingByCategory: async (): Promise<CategorySpending> => {
    await wait(500);
    return [
      { category: "Bahan Baku", amount: 4_500_000 },
      { category: "Operasional", amount: 2_100_000 },
      { category: "Perlengkapan", amount: 1_250_000 },
      { category: "Transportasi", amount: 900_000 },
    ];
  },

  getTopSuppliers: async (limit = 5): Promise<SupplierStat> => {
    await wait(500);
    const suppliers = [
      { supplier: "Alfamart", total: 1_950_000, transactions: 8 },
      { supplier: "Indomaret", total: 1_700_000, transactions: 7 },
      { supplier: "Tokopedia", total: 2_300_000, transactions: 4 },
      { supplier: "Bukalapak", total: 1_200_000, transactions: 3 },
      { supplier: "Warung Maju Jaya", total: 650_000, transactions: 5 },
    ];
    return suppliers.slice(0, limit);
  },

  // Chat
  sendChatMessage: async (message: string): Promise<ChatMessageResponse> => {
    await wait(1200);
    const cannedReplies: Record<string, string> = {
      halo: "Halo! Ada yang bisa saya bantu terkait pengeluaran bisnis Anda?",
      total: "Total pengeluaran bulan ini sekitar Rp 12.350.000 berdasarkan data mock.",
      kategori: "Kategori terbesar: Bahan Baku dan Operasional.",
    };
    const key = Object.keys(cannedReplies).find((k) => message.toLowerCase().includes(k));
    const reply = key ? cannedReplies[key] : "Saya menerima pesan Anda. Ini adalah balasan mock untuk pengujian UI.";
    return { id: `chat-${Date.now()}`, message, reply, createdAt: new Date().toISOString() };
  },
};

export default mockApi;
