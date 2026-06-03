\# DriveConnect: Driving School Marketplace Platform



\## Final Project Report



\---



\## 1. Project Title



\*\*DriveConnect – A Commercial Web Platform Connecting Customers, Driving Schools, and Admin Management\*\*



\---



\## 2. Project Overview



DriveConnect is a full-stack commercial web platform designed to connect customers with verified driving schools. The platform allows customers to search driving schools, view courses, book driving classes, make payments, attend scheduled sessions, submit reviews, and raise complaints.



Driving school partners can register their school, add courses, manage instructors and vehicles, accept or reject bookings, schedule class sessions, track payouts, and upload verification documents.



The admin platform manages school approvals, document verification, complaints, payouts, notifications, and complete business dashboard analytics.



The system is designed like a marketplace model, where the platform acts as a mediator between customers and driving schools and earns commission from bookings.



\---



\## 3. Problem Statement



In many locations, customers find it difficult to compare driving schools, verify their trustworthiness, understand course pricing, book classes, and track training progress. Driving schools also lack a digital platform to manage bookings, instructors, vehicles, payments, and customer communication.



DriveConnect solves this by providing a centralized online system for:



\- Customers to discover and book verified driving schools.

\- Driving schools to manage their business digitally.

\- Admins to verify schools, handle payments, complaints, and platform operations.



\---



\## 4. Objectives



The main objectives of this project are:



1\. To create a commercial database-backed driving school marketplace.

2\. To provide customer registration, login, and profile management.

3\. To allow driving schools to register as partners.

4\. To allow admin verification of schools and documents.

5\. To provide course management for driving schools.

6\. To provide a public marketplace for customers.

7\. To enable booking, payment tracking, and class scheduling.

8\. To provide partner dashboards for managing bookings, instructors, vehicles, and payouts.

9\. To provide admin dashboards for platform monitoring.

10\. To support reviews, ratings, complaints, notifications, and document verification.

11\. To prepare the project for deployment using separate frontend and backend applications.



\---



\## 5. System Users



The platform supports the following user roles:



| Role | Description |

|---|---|

| CUSTOMER | Can browse schools, book courses, pay, attend sessions, review, and raise complaints |

| SCHOOL\_OWNER | Can register school, manage courses, bookings, instructors, vehicles, sessions, payouts, and documents |

| ADMIN | Can manage schools, complaints, documents, payouts, and dashboard operations |

| SUPER\_ADMIN | Full admin access |

| SUPPORT\_STAFF | Can help with complaints and support-related actions |

| ACCOUNTANT | Can manage payout-related operations |



\---



\## 6. Technology Stack



\### Backend



| Technology | Purpose |

|---|---|

| Node.js | Backend runtime |

| Express.js | Backend API framework |

| PostgreSQL | Relational database |

| Supabase | Cloud PostgreSQL database hosting |

| pg | PostgreSQL client for Node.js |

| bcrypt | Password hashing |

| jsonwebtoken | JWT authentication |

| dotenv | Environment variable management |

| cors | Cross-origin API access |



\### Frontend



| Technology | Purpose |

|---|---|

| Next.js | Frontend framework |

| React | UI development |

| Axios | API communication |

| CSS/UI components | Colorful user interface |

| Role-based routing | Customer, Partner, and Admin dashboards |



\### Database



| Service | Purpose |

|---|---|

| Supabase PostgreSQL | Commercial cloud database |

| Supabase SQL Editor | Database table creation and management |



\---



\## 7. Project Folder Structure



\### Backend



```txt

C:\\Users\\cirim\\Documents\\DriveConnect\\server

```



Important backend files:



```txt

server

├── .env

├── API\_ENDPOINTS.md

├── PROJECT\_REPORT.md

├── package.json

├── src

│   ├── app.js

│   ├── server.js

│   ├── db.js

│   ├── controllers

│   ├── routes

│   └── middleware

```



\### Customer + Partner Frontend



```txt

C:\\Users\\cirim\\OneDrive\\Documents\\school\\driveconnect\\apps\\customer-site

```



This site handles:



\- Customer login/register

\- Partner login/register

\- Customer dashboard

\- Partner dashboard

\- Marketplace

\- Bookings

\- Payments

\- Sessions

\- Reviews

\- Complaints

\- Notifications

\- Payouts

\- Documents



\### Admin Frontend



```txt

C:\\Users\\cirim\\OneDrive\\Documents\\school\\driveconnect\\apps\\admin-site

```



This site handles:



\- Admin login

\- Admin dashboard

\- School approval

\- Document verification

\- Complaint management

\- Payout management

