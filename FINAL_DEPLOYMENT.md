\# DriveConnect Final Deployment Document



\## 1. Project Name



\*\*DriveConnect – Driving School Marketplace Platform\*\*



\---



\## 2. Project Summary



DriveConnect is a full-stack driving school marketplace platform that connects customers with verified driving schools.



The system has three major parts:



1\. \*\*Customer + Partner Website\*\*

&#x20;  - Customers can search schools, view courses, book training, track sessions, view payments, submit reviews, raise complaints, and receive notifications.

&#x20;  - Driving school partners can manage school profile, courses, bookings, instructors, vehicles, sessions, documents, and payouts.



2\. \*\*Admin Website\*\*

&#x20;  - Admin can manage schools, verify documents, monitor complaints, view dashboard reports, manage payouts, and send notifications.



3\. \*\*Backend API\*\*

&#x20;  - Handles authentication, database operations, bookings, payments, sessions, reviews, complaints, payouts, notifications, and admin operations.



\---



\## 3. Live Deployment URLs



\### Backend API



```txt

https://driveconnect-backend-zodo.onrender.com

```



Health check:



```txt

https://driveconnect-backend-zodo.onrender.com/health

```



Expected response:



```json

{

&#x20; "success": true,

&#x20; "message": "Server health is good"

}

```



\---



\### Customer + Partner Website



```txt

https://driveconnect-customer-707t8vhw1.vercel.app

```



Important routes:



```txt

/

&#x20;/login

&#x20;/register

&#x20;/customer/marketplace

&#x20;/customer/dashboard

&#x20;/partner/dashboard

```



\---



\### Admin Website



```txt

PASTE\_ADMIN\_VERCEL\_URL\_HERE

```



Important routes:



```txt

/admin/login

/admin/dashboard

/admin/schools

/admin/documents

/admin/complaints

/admin/payouts

/admin/notifications

```



\---



\## 4. Test Accounts



\### Customer Login



```txt

Email: customer1@driveconnect.com

Password: 123456

```



\### Partner Login



```txt

Email: partner1@driveconnect.com

Password: 123456

```



\### Admin Login



```txt

Email: admin@driveconnect.com

Password: Admin@12345

```



> Note: These are demo/test credentials. Before public launch, change all demo passwords.



\---



\## 5. Technology Stack



\### Backend



```txt

Node.js

Express.js

PostgreSQL

Supabase

JWT Authentication

bcrypt

pg

dotenv

cors

```



\### Frontend



```txt

Next.js

React

Axios

Tailwind CSS / Custom UI

Role-based routing

```



\### Deployment



```txt

Backend: Render

Frontend: Vercel

Database: Supabase PostgreSQL

Version Control: GitHub

```



\---



\## 6. Project Structure



```txt

DriveConnect-Final

├── README.md

├── FINAL\_DEPLOYMENT.md

├── tsconfig.base.json

├── server

│   ├── src

│   ├── package.json

│   ├── .env.example

│   └── API\_ENDPOINTS.md

└── apps

&#x20;   ├── customer-site

&#x20;   │   ├── app

&#x20;   │   ├── components

&#x20;   │   ├── package.json

&#x20;   │   └── .env.example

&#x20;   └── admin-site

&#x20;       ├── app

&#x20;       ├── components

&#x20;       ├── package.json

&#x20;       └── .env.example

```



\---



\## 7. Backend Environment Variables on Render



Render service name:



```txt

driveconnect-backend

```



Backend root directory:



```txt

server

```



Build command:



```txt

npm install

```



Start command:



```txt

npm start

```



Environment variables used on Render:



```env

PORT=5000

DATABASE\_URL=SUPABASE\_POSTGRES\_CONNECTION\_STRING

JWT\_SECRET=YOUR\_SECRET\_KEY

JWT\_EXPIRES\_IN=7d

NODE\_VERSION=24.16.0

```



Important security note:



```txt

Never upload DATABASE\_URL or JWT\_SECRET to GitHub.

Keep real values only inside Render environment variables.

```



\---



\## 8. Customer + Partner Site Deployment on Vercel



Project name:



```txt

driveconnect-customer

```



Root directory:



```txt

apps/customer-site

```



Framework preset:



```txt

Next.js

```



Install command:



```txt

npm install

```



Build command:



```txt

npm run build

```



Output directory:



```txt

Leave empty / Next.js default

```



Environment variables:



```env

NEXT\_PUBLIC\_API\_BASE\_URL=https://driveconnect-backend-zodo.onrender.com

VITE\_API\_BASE\_URL=https://driveconnect-backend-zodo.onrender.com

```



\---



\## 9. Admin Site Deployment on Vercel



