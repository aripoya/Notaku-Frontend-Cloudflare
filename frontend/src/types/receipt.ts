export type Receipt = {
  id: string;
  userId: string;
  imageUrl: string;
  total: number;
  supplier?: string;
  date: string;
  status?: "pending" | "processing" | "completed" | "failed";
  items?: { name: string; qty: number; price: number }[];
};
