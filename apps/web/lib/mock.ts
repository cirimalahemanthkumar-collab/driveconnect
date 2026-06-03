type BookingStatus = string;
type SchoolVerificationStatus = string;
export const schools = [
  {
    id: "school-1",
    name: "Metro Gear Driving Academy",
    status: "VERIFIED" as SchoolVerificationStatus,
    distance: 2.1,
    rating: 4.8,
    reviews: 142,
    priceFrom: 3200,
    city: "Indiranagar",
    pickup: true,
    femaleInstructor: true,
    featured: true,
    gradient: "from-blue-600 via-cyan-500 to-green-400",
    description: "Structured city driving lessons with progress tracking, flexible slots, and pickup support."
  },
  {
    id: "school-2",
    name: "SafeTurn Motor School",
    status: "VERIFIED" as SchoolVerificationStatus,
    distance: 3.4,
    rating: 4.6,
    reviews: 98,
    priceFrom: 2800,
    city: "HSR Layout",
    pickup: false,
    femaleInstructor: true,
    featured: false,
    gradient: "from-indigo-600 via-blue-500 to-amber-300",
    description: "Patient instructors for first-time learners and refresher courses."
  },
  {
    id: "school-3",
    name: "BlueLane Driving Institute",
    status: "VERIFIED" as SchoolVerificationStatus,
    distance: 4.2,
    rating: 4.5,
    reviews: 73,
    priceFrom: 3500,
    city: "Koramangala",
    pickup: true,
    femaleInstructor: false,
    featured: true,
    gradient: "from-sky-500 via-blue-600 to-orange-300",
    description: "Premium weekday and weekend batches with simulator orientation."
  },
  {
    id: "school-4",
    name: "RoadReady Learners Hub",
    status: "UNDER_REVIEW" as SchoolVerificationStatus,
    distance: 6.8,
    rating: 4.2,
    reviews: 41,
    priceFrom: 2400,
    city: "Whitefield",
    pickup: true,
    femaleInstructor: true,
    featured: false,
    gradient: "from-emerald-500 via-teal-500 to-yellow-300",
    description: "Budget-friendly packs with evening slots and licence process guidance."
  }
];

export const courses = [
  {
    id: "course-1",
    schoolId: "school-1",
    title: "Four Wheeler Beginner Pack",
    vehicle: "Four wheeler",
    type: "Beginner",
    sessions: 15,
    days: 21,
    price: 8500,
    advance: 2500,
    pickup: true
  },
  {
    id: "course-2",
    schoolId: "school-1",
    title: "Weekend Refresher",
    vehicle: "Both",
    type: "Refresher",
    sessions: 4,
    days: 6,
    price: 2400,
    advance: 800,
    pickup: false
  },
  {
    id: "course-3",
    schoolId: "school-2",
    title: "Two Wheeler Confidence Pack",
    vehicle: "Two wheeler",
    type: "Beginner",
    sessions: 8,
    days: 10,
    price: 3200,
    advance: 1000,
    pickup: false
  },
  {
    id: "course-4",
    schoolId: "school-3",
    title: "Advanced City Driving",
    vehicle: "Four wheeler",
    type: "Advanced",
    sessions: 10,
    days: 14,
    price: 6200,
    advance: 2000,
    pickup: true
  }
];

export const bookings = [
  {
    id: "booking-101",
    school: "Metro Gear Driving Academy",
    course: "Four Wheeler Beginner Pack",
    instructor: "Ananya Sharma",
    status: "COURSE_IN_PROGRESS" as BookingStatus,
    nextClass: "Today, 6:00 PM",
    amount: 8500
  },
  {
    id: "booking-102",
    school: "SafeTurn Motor School",
    course: "Two Wheeler Confidence Pack",
    instructor: "Ravi Rao",
    status: "WAITING_FOR_SCHOOL_ACCEPTANCE" as BookingStatus,
    nextClass: "Awaiting confirmation",
    amount: 3200
  },
  {
    id: "booking-103",
    school: "BlueLane Driving Institute",
    course: "Advanced City Driving",
    instructor: "Meera Sharma",
    status: "COURSE_COMPLETED" as BookingStatus,
    nextClass: "Completed",
    amount: 6200
  }
];

export const partnerStats = [
  { label: "Monthly bookings", value: "186", tone: "blue", delta: "+18%" },
  { label: "Acceptance rate", value: "91%", tone: "green", delta: "+6%" },
  { label: "Pending payout", value: "Rs 1.42L", tone: "amber", delta: "4 settlements" },
  { label: "Average rating", value: "4.7", tone: "indigo", delta: "142 reviews" }
] as const;

export const adminStats = [
  { label: "Gross booking value", value: "Rs 38.4L", tone: "blue", delta: "+22%" },
  { label: "Platform commission", value: "Rs 6.9L", tone: "green", delta: "18% avg" },
  { label: "Verified schools", value: "72", tone: "indigo", delta: "8 pending" },
  { label: "Open complaints", value: "11", tone: "amber", delta: "3 urgent" }
] as const;

export const timeline = [
  "BOOKING_CREATED",
  "PAYMENT_SUCCESS",
  "SCHOOL_ACCEPTED",
  "INSTRUCTOR_ASSIGNED",
  "CLASS_SCHEDULED",
  "COURSE_IN_PROGRESS"
] as BookingStatus[];

export const complaints = [
  { id: "CMP-301", subject: "Slot confirmation delay", status: "OPEN", owner: "Support team" },
  { id: "CMP-302", subject: "Vehicle changed without notice", status: "IN_PROGRESS", owner: "Partner ops" },
  { id: "CMP-303", subject: "Refund clarification", status: "RESOLVED", owner: "Finance" }
];
