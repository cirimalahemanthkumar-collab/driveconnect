# DriveConnect

DriveConnect is a Swiggy-style marketplace MVP for connecting learner customers with verified driving schools. The platform owner earns through commission, booking fees, subscriptions, featured listings, and ads.

Compliance note: DriveConnect supports school discovery, course booking, instructor scheduling, class tracking, payments, support, ratings, and licence process guidance. It does not promise or guarantee a driving licence.

## Apps

- `apps/web`: Next.js + TypeScript + Tailwind web app with separate customer, partner, and admin portal sites.
- `apps/customer-site`: Standalone customer website on port `3000`.
- `apps/partner-site`: Standalone driving-school partner website on port `3001`.
- `apps/admin-site`: Standalone platform admin website on port `3002`.
- `apps/mobile`: Expo React Native customer MVP with OTP, discovery, booking, payment, tracking, profile, support, and review screens.
- `apps/partner-mobile`: Separate Expo React Native partner Android app for school login, booking decisions, course publishing, and earnings.
- `apps/admin-mobile`: Separate Expo React Native admin Android app for owner setup/login, school verification, bookings, and payments.
- `backend`: Express + TypeScript API with Prisma, OTP provider adapters, Razorpay verification and webhooks, Cloudinary upload signing, ranking, commissions, settlements, and admin analytics.
- `packages/shared`: Shared constants, types, validation schemas, and marketplace helpers.

## Local Setup (Works Without Docker)

```powershell
cd C:\Users\cirim\OneDrive\Documents\school\driveconnect
copy .env.example .env
npm install
```

If `npm` is not on PATH in this Codex/Windows runtime, use the repo-local launcher:

```powershell
.\scripts\node-local.cmd tools\npm\package\bin\npm-cli.js install
```

The default backend uses `backend/data/local-db.json`. It persists admin setup, partner registrations, verification updates, customer bookings, and school acceptance decisions without requiring PostgreSQL or Docker.

## Run The Real Local Workflow

Open four VS Code terminals in the project root. Start the shared API first:

```powershell
npm run dev:backend
```

Then start the three independent websites:

```powershell
npm run dev:customer-site
npm run dev:partner-site
npm run dev:admin-site
```

If global `npm` is unavailable, use these exact commands instead:

```powershell
.\scripts\node-local.cmd tools\npm\package\bin\npm-cli.js run dev:backend
.\scripts\node-local.cmd tools\npm\package\bin\npm-cli.js run dev:customer-site
.\scripts\node-local.cmd tools\npm\package\bin\npm-cli.js run dev:partner-site
.\scripts\node-local.cmd tools\npm\package\bin\npm-cli.js run dev:admin-site
```

Local URLs:

- Shared API: `http://localhost:4000`
- Customer site: `http://localhost:3000`
- Partner site: `http://localhost:3001`
- Admin site: `http://localhost:3002`

Reset the local demo to its first-run state:

```powershell
npm run reset:local
```

## First Operating Flow

1. Open `http://localhost:3002/admin/login`. The first visit shows `Create the owner account`. Enter your admin name, mobile number, and PIN.
2. Give partners `http://localhost:3001/partner/register`. They register their school and receive an `Under Review` status.
3. Return to `http://localhost:3002/admin/school-verification`. Verify the new school.
4. The partner logs in at `http://localhost:3001/partner/login`, opens `Courses`, and publishes at least one course.
5. Customers open `http://localhost:3000/checkout`, choose a verified school and course, and submit a slot request.
6. The school owner opens `Bookings` and accepts or rejects the slot.
7. The customer refreshes `http://localhost:3000/dashboard` to see the confirmation. The admin can monitor all requests at `http://localhost:3002/admin/bookings`.

Sample verified partner login: mobile `+919870000001`, PIN `1234`.

## Open Individual Sites In VS Code

Customer website:

```text
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\customer-site
```

Partner website:

```text
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\partner-site
```

Admin website:

```text
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\admin-site
```

Open any one folder directly in VS Code. Then use `Terminal > Run Task...` and select its `Run ... website` task. Since global `npm` is missing on this PC, each site task uses the included local launcher.

The API is shared between the sites. Run the `Run local backend API` task once from any opened site folder before opening the interface.

## VS Code

Open the workspace file:

```powershell
code C:\Users\cirim\OneDrive\Documents\school\driveconnect\driveconnect.code-workspace
```

Recommended first run inside VS Code:

1. Open `Terminal > Run Task...`.
2. Run `DriveConnect: install dependencies`.
3. Run `DriveConnect: dev backend API`.
4. Run `DriveConnect: dev customer site`.
5. Run `DriveConnect: dev partner site`.
6. Run `DriveConnect: dev admin site`.

Debug/run profiles are available in `Run and Debug`:

- `DriveConnect: Backend API`
- `DriveConnect: Web App`
- `DriveConnect: Mobile App`
- `DriveConnect: Web Production Preview`
- `DriveConnect: Backend + Web`

The VS Code tasks use `scripts\node-local.cmd`, so they work on this Windows project even when global `npm` is not available in the terminal. If normal Node/npm is installed, the same `npm run ...` commands still work.

