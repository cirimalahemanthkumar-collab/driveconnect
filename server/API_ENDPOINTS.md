\# DriveConnect API Endpoints



Backend Base URL:



```txt

http://localhost:5000

```



Production example later:



```txt

https://api.driveconnect.com

```



\---



\# 1. Health Check



\## Check backend health



```http

GET /health

```



Command:



```bash

curl http://localhost:5000/health

```



Response:



```json

{

&#x20; "success": true,

&#x20; "message": "Server health is good"

}

```



\---



\# 2. Authentication APIs



\## Register User



```http

POST /api/auth/register

```



Allowed public roles:



```txt

CUSTOMER

SCHOOL\_OWNER

```



Body:



```json

{

&#x20; "full\_name": "Demo Customer",

&#x20; "email": "customer1@driveconnect.com",

&#x20; "phone": "8888888881",

&#x20; "password": "123456",

&#x20; "role": "CUSTOMER"

}

```



Customer register command:



```bash

curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\\"full\_name\\":\\"Demo Customer\\",\\"email\\":\\"customer1@driveconnect.com\\",\\"phone\\":\\"8888888881\\",\\"password\\":\\"123456\\",\\"role\\":\\"CUSTOMER\\"}"

```



Partner register command:



```bash

curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\\"full\_name\\":\\"Demo School Owner\\",\\"email\\":\\"partner1@driveconnect.com\\",\\"phone\\":\\"7777777771\\",\\"password\\":\\"123456\\",\\"role\\":\\"SCHOOL\_OWNER\\"}"

```



\---



\## Login User



```http

POST /api/auth/login

```



Body:



```json

{

&#x20; "email": "customer1@driveconnect.com",

&#x20; "password": "123456"

}

```



Customer login command:



```bash

curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"customer1@driveconnect.com\\",\\"password\\":\\"123456\\"}"

```



Partner login command:



```bash

curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"partner1@driveconnect.com\\",\\"password\\":\\"123456\\"}"

```



Admin login command:



```bash

curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@driveconnect.com\\",\\"password\\":\\"Admin@12345\\"}"

```



Response includes JWT token:



```json

{

&#x20; "success": true,

&#x20; "message": "Login successful",

&#x20; "token": "JWT\_TOKEN",

&#x20; "user": {

&#x20;   "id": "USER\_ID",

&#x20;   "full\_name": "Demo Customer",

&#x20;   "email": "customer1@driveconnect.com",

&#x20;   "role": "CUSTOMER",

&#x20;   "status": "ACTIVE"

&#x20; }

}

```



\---



\## Set Token Variables in Windows Command Prompt



Customer:



```bash

set TOKEN=PASTE\_CUSTOMER\_TOKEN\_HERE

```



Partner:



```bash

set PARTNER\_TOKEN=PASTE\_PARTNER\_TOKEN\_HERE

```



Admin:



```bash

set ADMIN\_TOKEN=PASTE\_ADMIN\_TOKEN\_HERE

```



\---



\## Get Logged-in User



```http

GET /api/auth/me

```



Header:



```txt

Authorization: Bearer JWT\_TOKEN

```



Command:



```bash

curl http://localhost:5000/api/auth/me -H "Authorization: Bearer %TOKEN%"

```



\---



\## Admin Route Test



```http

GET /api/auth/admin-test

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

```



Command:



```bash

curl http://localhost:5000/api/auth/admin-test -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\# 3. Customer Profile APIs



\## Get Customer Profile



```http

GET /api/customer/profile

```



Allowed role:



```txt

CUSTOMER

```



Command:



```bash

curl http://localhost:5000/api/customer/profile -H "Authorization: Bearer %TOKEN%"

```



\---



\## Create or Update Customer Profile



```http

PUT /api/customer/profile

```



Allowed role:



```txt

CUSTOMER

```



Body:



```json

