"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Badge, Button, Card, EmptyState, LoadingPanel, formatDate } from "../../../components/ui";
import { api, getApiError, readNumber, readText, unwrapList } from "../../../lib/api";

type Review = {
  id?: string;
  _id?: string;
  customer_name?: string;
  customerName?: string;
  school_name?: string;
  schoolName?: string;
  course_name?: string;
  courseName?: string;
  rating?: number | string;
  comment?: string;
  is_visible?: boolean;
  isVisible?: boolean;
  createdAt?: string;
  created_at?: string;
};

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/reviews");
      setReviews(unwrapList<Review>(response.data, ["reviews"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load reviews."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  return (
    <AdminShell title="Reviews" eyebrow="Customer feedback" actions={<Button onClick={() => void loadReviews()} variant="ghost">Refresh</Button>}>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading reviews..." /> : (
        <div className="grid gap-4">
          {reviews.map((review, index) => {
            const visible = Boolean(review.is_visible ?? review.isVisible ?? true);
            return (
              <Card key={getReviewId(review, index)}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="amber">{readNumber(review.rating)} / 5</Badge>
                      <Badge tone={visible ? "green" : "slate"}>{visible ? "Visible" : "Hidden"}</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-slate-950">{readText(review.school_name ?? review.schoolName, "Driving school")}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {readText(review.customer_name ?? review.customerName, "Customer")} - {readText(review.course_name ?? review.courseName, "Course")}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-xs font-semibold text-slate-400">{formatDate(review.createdAt ?? review.created_at)}</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{readText(review.comment, "No review comment provided.")}</p>
              </Card>
            );
          })}
          {!reviews.length ? <Card><EmptyState>No reviews found.</EmptyState></Card> : null}
        </div>
      )}
    </AdminShell>
  );
}

function getReviewId(review: Review, index: number) {
  return String(review.id ?? review._id ?? index);
}
