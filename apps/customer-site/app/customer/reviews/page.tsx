"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Card, Select, StatusBadge, Textarea } from "../../../components/ui";
import { apiRequest, getApiErrorMessage } from "../../../lib/api";
import { useApiResource } from "../../../hooks/use-api-resource";
import { API_ENDPOINTS } from "../../../lib/endpoints";
import { asList, dateText, text, type ApiRecord } from "../../../lib/records";
import { ErrorBanner, Field, FormError, LoadingState, PageIntro, TableCard } from "../../../components/portal-ui";

export default function CustomerReviewsPage() {
  const reviewsResource = useApiResource<unknown>(API_ENDPOINTS.customer.reviews, []);
  const bookingsResource = useApiResource<unknown>(API_ENDPOINTS.customer.bookings, []);
  const reviews = asList(reviewsResource.data, ["reviews", "items"]);
  const bookings = asList(bookingsResource.data, ["bookings", "items"]);
  const completedBookings = useMemo(() => bookings.filter(isCompletedBooking), [bookings]);
  const [bookingId, setBookingId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  if (reviewsResource.loading || bookingsResource.loading) return <LoadingState label="Loading your reviews..." />;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccess("");
    try {
      await apiRequest({
        url: API_ENDPOINTS.customer.reviews,
        method: "POST",
        data: {
          booking_id: bookingId,
          rating: Number(rating),
          comment,
        },
      });
      setComment("");
      setSuccess("Review submitted successfully.");
      await reviewsResource.reload();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Unable to submit review."));
    } finally {
      setSubmitting(false);
    }
  }

  const error = reviewsResource.error || bookingsResource.error;

  return (
    <div>
      <PageIntro
        eyebrow="Shared feedback"
        title="My reviews"
        description="Keep a record of ratings you have shared and review completed courses."
        action={<Button variant="ghost" onClick={() => void reviewsResource.reload()}>Refresh</Button>}
      />
      {error ? <ErrorBanner message={error} retry={() => { void reviewsResource.reload(); void bookingsResource.reload(); }} /> : null}
      <section className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <p className="text-sm font-bold uppercase text-blue-600">Write review</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">Completed bookings</h3>
          <form className="mt-5 grid gap-4" onSubmit={submitReview}>
            <Field label="Booking">
              <Select required value={bookingId} onChange={(event) => setBookingId(event.target.value)} disabled={!completedBookings.length}>
                <option value="">Select completed booking</option>
                {completedBookings.map((booking, index) => {
                  const id = readBookingId(booking);
                  return <option key={`${id}-${index}`} value={id}>{bookingLabel(booking)}</option>;
                })}
              </Select>
            </Field>
            <Field label="Rating">
              <Select value={rating} onChange={(event) => setRating(event.target.value)}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </Field>
            <Field label="Comment">
              <Textarea required rows={5} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share what helped and what could improve." />
            </Field>
            <FormError message={formError} />
            {success ? <p className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</p> : null}
            {!completedBookings.length ? <p className="text-sm text-slate-500">Reviews open after a booking is marked completed.</p> : null}
            <Button type="submit" disabled={submitting || !completedBookings.length}>{submitting ? "Submitting..." : "Submit review"}</Button>
          </form>
        </Card>
        <div>
          <TableCard columns={["School", "Course", "Rating", "Comment", "Created"]} empty={!reviews.length}>
            {reviews.map((review, index) => (
              <tr key={`${readValue(review, "id", "_id", "review_id", "reviewId")}-${index}`} className="text-slate-700">
                <td className="px-4 py-4">{readValue(review, "school_name", "schoolName")}</td>
                <td className="px-4 py-4">{readValue(review, "course_name", "courseName")}</td>
                <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-950">{readValue(review, "rating")} / 5</td>
                <td className="px-4 py-4">{readValue(review, "comment", "review")}</td>
                <td className="whitespace-nowrap px-4 py-4">{dateText(readValue(review, "created_at", "createdAt"))}</td>
              </tr>
            ))}
          </TableCard>
        </div>
      </section>
    </div>
  );
}

function isCompletedBooking(booking: ApiRecord) {
  return readValue(booking, "booking_status", "bookingStatus", "status").toUpperCase() === "COMPLETED";
}

function readBookingId(booking: ApiRecord) {
  return readValue(booking, "booking_id", "bookingId", "id", "_id");
}

function bookingLabel(booking: ApiRecord) {
  return `${readValue(booking, "course_name", "courseName")} - ${readValue(booking, "school_name", "schoolName")}`;
}

function readValue(record: ApiRecord, ...keys: string[]) {
  const value = text(record, ...keys);
  return value === "-" ? "" : value;
}