{

&#x20; "date\_of\_birth": "2002-01-01",

&#x20; "gender": "Male",

&#x20; "address": "Demo Address",

&#x20; "city": "Anantapur",

&#x20; "state": "Andhra Pradesh",

&#x20; "pincode": "515001",

&#x20; "learner\_license\_number": "LLR123456",

&#x20; "driving\_license\_number": "",

&#x20; "emergency\_contact\_name": "Emergency Contact",

&#x20; "emergency\_contact\_phone": "9876543210"

}

```



Command:



```bash

curl -X PUT http://localhost:5000/api/customer/profile -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\\"date\_of\_birth\\":\\"2002-01-01\\",\\"gender\\":\\"Male\\",\\"address\\":\\"Demo Address\\",\\"city\\":\\"Anantapur\\",\\"state\\":\\"Andhra Pradesh\\",\\"pincode\\":\\"515001\\",\\"learner\_license\_number\\":\\"LLR123456\\",\\"driving\_license\_number\\":\\"\\",\\"emergency\_contact\_name\\":\\"Emergency Contact\\",\\"emergency\_contact\_phone\\":\\"9876543210\\"}"

```



\---



\# 4. Partner Driving School APIs



\## Get Partner School



```http

GET /api/partner/school

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Command:



```bash

curl http://localhost:5000/api/partner/school -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Register or Update Driving School



```http

PUT /api/partner/school

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Body:



```json

{

&#x20; "school\_name": "Speed Driving School",

&#x20; "description": "Best driving school for car and two wheeler training",

&#x20; "email": "speedschool@gmail.com",

&#x20; "phone": "7666666666",

&#x20; "address": "Main Road, Anantapur",

&#x20; "city": "Anantapur",

&#x20; "state": "Andhra Pradesh",

&#x20; "pincode": "515001",

&#x20; "latitude": 14.6819,

&#x20; "longitude": 77.6006,

&#x20; "service\_radius\_km": 10

}

```



Command:



```bash

curl -X PUT http://localhost:5000/api/partner/school -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"school\_name\\":\\"Speed Driving School\\",\\"description\\":\\"Best driving school for car and two wheeler training\\",\\"email\\":\\"speedschool@gmail.com\\",\\"phone\\":\\"7666666666\\",\\"address\\":\\"Main Road, Anantapur\\",\\"city\\":\\"Anantapur\\",\\"state\\":\\"Andhra Pradesh\\",\\"pincode\\":\\"515001\\",\\"latitude\\":14.6819,\\"longitude\\":77.6006,\\"service\_radius\_km\\":10}"

```



\---



\# 5. Admin School Approval APIs



\## Get All Schools



```http

GET /api/admin/schools

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

```



Optional filters:



```txt

?status=PENDING

?status=APPROVED

?status=REJECTED

?status=SUSPENDED

```



Command:



```bash

curl "http://localhost:5000/api/admin/schools?status=PENDING" -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\## Get School by ID



```http

GET /api/admin/schools/:schoolId

```



Command:



```bash

curl http://localhost:5000/api/admin/schools/SCHOOL\_ID -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\## Update School Status



```http

PATCH /api/admin/schools/:schoolId/status

```



Allowed statuses:



```txt

UNDER\_REVIEW

APPROVED

REJECTED

SUSPENDED

```



Body:



```json

{

&#x20; "status": "APPROVED",

&#x20; "admin\_notes": "School verified and approved for platform listing."

}

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/admin/schools/SCHOOL\_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer %ADMIN\_TOKEN%" -d "{\\"status\\":\\"APPROVED\\",\\"admin\_notes\\":\\"School verified and approved for platform listing.\\"}"

```



\---



\# 6. Partner Course APIs



\## Get Partner Courses



```http

GET /api/partner/courses

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Command:



```bash

curl http://localhost:5000/api/partner/courses -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Create Course



```http

POST /api/partner/courses

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Body:



```json

