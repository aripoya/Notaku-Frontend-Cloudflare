import ReceiptDetailClient from "./ReceiptDetailClient";

// For static export: pre-generate no paths and disable dynamic params
export const dynamicParams = false;
export async function generateStaticParams() {
  return [] as { id: string }[];
}

export default function ReceiptDetailPage() {
  return <ReceiptDetailClient />;
}
