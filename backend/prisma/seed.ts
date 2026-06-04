import { PrismaClient, type BookingStatus, type CourseType, type VehicleType } from "@prisma/client";
import { calculateCommission } from "@driveconnect/shared";

const prisma = new PrismaClient();

const schoolNames = [
  "Metro Gear Driving Academy",
  "SafeTurn Motor School",
  "BlueLane Driving Institute",
  "RoadReady Learners Hub",
  "CityClutch Training School",
  "SwiftStart Driving School",
  "GreenSignal Driver Academy",
  "PrimeWheel Motor Training"
];

const locations = [
  { city: "Bengaluru", address: "Indiranagar 100 Feet Road", latitude: 12.9784, longitude: 77.6408 },
  { city: "Bengaluru", address: "HSR Layout Sector 2", latitude: 12.9116, longitude: 77.6412 },
  { city: "Bengaluru", address: "Koramangala 5th Block", latitude: 12.9352, longitude: 77.6245 },
  { city: "Bengaluru", address: "Whitefield Main Road", latitude: 12.9698, longitude: 77.7499 },
  { city: "Bengaluru", address: "Jayanagar 4th Block", latitude: 12.925, longitude: 77.5938 },
  { city: "Bengaluru", address: "Malleshwaram 8th Cross", latitude: 13.0031, longitude: 77.5643 },
  { city: "Bengaluru", address: "Electronic City Phase 1", latitude: 12.8399, longitude: 77.677 },
  { city: "Bengaluru", address: "Hebbal Kempapura", latitude: 13.0358, longitude: 77.597 }
];