{

&#x20; "course\_name": "Car Driving Basic Course",

&#x20; "description": "15 days manual car driving course with instructor support",

&#x20; "vehicle\_type": "CAR",

&#x20; "transmission": "MANUAL",

&#x20; "duration\_days": 15,

&#x20; "total\_sessions": 15,

&#x20; "price": 7000,

&#x20; "discount\_price": 5999,

&#x20; "platform\_commission\_percent": 10

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/partner/courses -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"course\_name\\":\\"Car Driving Basic Course\\",\\"description\\":\\"15 days manual car driving course with instructor support\\",\\"vehicle\_type\\":\\"CAR\\",\\"transmission\\":\\"MANUAL\\",\\"duration\_days\\":15,\\"total\_sessions\\":15,\\"price\\":7000,\\"discount\_price\\":5999,\\"platform\_commission\_percent\\":10}"

```



\---



\## Update Course



```http

PUT /api/partner/courses/:courseId

```



\---



\## Activate or Deactivate Course



```http

PATCH /api/partner/courses/:courseId/status

```



Body:



```json

{

&#x20; "is\_active": true

}

```



\---



\# 7. Public Marketplace APIs



These APIs are public. No token required.



\## Get Approved Schools



```http

GET /api/marketplace/schools

```



Optional filters:



```txt

?city=Anantapur

?vehicle\_type=CAR

?transmission=MANUAL

?search=Speed

```



Command:



```bash

curl http://localhost:5000/api/marketplace/schools

```



\---



\## Get School Details



```http

GET /api/marketplace/schools/:schoolId

```



Command:



```bash

curl http://localhost:5000/api/marketplace/schools/SCHOOL\_ID

```



\---



\## Get Available Courses



```http

GET /api/marketplace/courses

```



Optional filters:



```txt

?city=Anantapur

?vehicle\_type=CAR

?transmission=MANUAL

```



Command:



```bash

curl http://localhost:5000/api/marketplace/courses

```



\---



\## Get Course Details



```http

GET /api/marketplace/courses/:courseId

```



Command:



```bash

curl http://localhost:5000/api/marketplace/courses/COURSE\_ID

```



\---



\# 8. Customer Booking APIs



\## Create Booking



```http

POST /api/customer/bookings

```



Allowed role:



```txt

CUSTOMER

```



Body:



```json

{

&#x20; "course\_id": "COURSE\_ID",

&#x20; "preferred\_start\_date": "2026-06-10"

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/customer/bookings -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\\"course\_id\\":\\"COURSE\_ID\\",\\"preferred\_start\_date\\":\\"2026-06-10\\"}"

```



\---



\## Get My Bookings



```http

GET /api/customer/bookings

```



Command:



```bash

curl http://localhost:5000/api/customer/bookings -H "Authorization: Bearer %TOKEN%"

```



\---



\## Get Booking by ID



```http

GET /api/customer/bookings/:bookingId

```



\---



\## Cancel Booking



```http

PATCH /api/customer/bookings/:bookingId/cancel

```



Body:



```json

{

&#x20; "cancellation\_reason": "I want to cancel this booking"

}

```



\---



\# 9. Partner Booking Approval APIs



\## Get Partner Bookings



```http

GET /api/partner/bookings

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Optional filters:



```txt

?status=PENDING

?status=ACCEPTED

?status=ONGOING

?status=COMPLETED

```



Command:



```bash

curl "http://localhost:5000/api/partner/bookings?status=PENDING" -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Get Partner Booking by ID



```http

GET /api/partner/bookings/:bookingId

```



\---



\## Accept or Reject Booking



```http

PATCH /api/partner/bookings/:bookingId/status

```



Accept body:



```json

{

&#x20; "booking\_status": "ACCEPTED"

}

```



Reject body:



```json

{

&#x20; "booking\_status": "REJECTED",

&#x20; "rejection\_reason": "Slots are full"

}

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/partner/bookings/BOOKING\_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"booking\_status\\":\\"ACCEPTED\\"}"

```



\---



\## Complete Booking



```http

PATCH /api/partner/bookings/:bookingId/complete

```



This changes booking status:



```txt

ONGOING → COMPLETED

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/partner/bookings/BOOKING\_ID/complete -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\# 10. Payment APIs



\## Create Payment Order



```http

POST /api/customer/payments/orders

```



Allowed role:



```txt

CUSTOMER

```



Body:



```json

{

&#x20; "booking\_id": "BOOKING\_ID"

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/customer/payments/orders -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\\"booking\_id\\":\\"BOOKING\_ID\\"}"

```



\---



\## Mark Test Payment Success



```http

PATCH /api/customer/payments/orders/:paymentOrderId/test-success

```



Body:



```json

{

&#x20; "payment\_method": "UPI"

}

```



This changes booking status:



```txt

ACCEPTED → ONGOING

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/customer/payments/orders/PAYMENT\_ORDER\_ID/test-success -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\\"payment\_method\\":\\"UPI\\"}"

```



\---



\## Get My Payments



```http

GET /api/customer/payments

```



Command:



```bash

curl http://localhost:5000/api/customer/payments -H "Authorization: Bearer %TOKEN%"

```



\---



\# 11. Instructor Management APIs



\## Get Instructors



```http

GET /api/partner/assets/instructors

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Command:



```bash

curl http://localhost:5000/api/partner/assets/instructors -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Create Instructor



```http

POST /api/partner/assets/instructors

```



Body:



```json

{

&#x20; "full\_name": "Ravi Instructor",

&#x20; "phone": "9000000001",

&#x20; "email": "ravi.instructor@example.com",

&#x20; "license\_number": "INST123456",

&#x20; "experience\_years": 5

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/partner/assets/instructors -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"full\_name\\":\\"Ravi Instructor\\",\\"phone\\":\\"9000000001\\",\\"email\\":\\"ravi.instructor@example.com\\",\\"license\_number\\":\\"INST123456\\",\\"experience\_years\\":5}"

```



\---



\## Update Instructor



```http

PUT /api/partner/assets/instructors/:instructorId

```



\---



\## Activate or Deactivate Instructor



```http

PATCH /api/partner/assets/instructors/:instructorId/status

```



Body:



```json

{

&#x20; "is\_active": true

}

```



\---



\# 12. Vehicle Management APIs



\## Get Vehicles



```http

GET /api/partner/assets/vehicles

```



Command:



```bash

curl http://localhost:5000/api/partner/assets/vehicles -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Create Vehicle



```http

POST /api/partner/assets/vehicles

```



Body:



```json

{

&#x20; "instructor\_id": "INSTRUCTOR\_ID",

&#x20; "vehicle\_number": "AP02AB1234",

&#x20; "vehicle\_type": "CAR",

&#x20; "transmission": "MANUAL",

&#x20; "vehicle\_model": "Swift Dzire",

&#x20; "manufacturer": "Maruti Suzuki",

&#x20; "insurance\_valid\_until": "2027-06-01",

&#x20; "pollution\_valid\_until": "2027-06-01",

&#x20; "fitness\_valid\_until": "2028-06-01"

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/partner/assets/vehicles -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"instructor\_id\\":\\"INSTRUCTOR\_ID\\",\\"vehicle\_number\\":\\"AP02AB1234\\",\\"vehicle\_type\\":\\"CAR\\",\\"transmission\\":\\"MANUAL\\",\\"vehicle\_model\\":\\"Swift Dzire\\",\\"manufacturer\\":\\"Maruti Suzuki\\",\\"insurance\_valid\_until\\":\\"2027-06-01\\",\\"pollution\_valid\_until\\":\\"2027-06-01\\",\\"fitness\_valid\_until\\":\\"2028-06-01\\"}"

```



\---



\## Update Vehicle



```http

PUT /api/partner/assets/vehicles/:vehicleId

```



\---



\## Activate or Deactivate Vehicle



```http

PATCH /api/partner/assets/vehicles/:vehicleId/status

```



Body:



```json

{

&#x20; "is\_active": true

}

```



\---



\# 13. Class Session APIs



\## Partner Schedules Class Session



```http

POST /api/sessions/partner

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Body:



```json

{

&#x20; "booking\_id": "BOOKING\_ID",

&#x20; "instructor\_id": "INSTRUCTOR\_ID",

&#x20; "vehicle\_id": "VEHICLE\_ID",

&#x20; "session\_date": "2026-06-11",

&#x20; "start\_time": "10:00",

&#x20; "end\_time": "11:00",

&#x20; "notes": "First practical driving class"

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/sessions/partner -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"booking\_id\\":\\"BOOKING\_ID\\",\\"instructor\_id\\":\\"INSTRUCTOR\_ID\\",\\"vehicle\_id\\":\\"VEHICLE\_ID\\",\\"session\_date\\":\\"2026-06-11\\",\\"start\_time\\":\\"10:00\\",\\"end\_time\\":\\"11:00\\",\\"notes\\":\\"First practical driving class\\"}"

```



\---



\## Partner Views Sessions



```http

GET /api/sessions/partner

```



Optional filters:



```txt

?status=SCHEDULED

?date=2026-06-11

```



\---



\## Partner Updates Session Status



```http

PATCH /api/sessions/partner/:sessionId/status

```



Allowed statuses:



```txt

SCHEDULED

COMPLETED

CANCELLED

MISSED

```



Body:



```json

{

&#x20; "status": "COMPLETED",

&#x20; "notes": "Customer completed first class successfully"

}

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/sessions/partner/SESSION\_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"status\\":\\"COMPLETED\\",\\"notes\\":\\"Customer completed first class successfully\\"}"

```



\---



\## Customer Views Sessions



```http

GET /api/sessions/customer

```



Allowed role:



```txt

CUSTOMER

```



Command:



```bash

curl http://localhost:5000/api/sessions/customer -H "Authorization: Bearer %TOKEN%"

```



\---



\# 14. Reviews and Ratings APIs



\## Customer Submits Review



```http

POST /api/reviews

```



Allowed role:



```txt

CUSTOMER

```



Review is allowed only after:



```txt

booking\_status = COMPLETED

```



Body:



```json

{

&#x20; "booking\_id": "BOOKING\_ID",

&#x20; "rating": 5,

&#x20; "comment": "Excellent driving school. Instructor was very helpful and professional."

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/reviews -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\\"booking\_id\\":\\"BOOKING\_ID\\",\\"rating\\":5,\\"comment\\":\\"Excellent driving school. Instructor was very helpful and professional.\\"}"

```



\---



\## Customer Views Own Reviews



```http

GET /api/reviews/my

```



Command:



```bash

curl http://localhost:5000/api/reviews/my -H "Authorization: Bearer %TOKEN%"

```



\---



\## Public School Reviews



```http

GET /api/reviews/school/:schoolId

```



Command:



```bash

curl http://localhost:5000/api/reviews/school/SCHOOL\_ID

```



\---



\# 15. Complaints and Support APIs



\## Create Complaint



```http

POST /api/complaints

```



Allowed roles:



```txt

CUSTOMER

SCHOOL\_OWNER

```



Body:



```json

{

&#x20; "booking\_id": "BOOKING\_ID",

&#x20; "subject": "Need certificate update",

&#x20; "description": "I completed the course but I need a completion certificate update."

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/complaints -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\\"booking\_id\\":\\"BOOKING\_ID\\",\\"subject\\":\\"Need certificate update\\",\\"description\\":\\"I completed the course but I need a completion certificate update.\\"}"

```



\---



\## Get My Complaints



```http

GET /api/complaints/my

```



Command:



```bash

curl http://localhost:5000/api/complaints/my -H "Authorization: Bearer %TOKEN%"

```



\---



\## Admin Gets All Complaints



```http

GET /api/complaints/admin/all

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

SUPPORT\_STAFF

```



Optional filters:



```txt

?status=OPEN

?status=RESOLVED

```



Command:



```bash

curl http://localhost:5000/api/complaints/admin/all -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\## Admin Updates Complaint



```http

PATCH /api/complaints/admin/:complaintId

```



Body:



```json

{

&#x20; "status": "RESOLVED",

&#x20; "admin\_response": "Your certificate request is received."

}

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/complaints/admin/COMPLAINT\_ID -H "Content-Type: application/json" -H "Authorization: Bearer %ADMIN\_TOKEN%" -d "{\\"status\\":\\"RESOLVED\\",\\"admin\_response\\":\\"Your certificate request is received.\\"}"