\- Notifications

\- Platform reports



\---



\## 8. Database Design



The project uses a commercial PostgreSQL database hosted on Supabase.



Main database tables include:



```txt

users

customer\_profiles

driving\_schools

school\_documents

instructors

vehicles

courses

bookings

booking\_status\_history

class\_sessions

payment\_orders

payment\_transactions

school\_payouts

reviews

complaints

complaint\_messages

notifications

audit\_logs

platform\_settings

```



\### Database Purpose



| Table | Purpose |

|---|---|

| users | Login, authentication, and role management |

| customer\_profiles | Stores customer profile details |

| driving\_schools | Stores partner school data |

| school\_documents | Stores verification documents |

| instructors | Stores instructor details |

| vehicles | Stores vehicle details |

| courses | Stores driving course packages |

| bookings | Stores customer booking data |

| booking\_status\_history | Tracks booking status changes |

| class\_sessions | Stores driving class schedules |

| payment\_orders | Tracks payment orders |

| payment\_transactions | Tracks payment success/failure |

| school\_payouts | Tracks partner payouts |

| reviews | Stores customer reviews and ratings |

| complaints | Stores support complaints |

| complaint\_messages | Stores complaint conversation messages |

| notifications | Stores user notifications |

| audit\_logs | Tracks important admin/system actions |

| platform\_settings | Stores platform-level settings |



\---



\## 9. Authentication and Security



The system uses JWT authentication.



\### Authentication Features



\- User registration

\- Login

\- Password hashing using bcrypt

\- JWT token generation

\- Protected routes

\- Role-based access control

\- Admin-only routes

\- Partner-only routes

\- Customer-only routes



\### Security Notes



\- Passwords are stored as bcrypt hashes.

\- JWT token is used for protected API access.

\- Backend `.env` stores sensitive secrets.

\- Database URL is never exposed in frontend.

\- Admin and user roles are checked before allowing protected actions.



\---



\## 10. Backend API Modules Completed



\### 10.1 Authentication Module



Implemented APIs:



```txt

POST /api/auth/register

POST /api/auth/login

GET  /api/auth/me

GET  /api/auth/admin-test

```



Features:



\- Customer registration

\- School owner registration

\- Admin login

\- JWT authentication

\- Role-based route access



\---



\### 10.2 Customer Profile Module



Implemented APIs:



```txt

GET /api/customer/profile

PUT /api/customer/profile

```



Features:



\- Customer profile creation

\- Customer profile update

\- Customer address and license details



\---



\### 10.3 Partner School Registration Module



Implemented APIs:



```txt

GET /api/partner/school

PUT /api/partner/school

```



Features:



\- Partner can register driving school

\- Partner can update school profile

\- School is created with pending approval status



\---



\### 10.4 Admin School Approval Module



Implemented APIs:



```txt

GET   /api/admin/schools

GET   /api/admin/schools/:schoolId

PATCH /api/admin/schools/:schoolId/status

```



Features:



\- Admin can view schools

\- Admin can approve school

\- Admin can reject or suspend school

\- Admin notes are stored



\---



\### 10.5 Course Management Module



Implemented APIs:



```txt

GET   /api/partner/courses

POST  /api/partner/courses

PUT   /api/partner/courses/:courseId

PATCH /api/partner/courses/:courseId/status

```



Features:



\- Partner can add courses

\- Partner can update courses

\- Partner can activate or deactivate courses



\---



\### 10.6 Public Marketplace Module



Implemented APIs:



```txt

GET /api/marketplace/schools

GET /api/marketplace/schools/:schoolId

GET /api/marketplace/courses

GET /api/marketplace/courses/:courseId

```



Features:



\- Public school listing

\- Public course listing

\- City filtering

\- Vehicle type filtering

\- School details

\- Course details



\---



\### 10.7 Booking Module



Implemented APIs:



```txt

POST  /api/customer/bookings

GET   /api/customer/bookings

GET   /api/customer/bookings/:bookingId

PATCH /api/customer/bookings/:bookingId/cancel

```



Features:



\- Customer can book a course

\- Booking amount is calculated

\- Platform commission is calculated

\- School earning is calculated

\- Booking status starts as pending



\---



\### 10.8 Partner Booking Approval Module



Implemented APIs:



```txt

GET   /api/partner/bookings

GET   /api/partner/bookings/:bookingId

PATCH /api/partner/bookings/:bookingId/status

PATCH /api/partner/bookings/:bookingId/complete

```



Features:



\- Partner can view booking requests

\- Partner can accept booking

\- Partner can reject booking

\- Partner can complete training booking



\---



