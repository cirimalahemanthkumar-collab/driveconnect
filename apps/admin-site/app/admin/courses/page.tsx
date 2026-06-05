"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "../../../components/admin-shell";
import { useAuth } from "../../../components/auth-context";
import { Alert, Badge, Button, Card, EmptyState, LoadingPanel, formatCurrency, formatDate } from "../../../components/ui";
import { api, getApiError, readNumber, readText, unwrapList } from "../../../lib/api";

type Course = {
  id?: string;
  _id?: string;
  course_name?: string;
  courseName?: string;
  school_name?: string;
  schoolName?: string;
  city?: string;
  state?: string;
  vehicle_type?: string;
  vehicleType?: string;
  transmission?: string;
  duration_days?: number | string;
  durationDays?: number | string;
  total_sessions?: number | string;
  totalSessions?: number | string;
  price?: number | string;
  discount_price?: number | string;
  discountPrice?: number | string;
  is_active?: boolean;
  isActive?: boolean;
  createdAt?: string;
  created_at?: string;
};

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/courses");
      setCourses(unwrapList<Course>(response.data, ["courses"]));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load courses."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  return (
    <AdminShell title="Courses" eyebrow="Catalog" actions={<Button onClick={() => void loadCourses()} variant="ghost">Refresh</Button>}>
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {loading ? <LoadingPanel label="Loading courses..." /> : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-green-700 to-emerald-500 text-white">
                <tr>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">School</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Sessions</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course, index) => {
                  const active = Boolean(course.is_active ?? course.isActive);
                  return (
                    <tr key={getCourseId(course, index)} className="hover:bg-green-50/50">
                      <td className="px-5 py-4 font-black text-slate-950">{readText(course.course_name ?? course.courseName, "Driving course")}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{readText(course.school_name ?? course.schoolName, "Driving school")}</p>
                        <p className="text-xs text-slate-500">{readText([course.city, course.state].filter(Boolean).join(", "))}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{readText(course.vehicle_type ?? course.vehicleType).replace(/_/g, " ")}</p>
                        <p className="text-xs text-slate-500">{readText(course.transmission).replace(/_/g, " ")}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                        {String(readNumber(course.total_sessions ?? course.totalSessions))} sessions
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-bold">
                        {formatCurrency(readNumber(course.discount_price ?? course.discountPrice ?? course.price))}
                      </td>
                      <td className="px-5 py-4"><Badge tone={active ? "green" : "slate"}>{active ? "Active" : "Inactive"}</Badge></td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(course.createdAt ?? course.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!courses.length ? <EmptyState>No courses found.</EmptyState> : null}
        </Card>
      )}
    </AdminShell>
  );
}

function getCourseId(course: Course, index: number) {
  return String(course.id ?? course._id ?? index);
}