Project name:



```txt

driveconnect-admin

```



Root directory:



```txt

apps/admin-site

```



Framework preset:



```txt

Next.js

```



Install command:



```txt

npm install

```



Build command:



```txt

npm run build

```



Output directory:



```txt

Leave empty / Next.js default

```



Environment variables:



```env

NEXT\_PUBLIC\_API\_BASE\_URL=https://driveconnect-backend-zodo.onrender.com

VITE\_API\_BASE\_URL=https://driveconnect-backend-zodo.onrender.com

```



\---



\## 10. Completed Modules



```txt

Database setup

Authentication

Role-based access

Customer profile

Partner school registration

Admin school approval

Course management

Marketplace

Booking flow

Payment tracking

Instructor management

Vehicle management

Class session scheduling

Reviews and ratings

Complaints and support

Notifications

Payout tracking

Admin dashboard

Partner dashboard

Document verification

Customer + Partner frontend

Admin frontend

Backend deployment

Frontend deployment

```



\---



\## 11. Main Business Workflow



```txt

1\. Customer registers or logs in.

2\. Partner registers or logs in.

3\. Partner creates driving school profile.

4\. Admin approves the driving school.

5\. Partner creates courses.

6\. Customer views marketplace.

7\. Customer books a course.

8\. Partner accepts or rejects booking.

9\. Customer completes payment.

10\. Booking becomes ongoing.

11\. Partner adds instructor and vehicle.

12\. Partner schedules training sessions.

13\. Customer attends sessions.

14\. Partner marks sessions completed.

15\. Partner completes booking.

16\. Customer submits review.

17\. Admin handles complaints and payouts.

```



\---



\## 12. Revenue Model



DriveConnect earns commission from every successful booking.



Example:



```txt

Customer payment: ₹5999

Platform commission: ₹599.90

Driving school earning: ₹5399.10

```



\---



\## 13. Final Testing Checklist



\### Backend



```txt

/health works

Admin login works

Customer login works

Partner login works

Database connection works

```



\### Customer + Partner Website



```txt

Home page opens

Login page opens

Register page opens

Customer login works

Partner login works

Marketplace loads

Customer dashboard opens

Partner dashboard opens

Bookings load

Payments load

Sessions load

Reviews load

Complaints load

Notifications load

```



\### Admin Website



```txt

Admin login opens

Admin dashboard opens

Schools page opens

Documents page opens

Complaints page opens

Payouts page opens

Notifications page opens

Admin APIs load data

```



\---



\## 14. Security Notes



```txt

Do not upload .env files.

Do not expose DATABASE\_URL.

Do not expose JWT\_SECRET.

Do not share live JWT tokens.

Change demo passwords before public use.

Use HTTPS only.

Use strong JWT secret.

Use separate production database.

Restrict CORS before real launch.

Enable real payment verification before accepting real payments.

```



Important post-deployment action:



```txt

Rotate JWT\_SECRET in Render once after testing.

```



Reason:



```txt

A live JWT token was generated during testing. Rotating JWT\_SECRET invalidates old tokens.

```



\---



\## 15. Recommended Production Improvements



Before launching publicly, add:



```txt

Razorpay real payment integration

Supabase Storage file uploads

Email verification

Phone OTP verification

Password reset

Admin user management

Input validation hardening

Rate limiting

Activity logs

Invoice PDF generation

Real payout bank tracking

Terms and privacy policy pages

Production monitoring

Automated database backups

```



\---



\## 16. Local Development Setup



\### Backend



```bash

cd server

npm install

node src/server.js

```



Backend local URL:



```txt

http://localhost:5000

```



\### Customer + Partner Site



```bash

cd apps/customer-site

npm install

npm run dev

```



\### Admin Site



```bash

cd apps/admin-site

npm install

npm run dev

```



\---



\## 17. GitHub Repository



```txt

https://github.com/cirimalahemanthkumar-collab/driveconnect

```



\---



\## 18. Final Project Status



```txt

DriveConnect is successfully deployed as a full-stack driving school marketplace platform.



Backend API: Live

Customer + Partner Site: Live

Admin Site: Live

Database: Supabase PostgreSQL

Authentication: Working

Role-based dashboards: Working

Marketplace and business flow: Working

```



\---



\## 19. Conclusion



DriveConnect is now ready for final review and demonstration. The project includes a deployed backend, deployed customer/partner frontend, deployed admin frontend, cloud database, authentication, role-based access, marketplace, booking system, payment tracking, session scheduling, reviews, complaints, notifications, payouts, dashboards, and document verification.



The next stage is production hardening, real payment integration, real file uploads, and public launch preparation.