\### 10.9 Payment Tracking Module



Implemented APIs:



```txt

POST  /api/customer/payments/orders

PATCH /api/customer/payments/orders/:paymentOrderId/test-success

GET   /api/customer/payments

```



Features:



\- Test payment order creation

\- Payment success simulation

\- Booking changes from accepted to ongoing after payment

\- Payment history tracking

\- School payout created after payment



\---



\### 10.10 Instructor and Vehicle Management Module



Implemented APIs:



```txt

GET   /api/partner/assets/instructors

POST  /api/partner/assets/instructors

PUT   /api/partner/assets/instructors/:instructorId

PATCH /api/partner/assets/instructors/:instructorId/status



GET   /api/partner/assets/vehicles

POST  /api/partner/assets/vehicles

PUT   /api/partner/assets/vehicles/:vehicleId

PATCH /api/partner/assets/vehicles/:vehicleId/status

```



Features:



\- Partner can add instructors

\- Partner can manage instructor status

\- Partner can add vehicles

\- Partner can assign instructor to vehicle

\- Partner can manage vehicle status



\---



\### 10.11 Class Session Scheduling Module



Implemented APIs:



```txt

POST  /api/sessions/partner

GET   /api/sessions/partner

PATCH /api/sessions/partner/:sessionId/status

GET   /api/sessions/customer

```



Features:



\- Partner can schedule sessions

\- Instructor and vehicle assigned to session

\- Customer can view sessions

\- Partner can mark sessions completed, missed, or cancelled



\---



\### 10.12 Review and Rating Module



Implemented APIs:



```txt

POST /api/reviews

GET  /api/reviews/my

GET  /api/reviews/school/:schoolId

```



Features:



\- Customer can review completed booking

\- Public can view school reviews

\- Average school rating updates automatically

\- Total review count updates automatically



\---



\### 10.13 Complaints and Support Module



Implemented APIs:



```txt

POST  /api/complaints

GET   /api/complaints/my

GET   /api/complaints/admin/all

PATCH /api/complaints/admin/:complaintId

POST  /api/complaints/:complaintId/messages

GET   /api/complaints/:complaintId

```



Features:



\- Customer can raise complaints

\- Admin can view complaints

\- Admin can resolve complaints

\- Complaint messages are stored

\- Customer can view admin reply



\---



\### 10.14 Notifications Module



Implemented APIs:



```txt

GET   /api/notifications/my

PATCH /api/notifications/:notificationId/read

PATCH /api/notifications/read-all

POST  /api/notifications/admin/send

```



Features:



\- Users can view notifications

\- Users can mark notifications as read

\- Admin can send notification



\---



\### 10.15 Payout and Earnings Module



Implemented APIs:



```txt

GET   /api/payouts/partner/summary

GET   /api/payouts/partner

GET   /api/payouts/admin

PATCH /api/payouts/admin/:payoutId/paid

```



Features:



\- Partner can view earnings summary

\- Partner can view payout history

\- Admin can view payouts

\- Admin can mark payout as paid



\---



\### 10.16 Dashboard Module



Implemented APIs:



```txt

GET /api/dashboard/admin

GET /api/dashboard/partner

```



Features:



\- Admin dashboard summary

\- Partner dashboard summary

\- User counts

\- School counts

\- Booking counts

\- Revenue summary

\- Payout summary

\- Complaint summary

\- Review summary



\---



\### 10.17 Document Verification Module



Implemented APIs:



```txt

POST  /api/documents/partner/school

GET   /api/documents/partner/school

GET   /api/documents/admin/school

PATCH /api/documents/admin/school/:documentId/status

```



Features:



\- Partner can upload document URL

\- Admin can view documents

\- Admin can approve or reject documents

\- Partner can view document status



\---



\## 11. Frontend Applications



The system uses two frontend applications.



\### 11.1 Customer + Partner Site



Path:



```txt

C:\\Users\\cirim\\OneDrive\\Documents\\school\\driveconnect\\apps\\customer-site

```



Purpose:



\- Customer login/register

\- Partner login/register

\- Customer dashboard

\- Partner dashboard

\- Marketplace

\- Booking flow

\- Payment view

\- Sessions

\- Reviews

\- Complaints

\- Notifications

\- Payouts

\- Documents



Login role logic:



```txt

CUSTOMER     → Customer Dashboard

SCHOOL\_OWNER → Partner Dashboard

ADMIN        → Blocked and redirected to admin site

```



\---



\### 11.2 Admin Site



Path:



```txt

C:\\Users\\cirim\\OneDrive\\Documents\\school\\driveconnect\\apps\\admin-site

```