## Android Studio Projects

Generate the three native Android folders once:

```powershell
npm run prebuild:android
```

Then open these folders individually in Android Studio:

```text
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\mobile\android
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\partner-mobile\android
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\admin-mobile\android
```

Android emulator builds use `http://10.0.2.2:4000` to reach the local backend. For a physical phone, set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN IP before starting Expo.

Run the role apps with Expo:

```powershell
npm run dev:mobile
npm run dev:partner-mobile
npm run dev:admin-mobile
```

The customer app is connected to the Prisma API for OTP, discovery, booking, Razorpay Checkout, tracking, profile, complaint, and review flows. Razorpay is a native module, so test the customer app with a development build rather than Expo Go:

```powershell
cd apps\mobile
npx expo prebuild
npx expo run:android --device
```

## Checks

```powershell
npm run build
npm run build:sites
npm run lint
npm run lint:sites
npm run test
npm run db:generate
npm run smoke:sites
npm run smoke:api
```

Web production route smoke test:

```powershell
.\scripts\node-local.cmd scripts\smoke-web.cjs
```

The smoke test starts the built web app on `http://127.0.0.1:3100`, checks customer, partner, and admin site routes, then writes results to `test-artifacts/web-smoke`.

`npm run smoke:sites` starts the three standalone production builds independently on test ports and verifies each role-specific site.

`npm run smoke:api` runs an isolated end-to-end marketplace check without changing your saved local demo: admin setup, partner registration, school verification, course publishing, customer checkout, partner acceptance, commission, and settlement totals.

## Local Seed Data

The zero-Docker local API starts with:

- No admin account, so you can create the real first owner account.
- Verified school: `Metro Gear Driving Academy`.
- Sample partner login: `+919870000001`, PIN `1234`.
- Verified school: `SafeTurn Motor School`.
- Sample partner login: `+919870000002`, PIN `1234`.
- Three bookable courses and an initially empty booking queue.

Every local checkout records a successful mock payment and a pending school settlement. Admin and partner finance dashboards read those persisted values, including platform commission and the booking fee.

## PostgreSQL Production API

Run PostgreSQL locally while preparing the production API:

```powershell
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:backend:postgres
```

For a hosted PostgreSQL database, set the production environment values and apply committed migrations:

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
npm run check:production-env
npm run dev:backend:postgres
```

Swagger docs for PostgreSQL mode: `http://localhost:4000/docs`.

Before a public launch, read [Startup Launch Roadmap](docs/startup-launch-roadmap.md). The production backend now refuses to start with demo credentials, mock OTP, mock payments, local uploads, or localhost URLs. Check readiness with:

```powershell
npm run check:production-env
```

## Environment

Required values are listed in `.env.example`.

- `DATABASE_URL`: PostgreSQL connection string used by Prisma.
- `APP_ENV`: set to `production` in hosted environments.
- `JWT_SECRET`: long random secret used for signed OTP challenges and session tokens.
- `PORT`: backend port, default `4000`.
- `WEB_BASE_URLS`: comma-separated customer, partner, and admin CORS origins.
- `NEXT_PUBLIC_API_BASE_URL`: browser-visible API base URL.
- `EXPO_PUBLIC_API_BASE_URL`: Expo-visible API base URL.
- `OTP_PROVIDER`: `mock` for development, or `msg91` / `twilio` for production.
- `MSG91_AUTH_KEY`, `MSG91_WIDGET_ID`: required when using MSG91.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`: required when using Twilio Verify.
- `PAYMENT_PROVIDER`: `mock` for development or `razorpay` for production.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: Razorpay Checkout and webhook credentials.
- `UPLOAD_PROVIDER`: `local` for development or `cloudinary` for production.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary signed-upload credentials.
- `GOOGLE_MAPS_API_KEY`: maps-ready placeholder.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: required on Render for registration email OTP delivery.

Do not put `NODE_ENV` in `.env`; Next and npm set it for the relevant command.

## API Highlights

- Auth: `POST /auth/send-otp`, `POST /auth/verify-otp`
- Customers: profile and address routes
- Schools: registration, nearby ranking, details, documents, verify, approve, reject, suspend, partner bookings, partner earnings
- Courses, instructors, vehicles: school-scoped CRUD routes
- Bookings: create, list, detail, accept, reject, assign instructor, schedule session, cancel, complete course
- Payments: server-side Razorpay orders, Checkout signature verification, raw signed webhooks, development mock success, refunds, payment lookup, settlements
- Reviews and complaints
- Admin: dashboard, users, bookings, revenue, payments, settlements, school verification, complaints, commissions, coupons, featured listings

## Commission

On successful booking payment:

```ts
platformCommission = totalAmount * commissionPercentage / 100;
schoolPayout = totalAmount - platformCommission;
```

Both values are stored in `Payment` and `Settlement` and surfaced in admin revenue and partner earnings flows.

## Docs

- [Architecture](docs/architecture.md)
- [Database](docs/database.md)
- [API](docs/api.md)
- [Setup](docs/setup.md)
- [Startup Launch Roadmap](docs/startup-launch-roadmap.md)
