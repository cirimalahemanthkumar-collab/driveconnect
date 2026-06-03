# DriveConnect Customer + Partner Website

Open this folder directly in VS Code:

```text
C:\Users\cirim\OneDrive\Documents\school\driveconnect\apps\customer-site
```

The site expects the backend at `http://localhost:5000`.

```powershell
copy .env.example .env
npm run dev
```

If `npm` is not available globally on this Windows PC, use the included launcher:

```powershell
..\..\scripts\node-local.cmd ..\..\tools\npm\package\bin\npm-cli.js run dev
```

Website: `http://localhost:3000`

Customer accounts open `/customer/dashboard`. School-owner accounts open `/partner/dashboard`. Admin-team accounts are rejected with `Please use the Admin Site`.