async function reset() {
  await prisma.notification.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.review.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.featuredListing.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.schoolDocument.deleteMany();
  await prisma.course.deleteMany();
  await prisma.drivingSchool.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  await prisma.user.create({
    data: {
      id: "user-admin",
      mobile: "+919900000000",
      name: "DriveConnect Admin",
      email: "admin@driveconnect.local",
      role: "ADMIN"
    }
  });

  const customers = [];
  for (let i = 1; i <= 5; i += 1) {
    const user = await prisma.user.create({
      data: {
        id: `user-customer-${i}`,
        mobile: `+91988000000${i}`,
        name: `Learner ${i}`,
        email: `learner${i}@example.com`,
        role: "CUSTOMER",
        customerProfile: {
          create: {
            id: `customer-${i}`,
            name: `Learner ${i}`,
            address: `${10 + i} Residency Road, Bengaluru`,
            latitude: 12.97 + i * 0.008,
            longitude: 77.59 + i * 0.007
          }
        }
      },
      include: { customerProfile: true }
    });
    customers.push(user.customerProfile!);
  }

  const schools = [];
  for (let i = 0; i < schoolNames.length; i += 1) {
    const owner = await prisma.user.create({
      data: {
        id: `user-owner-${i + 1}`,
        mobile: `+91987000000${i}`,
        name: `${schoolNames[i]} Owner`,
        email: `owner${i + 1}@driveconnect.local`,
        role: "SCHOOL_OWNER"
      }
    });

    const location = locations[i];
    const school = await prisma.drivingSchool.create({
      data: {
        id: `school-${i + 1}`,
        ownerId: owner.id,
        name: schoolNames[i],
        slug: schoolNames[i].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description:
          "Verified driving school offering structured learner-friendly sessions, licence guidance, pickup options, and transparent progress tracking.",
        phone: `+91808000${1000 + i}`,
        email: `hello${i + 1}@driveconnect.local`,
        address: location.address,
        city: location.city,
        state: "Karnataka",
        pincode: `5600${10 + i}`,
        latitude: location.latitude,
        longitude: location.longitude,
        rating: Number((4.1 + (i % 5) * 0.18).toFixed(1)),
        totalReviews: 25 + i * 11,
        status: i === 7 ? "PENDING" : "APPROVED",
        verificationStatus: i === 7 ? "PENDING" : "APPROVED",
        ownerName: owner.name ?? `${schoolNames[i]} Owner`,
        ownerPhone: owner.mobile,
        ownerEmail: owner.email ?? "",
        googleMapsLink: `https://maps.google.com/?q=${location.latitude},${location.longitude}`,
        licenseNumber: `KA-DS-${2020 + i}-${1000 + i}`,
        licenseDocumentUrl: `https://cdn.example.com/driveconnect/documents/school-${i + 1}-licence.pdf`,
        ownerIdProofUrl: `https://cdn.example.com/driveconnect/documents/school-${i + 1}-owner-id.pdf`,
        panNumber: `ABCDE${1000 + i}F`,
        gstNumber: i % 2 === 0 ? `29ABCDE${1000 + i}F1Z${i % 10}` : undefined,
        bankAccountName: schoolNames[i],
        bankAccountNumber: `1234567890${i}`,
        ifsc: `HDFC000${1000 + i}`,
        upiId: `school${i + 1}@upi`,
        workingHours: "Monday to Saturday, 8 AM to 7 PM",
        pickupDropAvailable: i % 2 === 0,
        serviceRadiusKm: 8 + i,
        verificationSubmittedAt: new Date(),
        verificationReviewedAt: i === 7 ? undefined : new Date(),
        verificationReviewedBy: i === 7 ? undefined : "user-admin",
        commissionPercentage: i % 3 === 0 ? 20 : 18,
        pickupAvailable: i % 2 === 0,
        femaleInstructorAvailable: i % 3 !== 0,
        availabilityScore: 0.72 + (i % 4) * 0.06,
        complaintPenalty: i === 4 ? 3 : 0,
        documents: {
          create: [
            {
              id: `document-${i + 1}-registration`,
              type: "Business Registration",
              url: `https://cdn.example.com/driveconnect/documents/school-${i + 1}-registration.pdf`,
              status: i === 7 ? "PENDING" : "APPROVED"
            },
            {
              id: `document-${i + 1}-licences`,
              type: "Instructor Licence Set",
              url: `https://cdn.example.com/driveconnect/documents/school-${i + 1}-licences.pdf`,
              status: i === 7 ? "PENDING" : "APPROVED"
            }
          ]
        }
      }
    });

    schools.push(school);
  }

  const courseTemplates: Array<{
    title: string;
    type: CourseType;
    vehicleType: VehicleType;
    durationDays: number;
    totalSessions: number;
    price: number;
    advanceAmount: number;
    pickupIncluded: boolean;
  }> = [
    { title: "Four Wheeler Beginner Pack", type: "BEGINNER", vehicleType: "FOUR_WHEELER", durationDays: 21, totalSessions: 15, price: 8500, advanceAmount: 2500, pickupIncluded: true },
    { title: "Two Wheeler Confidence Pack", type: "BEGINNER", vehicleType: "TWO_WHEELER", durationDays: 10, totalSessions: 8, price: 3200, advanceAmount: 1000, pickupIncluded: false },
    { title: "Advanced City Driving", type: "ADVANCED", vehicleType: "FOUR_WHEELER", durationDays: 14, totalSessions: 10, price: 6200, advanceAmount: 2000, pickupIncluded: true },
    { title: "Licence Test Prep", type: "TEST_PREP", vehicleType: "LMV", durationDays: 7, totalSessions: 5, price: 2800, advanceAmount: 900, pickupIncluded: false },
    { title: "Weekend Refresher", type: "REFRESHER", vehicleType: "BOTH", durationDays: 6, totalSessions: 4, price: 2400, advanceAmount: 800, pickupIncluded: false }
  ];

  const courses = [];
  for (let i = 0; i < 20; i += 1) {
    const school = schools[i % schools.length];
    const template = courseTemplates[i % courseTemplates.length];
    const course = await prisma.course.create({
      data: {
        id: `course-${i + 1}`,
        schoolId: school.id,
        title: `${template.title} ${Math.floor(i / courseTemplates.length) + 1}`,
        type: template.type,
        vehicleType: template.vehicleType,
        durationDays: template.durationDays,
        totalSessions: template.totalSessions,
        price: template.price + (i % 4) * 350,
        advanceAmount: template.advanceAmount,
        description:
          "Structured course with slot booking, instructor assignment, progress tracking, and licence process guidance without any guaranteed licence promise.",
        pickupIncluded: template.pickupIncluded
      }
    });
    courses.push(course);
  }

  const instructors = [];
  const names = ["Ananya", "Ravi", "Meera", "Arjun", "Fatima", "Kiran", "Priya", "Nikhil", "Sana", "Vikram", "Isha", "Rahul"];
  for (let i = 0; i < 12; i += 1) {
    instructors.push(
      await prisma.instructor.create({
        data: {
          id: `instructor-${i + 1}`,
          schoolId: schools[i % schools.length].id,
          name: `${names[i]} ${i % 2 === 0 ? "Sharma" : "Rao"}`,
          phone: `+9177600000${String(i).padStart(2, "0")}`,
          gender: i % 4 === 0 ? "FEMALE" : i % 4 === 1 ? "MALE" : i % 4 === 2 ? "FEMALE" : "OTHER",
          experienceYears: 2 + (i % 8),
          languages: i % 2 === 0 ? ["English", "Kannada"] : ["English", "Hindi"],
          rating: Number((4.0 + (i % 5) * 0.2).toFixed(1))
        }
      })
    );
  }

  const vehicleModels = [
    ["Maruti", "Swift", "FOUR_WHEELER"],
    ["Hyundai", "i20", "FOUR_WHEELER"],
    ["Honda", "Activa", "TWO_WHEELER"],
    ["TVS", "Jupiter", "TWO_WHEELER"],
    ["Tata", "Punch", "LMV"]
  ] as const;

  for (let i = 0; i < 10; i += 1) {
    const [make, model, type] = vehicleModels[i % vehicleModels.length];
    await prisma.vehicle.create({
      data: {
        id: `vehicle-${i + 1}`,
        schoolId: schools[i % schools.length].id,
        type,
        make,
        model,
        registrationNumber: `KA${String(10 + i).padStart(2, "0")}DC${1000 + i}`
      }
    });
  }

  await prisma.coupon.createMany({
    data: [
      { id: "coupon-start500", code: "START500", description: "Rs 500 off on first booking", discountType: "FLAT", discountValue: 500 },
      { id: "coupon-weekend10", code: "WEEKEND10", description: "10 percent off weekend refresher courses", discountType: "PERCENTAGE", discountValue: 10 }
    ]
  });

  await prisma.featuredListing.createMany({
    data: [
      { id: "featured-school-1", schoolId: schools[0].id, startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 14 * 86400000), boostScore: 14 },
      { id: "featured-school-4", schoolId: schools[3].id, startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 10 * 86400000), boostScore: 10 }
    ]
  });

  const statuses: BookingStatus[] = [
    "BOOKING_CREATED",
    "PAYMENT_PENDING",
    "WAITING_FOR_SCHOOL_ACCEPTANCE",
    "SCHOOL_ACCEPTED",
    "INSTRUCTOR_ASSIGNED",
    "CLASS_SCHEDULED",
    "CLASS_STARTED",
    "COURSE_IN_PROGRESS",
    "COURSE_COMPLETED",
    "CANCELLED"
  ];

  const bookings = [];
  for (let i = 0; i < 10; i += 1) {
    const course = courses[i];
    const booking = await prisma.booking.create({
      data: {
        id: `booking-${101 + i}`,
        customerId: customers[i % customers.length].id,
        schoolId: course.schoolId,
        courseId: course.id,
        instructorId: statuses[i] === "INSTRUCTOR_ASSIGNED" || statuses[i] === "CLASS_SCHEDULED" || statuses[i] === "CLASS_STARTED" || statuses[i] === "COURSE_IN_PROGRESS" || statuses[i] === "COURSE_COMPLETED" ? instructors[i % instructors.length].id : undefined,
        status: statuses[i],
        totalAmount: course.price,
        advanceAmount: course.advanceAmount,
        preferredStartDate: new Date(Date.now() + (i + 1) * 86400000),
        preferredTimeSlot: i % 2 === 0 ? "08:00-09:00" : "18:00-19:00",
        pickupAddress: `${20 + i} MG Road, Bengaluru`,
        notes: i % 2 === 0 ? "Prefers calm traffic routes for first lessons." : undefined
      }
    });
    bookings.push(booking);

    if (["WAITING_FOR_SCHOOL_ACCEPTANCE", "SCHOOL_ACCEPTED", "INSTRUCTOR_ASSIGNED", "CLASS_SCHEDULED", "CLASS_STARTED", "COURSE_IN_PROGRESS", "COURSE_COMPLETED"].includes(statuses[i])) {
      const school = schools.find((item) => item.id === course.schoolId)!;
      const amount = Number(course.advanceAmount);
      const commission = calculateCommission(amount, Number(school.commissionPercentage));
      const payment = await prisma.payment.create({
        data: {
          id: `payment-${i + 1}`,
          bookingId: booking.id,
          amount,
          method: "UPI",
          status: "SUCCESS",
          providerPaymentId: `mock_pay_seed_${i}`,
          platformCommission: commission.platformCommission,
          schoolPayout: commission.schoolPayout,
          paidAt: new Date(Date.now() - i * 3600000)
        }
      });
      await prisma.settlement.create({
        data: {
          id: `settlement-${i + 1}`,
          schoolId: school.id,
          paymentId: payment.id,
          amount: commission.schoolPayout,
          platformCommission: commission.platformCommission,
          status: i % 3 === 0 ? "PAID" : "PENDING",
          settledAt: i % 3 === 0 ? new Date() : undefined
        }
      });
    }

    if (["CLASS_SCHEDULED", "CLASS_STARTED", "COURSE_IN_PROGRESS", "COURSE_COMPLETED"].includes(statuses[i])) {
      await prisma.classSession.create({
        data: {
          id: `session-${i + 1}`,
          bookingId: booking.id,
          instructorId: instructors[i % instructors.length].id,
          scheduledAt: new Date(Date.now() + i * 86400000),
          status: statuses[i] === "COURSE_COMPLETED" ? "COMPLETED" : statuses[i] === "CLASS_STARTED" ? "STARTED" : "SCHEDULED",
          notes: "Seeded class session",
          progressNotes: statuses[i] === "COURSE_COMPLETED" ? "Learner completed course milestones." : undefined,
          completedAt: statuses[i] === "COURSE_COMPLETED" ? new Date() : undefined
        }
      });
    }
  }

  await prisma.review.createMany({
    data: [
      { id: "review-1", bookingId: bookings[6].id, customerId: customers[1].id, schoolId: bookings[6].schoolId, rating: 5, instructorRating: 5, comment: "Clear scheduling and patient instructor." },
      { id: "review-2", bookingId: bookings[7].id, customerId: customers[2].id, schoolId: bookings[7].schoolId, rating: 4, instructorRating: 4, comment: "Good progress tracking and pickup support." },
      { id: "review-3", bookingId: bookings[8].id, customerId: customers[3].id, schoolId: bookings[8].schoolId, rating: 5, instructorRating: 5, comment: "The dashboard made each class easy to follow." }
    ]
  });

  await prisma.complaint.createMany({
    data: [
      {
        id: "CMP-301",
        bookingId: bookings[1].id,
        customerId: customers[1].id,
        schoolId: bookings[1].schoolId,
        subject: "Slot confirmation delay",
        description: "Customer is waiting for a confirmed weekend slot.",
        status: "OPEN"
      },
      {
        id: "CMP-302",
        bookingId: bookings[5].id,
        customerId: customers[0].id,
        schoolId: bookings[5].schoolId,
        subject: "Vehicle changed without notice",
        description: "Requested callback about a vehicle substitution.",
        status: "IN_PROGRESS"
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      { id: "notification-seed-complete", title: "Seed complete", body: "DriveConnect sample marketplace data is ready.", channel: "SYSTEM" },
      { id: "notification-compliance-note", title: "Compliance note", body: "Do not promise guaranteed driving licence outcomes.", channel: "SYSTEM" }
    ]
  });
}

main()
  .then(async () => {
    console.log("Seeded DriveConnect database");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
