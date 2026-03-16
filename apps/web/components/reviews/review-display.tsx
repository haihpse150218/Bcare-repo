"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface ReviewDisplayProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  };
  onUpdate?: (review: any) => void;
}

export function ReviewDisplay({ review, onUpdate }: ReviewDisplayProps) {
  const { token } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review.comment || "");
  const [loading, setLoading] = useState(false);

  const daysSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const canEdit = daysSinceCreation <= 7;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api(`/api/reviews/${review.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      toast.success("Cập nhật đánh giá thành công!");
      setEditing(false);
      onUpdate?.(updated);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sửa đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHover(i + 1)}
                  onMouseLeave={() => setHover(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      i < (hover || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} />
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Đánh giá của bạn</CardTitle>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-1" /> Sửa
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-5 h-5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
          ))}
        </div>
        {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
        <p className="text-xs text-gray-400 mt-2">
          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
          {canEdit && ` · Có thể sửa trong ${Math.ceil(7 - daysSinceCreation)} ngày`}
        </p>
      </CardContent>
    </Card>
  );
}
