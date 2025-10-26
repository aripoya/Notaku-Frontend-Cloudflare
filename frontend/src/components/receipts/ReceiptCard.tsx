"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt as ReceiptIcon, Eye, MoreVertical, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate, getCategoryColor, getInitials } from "@/lib/receipt-utils";

export interface Receipt {
  id: string;
  merchant_name: string;
  total_amount: string | number;
  currency: string;
  category: string | null;
  transaction_date: string;
  created_at: string;
  image_path: string | null;
  notes: string | null;
  ocr_data?: any;
}

interface ReceiptCardProps {
  receipt: Receipt;
  index: number;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export default function ReceiptCard({
  receipt,
  index,
  onView,
  onEdit,
  onDelete,
  onDownload,
}: ReceiptCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const categoryColors = getCategoryColor(receipt.category || "other");
  
  // Calculate delay for stagger animation
  const animationDelay = `${Math.min(index * 100, 500)}ms`;

  const handleCardClick = () => {
    if (onView) {
      onView(receipt.id);
    } else {
      router.push(`/dashboard/receipts/detail?id=${receipt.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(receipt.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(receipt.id);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(receipt.id);
    }
  };

  return (
    <div
      className="group relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 cursor-pointer animate-in fade-in"
      style={{ animationDelay }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left border accent on hover */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
          isHovered ? `${categoryColors.border} w-1` : "w-0 bg-transparent"
        }`}
      />

      {/* Image section */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b overflow-hidden">
        {receipt.image_path && !imageError ? (
          <img
            src={receipt.image_path}
            alt={receipt.merchant_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className={`w-16 h-16 rounded-full ${categoryColors.bg} flex items-center justify-center`}
            >
              <span className={`text-2xl font-bold ${categoryColors.text}`}>
                {getInitials(receipt.merchant_name)}
              </span>
            </div>
          </div>
        )}

        {/* Quick action overlay on hover */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat Detail
          </Button>
        </div>
      </div>

      {/* Content section */}
      <div className="p-4 space-y-3">
        {/* Header: Merchant name & category badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {receipt.merchant_name}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(receipt.transaction_date)}
            </p>
          </div>
          {receipt.category && (
            <Badge
              className={`${categoryColors.bg} ${categoryColors.text} border-none text-xs uppercase tracking-wider shrink-0`}
            >
              {receipt.category}
            </Badge>
          )}
        </div>

        {/* Amount */}
        <div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(receipt.total_amount, receipt.currency)}
          </p>
        </div>

        {/* Notes (if available) */}
        {receipt.notes && (
          <p className="text-sm text-gray-600 line-clamp-2">{receipt.notes}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 transition-all hover:border-blue-500 hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="transition-all hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDownload && (
                <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              {(onEdit || onDownload) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