Purpose:



\- Admin login

\- Admin dashboard

\- School approval

\- Document verification

\- Complaint management

\- Payout management

\- Notifications

\- Platform reports



Login role logic:



```txt

ADMIN / SUPER\_ADMIN / SUPPORT\_STAFF / ACCOUNTANT → Admin Dashboard

CUSTOMER / SCHOOL\_OWNER → Blocked

```



\---



\## 12. Main Business Workflow



The complete business workflow is:



```txt

1\. Customer registers or logs in.

2\. Partner registers or logs in.

3\. Partner registers driving school.

4\. Admin approves driving school.

5\. Partner creates driving course.

6\. Customer views marketplace.

7\. Customer selects course.

8\. Customer books course.

9\. Partner accepts booking.

10\. Customer completes payment.

11\. Booking becomes ongoing.

12\. Partner adds instructors and vehicles.

13\. Partner schedules class sessions.

14\. Customer attends class sessions.

15\. Partner marks session completed.

16\. Partner completes booking.

17\. Customer submits review.

18\. Admin handles complaints.

19\. Admin verifies documents.

20\. Admin manages payouts.

21\. Partner receives earnings.

```



\---



\## 13. Revenue Model



DriveConnect follows a commission-based marketplace model.



Example transaction:



```txt

Customer payment: ₹5999

Platform commission: ₹599.90

Driving school earning: ₹5399.10

```



This proves the platform can act as a mediator and earn revenue from each successful booking.



\---



\## 14. Testing Summary



The following tests were completed successfully:



| Test Case | Status |

|---|---|

| Backend health check | Passed |

| Database connection | Passed |

| Customer registration/login | Passed |

| Partner registration/login | Passed |

| Admin login | Passed |

| Customer profile creation | Passed |

| Partner school registration | Passed |

| Admin school approval | Passed |

| Course creation | Passed |

| Marketplace listing | Passed |

| Customer booking | Passed |

| Partner booking acceptance | Passed |

| Payment success flow | Passed |

| Instructor creation | Passed |

| Vehicle creation | Passed |

| Session scheduling | Passed |

| Session completion | Passed |

| Booking completion | Passed |

| Review submission | Passed |

| Complaint creation and resolution | Passed |

| Notifications read status | Passed |

| Payout marked as paid | Passed |

| Admin dashboard | Passed |

| Partner dashboard | Passed |

| School document approval | Passed |

| Customer + Partner frontend build | Passed |

| Admin frontend build | Passed |

| Full frontend checklist | Passed |



\---



\## 15. Final Project Status



The project is currently working locally with:



```txt

Backend:

http://localhost:5000



Customer + Partner Site:

http://localhost:3000



Admin Site:

http://localhost:3001

```



All major modules are completed and tested.



\---



\## 16. Deployment Plan



The recommended deployment plan is:



| Component | Recommended Platform |

|---|---|

| Database | Supabase |

| Backend | Render / Railway / VPS |

| Customer + Partner Site | Vercel |

| Admin Site | Vercel |

| File Storage | Supabase Storage / AWS S3 |

| Payments | Razorpay |

| SMS / OTP | MSG91 / Twilio |

| Email | SendGrid / Resend |



\---



\## 17. Production Improvements Needed



Before real commercial launch, the following improvements should be added:



1\. Real Razorpay payment gateway integration.

2\. Real file upload using Supabase Storage.

3\. Email verification.

4\. Phone OTP verification.

5\. Password reset email flow.

6\. Rate limiting for login APIs.

7\. Strong validation for all forms.

8\. Production error logging.

9\. HTTPS deployment.

10\. Admin user management.

11\. Invoice PDF generation.

12\. Real payout bank integration.

13\. Terms and privacy policy pages.

14\. Security review before launch.

15\. Backup and monitoring setup.



\---



\## 18. Security Notes



Important security practices:



```txt

Never expose backend .env file.

Never expose Supabase database password.

Never store plain passwords.

Never share JWT tokens.

Use HTTPS in production.

Use environment variables for secrets.

Use strong JWT secret.

Use separate development and production databases.

Use secure payment provider.

Validate all user input.

```



\---



\## 19. Conclusion



DriveConnect has been successfully developed as a full-stack driving school marketplace platform. It includes a commercial database, backend APIs, customer and partner frontend, admin frontend, booking flow, payment tracking, session scheduling, reviews, complaints, notifications, payouts, dashboards, and document verification.



The project is now ready for final polishing and deployment preparation.



The next stage is to deploy the backend, customer/partner frontend, and admin frontend to production platforms and connect real payment and file upload services.

