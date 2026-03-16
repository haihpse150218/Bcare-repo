"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

interface ReviewFormProps {
  appointmentId: string;
  onSubmit?: (review: any) => void;
}

export function ReviewForm({ appointmentId, onSubmit }: ReviewFormProps) {
  const { token } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
    setLoading(true);
    try {
      const review = await api("/api/reviews", {
        method: "POST",
        token: token!,
        body: JSON.stringify({ appointmentId, rating, comment: comment || undefined }),
      });
      toast.success("Đánh giá thành công!");
      onSubmit?.(review);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Đánh giá bác sĩ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    i < (hover || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Nhận xét (không bắt buộc, tối đa 500 ký tự)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <Button type="submit" disabled={loading || rating === 0}>
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
