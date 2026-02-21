# FleetFlow — Fleet & Logistics Management System

A full-stack fleet management application for tracking vehicles, drivers, trips, maintenance, and expenses with role-based access control, real-time analytics, and compliance monitoring.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
- [Seeding the Database](#seeding-the-database)
- [Frontend Pages](#frontend-pages)
- [Business Logic](#business-logic)
- [Environment Variables](#environment-variables)

---

## Overview

FleetFlow is a production-grade fleet management system built with a **React** frontend and an **Express + Prisma + PostgreSQL** backend. It provides:

- **Vehicle Management** — Track fleet inventory, status lifecycle, odometer, acquisition cost, and retirement
- **Driver Management** — License tracking, safety scores, performance ratings, and availability status
- **Trip Lifecycle** — Full Draft → Dispatched → Completed/Cancelled workflow with cargo validation
- **Maintenance Scheduling** — Log repairs, auto-set vehicles to "In Shop", restore on completion
- **Expense Tracking** — Fuel, toll, and miscellaneous expense recording per vehicle
- **Analytics Dashboard** — Fleet utilization, revenue, ROI per vehicle, fuel efficiency metrics
- **Compliance Monitoring** — Expired/expiring licenses, low safety scores, high-mileage vehicle alerts
- **Role-Based Access** — Four distinct user roles with scoped permissions

---

## Tech Stack

### Backend

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Runtime        | Node.js                                         |
| Framework      | Express 4                                       |
| Database       | PostgreSQL                                      |
| ORM            | Prisma 6                                        |
| Authentication | JWT (jsonwebtoken) + bcryptjs                   |
| Security       | Helmet, CORS, express-rate-limit                |
| Logging        | Morgan (dev)                                    |

### Frontend

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Framework   | React 18                                           |
| Build Tool  | Vite                                               |
| Styling     | Tailwind CSS                                       |
| Animations  | Framer Motion                                      |
| Charts      | Recharts                                           |
| HTTP Client | Axios                                              |
| Icons       | Lucide React                                       |
| Routing     | React Router DOM 7                                 |
| Toasts      | React Hot Toast                                    |

---

## Project Structure

```
fleetflow/
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema & enums
│   ├── src/
│   │   ├── app.js                 # Express app setup & middleware
│   │   ├── server.js              # Server entry point & Prisma lifecycle
│   │   ├── seed.js                # Database seeder with sample data
│   │   ├── config/
│   │   │   ├── constants.js       # App constants, enum values, pagination
│   │   │   └── prisma.js          # Prisma Client singleton
│   │   ├── controllers/           # Route handlers (8 controllers)
│   │   ├── middlewares/
│   │   │   ├── auth.js            # JWT authentication & role authorization
│   │   │   └── errorHandler.js    # Centralized Prisma/JWT error handling
│   │   ├── routes/                # Express route definitions (8 routers)
│   │   ├── services/              # Business logic layer
│   │   │   ├── analyticsService.js
│   │   │   ├── complianceService.js
│   │   │   └── tripService.js
│   │   └── utils/
│   │       ├── AppError.js        # Custom error classes
│   │       ├── asyncHandler.js    # Async error wrapper
│   │       ├── queryHelpers.js    # Prisma query builder (filter, sort, paginate)
│   │       └── sendResponse.js    # Standardized JSON responses
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── App.jsx                # Route configuration
│   │   ├── main.jsx               # React entry point
│   │   ├── api/                   # Axios API modules (8 resource files)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Sidebar.jsx    # Navigation sidebar
│   │   │   └── ui/                # Reusable UI components
│   │   │       ├── ConfirmDialog.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       ├── Filters.jsx
│   │   │       ├── KPICard.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── PageHeader.jsx
│   │   │       ├── Pagination.jsx
│   │   │       ├── Skeleton.jsx
│   │   │       └── StatusBadge.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state, login/logout, role checking
│   │   ├── hooks/
│   │   │   └── index.js           # Custom React hooks
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx     # Authenticated layout wrapper
│   │   ├── pages/                 # 10 page components
│   │   └── utils/
│   │       └── helpers.js         # Formatters, status colors, display labels
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## Database Schema

Six models with a fully normalized relational design:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Vehicle    │───────▶│   Expense    │
│              │       │              │───────▶│              │
│  id (UUID)   │       │  id (UUID)   │───────▶│  id (UUID)   │
│  name        │       │  name        │       │  vehicleId   │
│  email ◄─┐   │       │  model       │       │  type (enum) │
│  password │   │       │  vehicleType │       │  cost        │
│  role (enum)  │       │  licensePlate│       │  liters      │
└──────────────┘       │  status      │       │  date        │
                       └──────┬───────┘       └──────────────┘
                              │
                              │ 1:N
                              ▼
┌──────────────┐       ┌──────────────┐
│   Driver     │──────▶│    Trip      │
│              │       │              │
│  id (UUID)   │       │  id (UUID)   │
│  name        │       │  vehicleId   │
│  email       │       │  driverId    │
│  license*    │       │  origin      │
│  safetyScore │       │  destination │
│  performance │       │  cargoWeight │
│  status      │       │  distanceKm  │
└──────────────┘       │  revenue     │
                       │  status      │
                       └──────────────┘

┌──────────────────┐
│ MaintenanceLog   │
│                  │
│  id (UUID)       │
│  vehicleId ──────┤──▶ Vehicle
│  type            │
│  cost            │
│  date            │
│  isCompleted     │
└──────────────────┘
```

**Enums:** `UserRole`, `VehicleStatus`, `VehicleType`, `DriverStatus`, `DriverPerformance`, `TripStatus`, `ExpenseType`

---

## API Reference

Base URL: `http://localhost:5000/api`

### Health

| Method | Endpoint       | Description          |
| ------ | -------------- | -------------------- |
| GET    | `/health`      | API health check     |

### Authentication

| Method | Endpoint         | Description           | Auth |
| ------ | ---------------- | --------------------- | ---- |
| POST   | `/auth/register` | Register a new user   | No   |
| POST   | `/auth/login`    | Login & receive JWT   | No   |
| GET    | `/auth/me`       | Get current user info | Yes  |

### Vehicles

| Method | Endpoint                 | Description            | Roles              |
| ------ | ------------------------ | ---------------------- | ------------------- |
| GET    | `/vehicles`              | List all vehicles      | Any authenticated   |
| GET    | `/vehicles/:id`          | Get single vehicle     | Any authenticated   |
| POST   | `/vehicles`              | Add a vehicle          | fleet_manager       |
| PUT    | `/vehicles/:id`          | Update a vehicle       | fleet_manager       |
| DELETE | `/vehicles/:id`          | Delete a vehicle       | fleet_manager       |
| PATCH  | `/vehicles/:id/retire`   | Retire a vehicle       | fleet_manager       |
| PATCH  | `/vehicles/:id/status`   | Change vehicle status  | fleet_manager       |

### Drivers

| Method | Endpoint                      | Description            | Roles                            |
| ------ | ----------------------------- | ---------------------- | -------------------------------- |
| GET    | `/drivers`                    | List all drivers       | Any authenticated                |
| GET    | `/drivers/:id`                | Get single driver      | Any authenticated                |
| POST   | `/drivers`                    | Add a driver           | fleet_manager                    |
| PUT    | `/drivers/:id`                | Update a driver        | fleet_manager                    |
| PATCH  | `/drivers/:id/status`         | Change driver status   | fleet_manager, safety_officer    |
| GET    | `/drivers/:id/performance`    | Get driver stats       | Any authenticated                |

### Trips

| Method | Endpoint                    | Description          | Roles        |
| ------ | --------------------------- | -------------------- | ------------ |
| GET    | `/trips`                    | List all trips       | Any authenticated |
| GET    | `/trips/:id`                | Get single trip      | Any authenticated |
| POST   | `/trips`                    | Create a trip        | dispatcher   |
| PATCH  | `/trips/:id/dispatch`       | Dispatch a trip      | dispatcher   |
| PATCH  | `/trips/:id/complete`       | Complete a trip      | dispatcher   |
| PATCH  | `/trips/:id/cancel`         | Cancel a trip        | dispatcher   |

### Maintenance

| Method | Endpoint                        | Description              | Roles          |
| ------ | ------------------------------- | ------------------------ | -------------- |
| GET    | `/maintenance`                  | List maintenance logs    | Any authenticated |
| POST   | `/maintenance`                  | Create maintenance log   | fleet_manager  |
| PATCH  | `/maintenance/:id/complete`     | Complete maintenance     | fleet_manager  |

### Expenses

| Method | Endpoint                          | Description                 | Roles                             |
| ------ | --------------------------------- | --------------------------- | --------------------------------- |
| GET    | `/expenses`                       | List all expenses           | Any authenticated                 |
| POST   | `/expenses`                       | Record an expense           | fleet_manager, financial_analyst  |
| GET    | `/expenses/vehicle/:vehicleId`    | Expenses summary by vehicle | Any authenticated                 |

### Analytics

| Method | Endpoint                              | Description                | Roles                             |
| ------ | ------------------------------------- | -------------------------- | --------------------------------- |
| GET    | `/analytics/dashboard`                | Dashboard KPIs             | fleet_manager, financial_analyst  |
| GET    | `/analytics/vehicle-roi/:vehicleId`   | Vehicle ROI analysis       | fleet_manager, financial_analyst  |
| GET    | `/analytics/fuel-efficiency/:vehicleId` | Fuel efficiency metrics  | fleet_manager, financial_analyst  |

### Compliance

| Method | Endpoint                          | Description                    | Roles                          |
| ------ | --------------------------------- | ------------------------------ | ------------------------------ |
| GET    | `/compliance/report`              | Full compliance report         | fleet_manager, safety_officer  |
| GET    | `/compliance/expired-licenses`    | Drivers with expired licenses  | fleet_manager, safety_officer  |
| GET    | `/compliance/expiring-licenses`   | Licenses expiring soon         | fleet_manager, safety_officer  |
| GET    | `/compliance/low-safety-scores`   | Low safety score drivers       | fleet_manager, safety_officer  |

### Query Parameters (all list endpoints)

| Param    | Example               | Description                          |
| -------- | --------------------- | ------------------------------------ |
| `page`   | `?page=2`             | Page number (default: 1)             |
| `limit`  | `?limit=10`           | Results per page (default: 20, max: 100) |
| `sort`   | `?sort=-createdAt`    | Sort field; prefix `-` for descending |
| `search` | `?search=volvo`       | Case-insensitive text search         |
| `status` | `?status=Available`   | Filter by status                     |

---

## Role-Based Access Control

| Role                 | Permissions                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| **fleet_manager**    | Full access — vehicles, drivers, maintenance, expenses, analytics, compliance |
| **dispatcher**       | Trip lifecycle (create, dispatch, complete, cancel) + read all resources     |
| **safety_officer**   | Compliance reports, driver status changes + read all resources               |
| **financial_analyst**| Analytics dashboards, record expenses + read all resources                   |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fleetflow.git
cd fleetflow
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/fleetflow"
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
```

Push the schema to PostgreSQL and generate the Prisma client:

```bash
npx prisma db push
npx prisma generate
```

### 3. Frontend Setup

```bash
cd ../Frontend
npm install
```

### 4. Run the Application

Start both servers (in separate terminals):

```bash
# Terminal 1 — Backend (port 5000)
cd Backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd Frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Seeding the Database

Populate the database with realistic sample data:

```bash
cd Backend
node src/seed.js
```

This creates:

| Entity           | Count | Details                                    |
| ---------------- | ----- | ------------------------------------------ |
| Users            | 4     | One per role                               |
| Vehicles         | 10    | Various types and statuses                 |
| Drivers          | 9     | Various safety scores and performance      |
| Trips            | 12    | Mix of Draft, Dispatched, Completed, Cancelled |
| Maintenance Logs | 6     | Open + completed logs                      |
| Expenses         | 15    | Fuel, Toll, Misc types                     |

### Seed User Credentials

All passwords: `securePass123`

| Name              | Email                      | Role               |
| ----------------- | -------------------------- | ------------------ |
| John Admin        | admin@fleetflow.com        | fleet_manager      |
| Sarah Dispatcher  | dispatcher@fleetflow.com   | dispatcher         |
| Tom SafetyOfficer | safety@fleetflow.com       | safety_officer     |
| Lisa Analyst      | analyst@fleetflow.com      | financial_analyst  |

To clear all data without re-seeding:

```bash
node src/seed.js --clear
```

---

## Frontend Pages

| Page             | Route            | Description                                                  |
| ---------------- | ---------------- | ------------------------------------------------------------ |
| Login            | `/login`         | JWT authentication                                           |
| Register         | `/register`      | New user registration                                        |
| Dashboard        | `/`              | KPI cards, fleet status, recent trips, maintenance alerts    |
| Vehicles         | `/vehicles`      | CRUD table with filters, status management, vehicle retirement |
| Drivers          | `/drivers`       | CRUD table with safety scores, license tracking, performance |
| Trips            | `/trips`         | Trip lifecycle management with vehicle/driver selection       |
| Maintenance      | `/maintenance`   | Log maintenance, complete service, auto vehicle status       |
| Expenses         | `/expenses`      | Record fuel/toll/misc expenses per vehicle                   |
| Analytics        | `/analytics`     | Charts for revenue, costs, fleet utilization, vehicle ROI    |
| Compliance       | `/compliance`    | License expiry alerts, safety score monitoring               |

---

## Business Logic

### Trip Lifecycle

```
Draft ──▶ Dispatched ──▶ Completed
  │            │
  ▼            ▼
Cancelled   Cancelled
```

- **Create (Draft):** Validates vehicle availability, driver availability, license expiry, and cargo weight vs. vehicle capacity
- **Dispatch:** Sets vehicle & driver status to `OnTrip` (atomic transaction)
- **Complete:** Resets vehicle & driver to `Available`, adds trip distance to odometer
- **Cancel:** Releases vehicle & driver if dispatched; standalone if still draft

### Maintenance Auto-Status

- Creating a maintenance log sets the vehicle status to `InShop`
- Completing the last open log restores the vehicle to `Available`

### Cargo Weight Validation

Trips are rejected if `cargoWeight > vehicle.maxLoadCapacity`.

### License Expiry Enforcement

Dispatching a trip is blocked if the assigned driver's license has expired.

---

## Environment Variables

| Variable       | Description                          | Default                            |
| -------------- | ------------------------------------ | ---------------------------------- |
| `NODE_ENV`     | development / production             | `development`                      |
| `PORT`         | Backend server port                  | `5000`                             |
| `DATABASE_URL` | PostgreSQL connection string         | —                                  |
| `JWT_SECRET`   | Secret key for signing JWT tokens    | `fleetflow_dev_secret_...`         |
| `JWT_EXPIRE`   | Token expiration duration            | `7d`                               |

---

## Available Scripts

### Backend

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Start with nodemon (hot-reload)    |
| `npm start`           | Start in production mode           |
| `npm run seed`        | Seed the database                  |
| `npm run prisma:push` | Push schema to database            |
| `npm run prisma:generate` | Generate Prisma Client         |
| `npm run prisma:migrate`  | Run Prisma migrations          |
| `npm run prisma:studio`   | Open Prisma Studio GUI         |

### Frontend

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start Vite dev server (port 3000)  |
| `npm run build`     | Production build                   |
| `npm run preview`   | Preview production build           |

---

## License

ISC