```



\---



\## Add Complaint Message



```http

POST /api/complaints/:complaintId/messages

```



Body:



```json

{

&#x20; "message": "Please update me about this complaint."

}

```



\---



\## Get Complaint with Messages



```http

GET /api/complaints/:complaintId

```



Command:



```bash

curl http://localhost:5000/api/complaints/COMPLAINT\_ID -H "Authorization: Bearer %TOKEN%"

```



\---



\# 16. Notifications APIs



\## Get My Notifications



```http

GET /api/notifications/my

```



Command:



```bash

curl http://localhost:5000/api/notifications/my -H "Authorization: Bearer %TOKEN%"

```



\---



\## Mark One Notification as Read



```http

PATCH /api/notifications/:notificationId/read

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/notifications/NOTIFICATION\_ID/read -H "Authorization: Bearer %TOKEN%"

```



\---



\## Mark All Notifications as Read



```http

PATCH /api/notifications/read-all

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/notifications/read-all -H "Authorization: Bearer %TOKEN%"

```



\---



\## Admin Sends Notification



```http

POST /api/notifications/admin/send

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

SUPPORT\_STAFF

```



Body:



```json

{

&#x20; "user\_id": "USER\_ID",

&#x20; "title": "Important Update",

&#x20; "message": "Your account has been updated.",

&#x20; "type": "GENERAL"

}

```



\---



\# 17. Payout and Earnings APIs



\## Partner Earnings Summary



```http

GET /api/payouts/partner/summary

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Command:



```bash

curl http://localhost:5000/api/payouts/partner/summary -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Partner Payout History



```http

GET /api/payouts/partner

```



Command:



```bash

curl http://localhost:5000/api/payouts/partner -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Admin Views Payouts



```http

GET /api/payouts/admin

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

ACCOUNTANT

```



Optional filters:



```txt

?status=PENDING

?status=PAID

```



Command:



```bash

curl "http://localhost:5000/api/payouts/admin?status=PENDING" -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\## Admin Marks Payout Paid



```http

PATCH /api/payouts/admin/:payoutId/paid

```



Body:



```json

{

&#x20; "payout\_reference": "BANK\_TRANSFER\_TEST\_001"

}

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/payouts/admin/PAYOUT\_ID/paid -H "Content-Type: application/json" -H "Authorization: Bearer %ADMIN\_TOKEN%" -d "{\\"payout\_reference\\":\\"BANK\_TRANSFER\_TEST\_001\\"}"

```



\---



\# 18. Dashboard APIs



\## Admin Dashboard



```http

GET /api/dashboard/admin

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

ACCOUNTANT

SUPPORT\_STAFF

```



Command:



```bash

curl http://localhost:5000/api/dashboard/admin -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



Returns:



```txt

Users count

Schools count

Courses count

Bookings count

Payment summary

Payout summary

Complaints summary

Review summary

```



\---



\## Partner Dashboard



```http

GET /api/dashboard/partner

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Command:



```bash

curl http://localhost:5000/api/dashboard/partner -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



Returns:



```txt

School status

Courses count

Bookings count

Sessions count

Payout summary

Rating summary

```



\---



\# 19. School Document Verification APIs



\## Partner Uploads School Document



```http

POST /api/documents/partner/school

```



Allowed role:



```txt

SCHOOL\_OWNER

```



Body:



```json

{

&#x20; "document\_type": "DRIVING\_SCHOOL\_LICENSE",

&#x20; "document\_number": "DSL123456",

&#x20; "document\_url": "https://example.com/demo-driving-school-license.pdf",

&#x20; "file\_name": "driving-school-license.pdf",

&#x20; "file\_type": "application/pdf",

&#x20; "file\_size\_bytes": 120000,

&#x20; "expiry\_date": "2027-06-01"

}

```



Command:



```bash

curl -X POST http://localhost:5000/api/documents/partner/school -H "Content-Type: application/json" -H "Authorization: Bearer %PARTNER\_TOKEN%" -d "{\\"document\_type\\":\\"DRIVING\_SCHOOL\_LICENSE\\",\\"document\_number\\":\\"DSL123456\\",\\"document\_url\\":\\"https://example.com/demo-driving-school-license.pdf\\",\\"file\_name\\":\\"driving-school-license.pdf\\",\\"file\_type\\":\\"application/pdf\\",\\"file\_size\_bytes\\":120000,\\"expiry\_date\\":\\"2027-06-01\\"}"

```



\---



\## Partner Views Own School Documents



```http

GET /api/documents/partner/school

```



Command:



```bash

curl http://localhost:5000/api/documents/partner/school -H "Authorization: Bearer %PARTNER\_TOKEN%"

```



\---



\## Admin Views School Documents



```http

GET /api/documents/admin/school

```



Allowed roles:



```txt

ADMIN

SUPER\_ADMIN

SUPPORT\_STAFF

```



Optional filters:



```txt

?status=PENDING

?status=APPROVED

?status=REJECTED

```



Command:



```bash

curl "http://localhost:5000/api/documents/admin/school?status=PENDING" -H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\## Admin Updates Document Status



```http

PATCH /api/documents/admin/school/:documentId/status

```



Approve body:



```json

{

&#x20; "status": "APPROVED"

}

```



Reject body:



```json

{

&#x20; "status": "REJECTED",

&#x20; "rejection\_reason": "Document is not clear"

}

```



Command:



```bash

curl -X PATCH http://localhost:5000/api/documents/admin/school/DOCUMENT\_ID/status -H "Content-Type: application/json" -H "Authorization: Bearer %ADMIN\_TOKEN%" -d "{\\"status\\":\\"APPROVED\\"}"

```



\---



\# Authorization Guide



For protected routes, send the JWT token:



```txt

Authorization: Bearer JWT\_TOKEN

```



Windows Command Prompt examples:



```bash

\-H "Authorization: Bearer %TOKEN%"

\-H "Authorization: Bearer %PARTNER\_TOKEN%"

\-H "Authorization: Bearer %ADMIN\_TOKEN%"

```



\---



\# User Roles



```txt

CUSTOMER

SCHOOL\_OWNER

INSTRUCTOR

SUPPORT\_STAFF

ADMIN

SUPER\_ADMIN

ACCOUNTANT

```



\---



\# Main Business Flow



```txt

1\. Customer registers

2\. Partner registers as school owner

3\. Partner registers driving school

4\. Admin approves driving school

5\. Partner creates course

6\. Customer views marketplace

7\. Customer selects school/course

8\. Customer books course

9\. Partner accepts booking

10\. Customer pays

11\. Booking becomes ONGOING

12\. Partner adds instructor and vehicle

13\. Partner schedules class sessions

14\. Customer attends sessions

15\. Partner marks sessions completed

16\. Partner completes booking

17\. Customer reviews school

18\. Admin manages complaints

19\. Admin manages payouts

20\. Admin verifies documents

```



\---



\# Current Test Data



```txt

Admin:

admin@driveconnect.com

Password: Admin@12345



Customer:

customer1@driveconnect.com

Password: 123456



Partner:

partner1@driveconnect.com

Password: 123456



School:

Speed Driving School



Course:

Car Driving Basic Course



Booking:

Completed



Payment:

Success



Review:

5 Star

```



\---



\# Important Security Notes



```txt

Never expose DATABASE\_URL in frontend.

Never expose .env file.

Never store plain passwords.

Never share JWT tokens.

Use HTTPS in production.

Use Razorpay or Stripe for real payments.

Use Supabase Storage or AWS S3 for real document files.

Use environment variables for all secrets.

Use different databases for development and production.

```



\---



\# Backend Status



```txt

Commercial database completed.

Backend server completed.

Authentication completed.

Customer module completed.

Partner module completed.

Admin module completed.

Marketplace completed.

Booking flow completed.

Payment tracking completed.

Session scheduling completed.

Reviews completed.

Complaints completed.

Notifications completed.

Payouts completed.

Dashboards completed.

Document verification completed.

```

