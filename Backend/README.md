# 🚛 FleetFlow – Modular Fleet & Logistics Management System

A production-grade RESTful API backend for managing fleet vehicles, drivers, trips, maintenance, fuel expenses, compliance, and analytics — built with **Node.js**, **Express.js**, and **MongoDB**.

FleetFlow replaces manual fleet logbooks with a centralized digital hub. It is designed as a **rule-driven system**, not just CRUD — every operation enforces real-world business constraints such as vehicle capacity limits, driver license validation, status lifecycle management, and automated maintenance workflows.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Authentication](#-authentication)
- [API Base URL](#-api-base-url)
- [API Endpoints](#-api-endpoints)
  - [Auth](#auth-endpoints)
  - [Vehicles](#vehicle-endpoints)
  - [Drivers](#driver-endpoints)
  - [Trips](#trip-endpoints)
  - [Maintenance](#maintenance-endpoints)
  - [Expenses](#expense-endpoints)
  - [Analytics](#analytics-endpoints)
  - [Compliance](#compliance-endpoints)
- [Business Rules & Validations](#-business-rules--validations)
- [Status System](#-status-system)
- [Error Handling](#-error-handling)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [Folder Structure](#-folder-structure)
- [Future Improvements](#-future-improvements)

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework & routing |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM — schema validation, indexing, population |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Password hashing (12 salt rounds) |
| **helmet** | Security headers |
| **cors** | Cross-origin resource sharing |
| **express-rate-limit** | API rate limiting (200 req / 15 min) |
| **express-mongo-sanitize** | NoSQL injection prevention |
| **morgan** | HTTP request logging (dev) |
| **dotenv** | Environment variable management |
| **nodemon** | Dev server with hot reload |

---

## ✨ Features

- **Authentication & Authorization** — JWT-based login, bcrypt password hashing, role-based access control (RBAC) with 4 roles
- **Vehicle Management** — Full CRUD, status tracking, retire workflow, unique license plate enforcement
- **Driver Management** — License expiry tracking, safety scores, performance analytics, status lifecycle
- **Trip Lifecycle Management** — Draft → Dispatched → Completed flow with full validation at every transition
- **Maintenance Logs** — Automatic vehicle status updates (→ In Shop / → Available), multi-log awareness
- **Fuel & Expense Tracking** — Per-vehicle cost breakdowns, aggregation by expense type
- **Analytics & Reports** — Fleet dashboard, vehicle ROI, fuel efficiency, utilization rates
- **Compliance & Safety** — Expired/expiring license detection, low safety score alerts, high mileage warnings
- **Business Rule Enforcement** — Cargo weight validation, availability checks, license expiry blocking, status transition guards
- **Pagination, Filtering & Sorting** — Built into every list endpoint

---

## 🔐 Authentication

FleetFlow uses **JSON Web Tokens (JWT)** for stateless authentication.

### How It Works

1. **Register** or **Login** to receive a JWT token
2. Include the token in the `Authorization` header of every subsequent request
3. The server verifies the token, extracts the user, and checks role permissions

### Authorization Header Format

```
Authorization: Bearer <your_jwt_token>
```

### Roles

| Role | Access |
|---|---|
| `fleet_manager` | Full access — vehicles, drivers, maintenance, analytics, compliance |
| `dispatcher` | Create and manage trips (dispatch, complete, cancel) |
| `safety_officer` | Compliance reports, driver status updates, safety management |
| `financial_analyst` | Analytics dashboards, expense tracking, ROI reports |

### Login Example

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fleetflow.com",
  "password": "securePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "John Admin",
      "email": "admin@fleetflow.com",
      "role": "fleet_manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🌐 API Base URL

```
http://localhost:5000/api
```

Health check:
```
GET /api/health
```

All list endpoints support these query parameters:

| Parameter | Example | Description |
|---|---|---|
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=10` | Items per page (default: 20, max: 100) |
| `sort` | `?sort=-createdAt,name` | Comma-separated fields, prefix `-` for descending |
| `search` | `?search=toyota` | Regex search across allowed filter fields |

---

## 📡 API Endpoints

### Auth Endpoints

#### `POST /api/auth/register`

Register a new user account.

| | |
|---|---|
| **Auth Required** | No |
| **Roles** | Public |

**Request Body:**
```json
{
  "name": "Sarah Manager",
  "email": "sarah@fleetflow.com",
  "password": "securePass123",
  "role": "fleet_manager"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Sarah Manager",
      "email": "sarah@fleetflow.com",
      "role": "fleet_manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### `POST /api/auth/login`

Authenticate and receive a JWT token.

| | |
|---|---|
| **Auth Required** | No |
| **Roles** | Public |

**Request Body:**
```json
{
  "email": "sarah@fleetflow.com",
  "password": "securePass123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Sarah Manager",
      "email": "sarah@fleetflow.com",
      "role": "fleet_manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Sarah Manager",
    "email": "sarah@fleetflow.com",
    "role": "fleet_manager"
  }
}
```

---

### Vehicle Endpoints

All vehicle routes require authentication. Write operations require `fleet_manager` role.

#### `GET /api/vehicles`

List all vehicles with pagination, filtering, and sorting.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |
| **Filters** | `status`, `name`, `model`, `licensePlate` |

**Example:** `GET /api/vehicles?status=Available&sort=-createdAt&page=1&limit=10`

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  },
  "data": [
    {
      "_id": "65b2c3d4e5f6a7b8c9d0e1f2",
      "name": "Volvo FH16",
      "model": "FH16 2024",
      "licensePlate": "ABC-1234",
      "maxLoadCapacity": 25000,
      "odometer": 45230,
      "acquisitionCost": 120000,
      "status": "Available",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-02-10T14:20:00.000Z"
    }
  ]
}
```

---

#### `POST /api/vehicles`

Create a new vehicle.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

**Request Body:**
```json
{
  "name": "Volvo FH16",
  "model": "FH16 2024",
  "licensePlate": "ABC-1234",
  "maxLoadCapacity": 25000,
  "odometer": 0,
  "acquisitionCost": 120000
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "_id": "65b2c3d4e5f6a7b8c9d0e1f2",
    "name": "Volvo FH16",
    "model": "FH16 2024",
    "licensePlate": "ABC-1234",
    "maxLoadCapacity": 25000,
    "odometer": 0,
    "acquisitionCost": 120000,
    "status": "Available",
    "createdAt": "2026-02-21T08:00:00.000Z",
    "updatedAt": "2026-02-21T08:00:00.000Z"
  }
}
```

---

#### `GET /api/vehicles/:id`

Get a single vehicle by ID.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |

---

#### `PUT /api/vehicles/:id`

Update a vehicle's details.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

**Request Body** (partial update allowed):
```json
{
  "name": "Volvo FH16 Updated",
  "maxLoadCapacity": 28000
}
```

---

#### `DELETE /api/vehicles/:id`

Delete a vehicle. Cannot delete a vehicle currently On Trip.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

---

#### `PATCH /api/vehicles/:id/retire`

Retire a vehicle permanently. Only `fleet_manager` can retire vehicles.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Vehicle retired successfully",
  "data": {
    "_id": "65b2c3d4e5f6a7b8c9d0e1f2",
    "name": "Volvo FH16",
    "licensePlate": "ABC-1234",
    "status": "Retired"
  }
}
```

---

#### `PATCH /api/vehicles/:id/status`

Manually update a vehicle's status.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

**Request Body:**
```json
{
  "status": "Out of Service"
}
```

---

### Driver Endpoints

All driver routes require authentication.

#### `GET /api/drivers`

List all drivers with pagination and filtering.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |
| **Filters** | `status`, `name`, `email`, `licenseCategory` |

---

#### `POST /api/drivers`

Create a new driver.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

**Request Body:**
```json
{
  "name": "Mike Johnson",
  "email": "mike@fleetflow.com",
  "phone": "+1-555-0123",
  "licenseNumber": "DL-2024-78901",
  "licenseExpiryDate": "2027-06-15",
  "licenseCategory": "Class A CDL",
  "safetyScore": 95
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "_id": "65c3d4e5f6a7b8c9d0e1f2a3",
    "name": "Mike Johnson",
    "email": "mike@fleetflow.com",
    "phone": "+1-555-0123",
    "licenseNumber": "DL-2024-78901",
    "licenseExpiryDate": "2027-06-15T00:00:00.000Z",
    "licenseCategory": "Class A CDL",
    "safetyScore": 95,
    "status": "Available",
    "isLicenseExpired": false,
    "createdAt": "2026-02-21T08:00:00.000Z",
    "updatedAt": "2026-02-21T08:00:00.000Z"
  }
}
```

---

#### `GET /api/drivers/:id`

Get a single driver by ID.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |

---

#### `PUT /api/drivers/:id`

Update driver details. Cannot update a driver currently On Trip.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

---

#### `PATCH /api/drivers/:id/status`

Update a driver's status manually.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager`, `safety_officer` |

**Request Body:**
```json
{
  "status": "Suspended"
}
```

---

#### `GET /api/drivers/:id/performance`

Get driver performance analytics.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "driver": {
      "_id": "65c3d4e5f6a7b8c9d0e1f2a3",
      "name": "Mike Johnson",
      "safetyScore": 95,
      "status": "Available",
      "isLicenseExpired": false
    },
    "performance": {
      "totalTrips": 48,
      "completedTrips": 45,
      "cancelledTrips": 2,
      "completionRate": "93.8",
      "totalDistanceKm": 12450,
      "totalRevenue": 87500
    }
  }
}
```

---

### Trip Endpoints

All trip routes require authentication. Create/dispatch/complete/cancel require `dispatcher` role.

#### `GET /api/trips`

List all trips. Populates vehicle and driver details.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |
| **Filters** | `status`, `vehicle`, `driver`, `origin`, `destination` |

---

#### `POST /api/trips`

Create a new trip in **Draft** status. All business rules are validated before creation.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `dispatcher` |

**Request Body:**
```json
{
  "vehicle": "65b2c3d4e5f6a7b8c9d0e1f2",
  "driver": "65c3d4e5f6a7b8c9d0e1f2a3",
  "cargoWeight": 15000,
  "origin": "Chicago, IL",
  "destination": "Detroit, MI",
  "distanceKm": 450,
  "revenue": 3200
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Trip created in Draft status",
  "data": {
    "_id": "65d4e5f6a7b8c9d0e1f2a3b4",
    "vehicle": {
      "_id": "65b2c3d4e5f6a7b8c9d0e1f2",
      "name": "Volvo FH16",
      "licensePlate": "ABC-1234",
      "maxLoadCapacity": 25000
    },
    "driver": {
      "_id": "65c3d4e5f6a7b8c9d0e1f2a3",
      "name": "Mike Johnson",
      "email": "mike@fleetflow.com"
    },
    "cargoWeight": 15000,
    "origin": "Chicago, IL",
    "destination": "Detroit, MI",
    "distanceKm": 450,
    "revenue": 3200,
    "status": "Draft",
    "createdAt": "2026-02-21T09:00:00.000Z"
  }
}
```

---

#### `GET /api/trips/:id`

Get a single trip with populated vehicle and driver.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |

---

#### `PATCH /api/trips/:id/dispatch`

Dispatch a Draft trip. Sets vehicle & driver to **On Trip**.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `dispatcher` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Trip dispatched successfully",
  "data": {
    "_id": "65d4e5f6a7b8c9d0e1f2a3b4",
    "status": "Dispatched",
    "dispatchedAt": "2026-02-21T09:15:00.000Z",
    "vehicle": { "name": "Volvo FH16", "licensePlate": "ABC-1234", "status": "On Trip" },
    "driver": { "name": "Mike Johnson", "email": "mike@fleetflow.com", "status": "On Trip" }
  }
}
```

---

#### `PATCH /api/trips/:id/complete`

Complete a dispatched trip. Updates vehicle odometer, restores vehicle & driver to **Available**.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `dispatcher` |

---

#### `PATCH /api/trips/:id/cancel`

Cancel a Draft or Dispatched trip. If Dispatched, restores vehicle & driver to **Available**.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `dispatcher` |

---

### Maintenance Endpoints

All routes require authentication.

#### `GET /api/maintenance`

List all maintenance logs.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |
| **Filters** | `vehicle`, `type`, `isCompleted` |

---

#### `POST /api/maintenance`

Create a maintenance log. **Automatically sets vehicle status to In Shop.**

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

**Request Body:**
```json
{
  "vehicle": "65b2c3d4e5f6a7b8c9d0e1f2",
  "type": "Engine Overhaul",
  "cost": 4500,
  "date": "2026-02-21",
  "notes": "Scheduled 50k km engine service"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Maintenance log created. Vehicle set to In Shop.",
  "data": {
    "_id": "65e5f6a7b8c9d0e1f2a3b4c5",
    "vehicle": { "_id": "65b2c3...", "name": "Volvo FH16", "licensePlate": "ABC-1234", "status": "In Shop" },
    "type": "Engine Overhaul",
    "cost": 4500,
    "date": "2026-02-21T00:00:00.000Z",
    "notes": "Scheduled 50k km engine service",
    "isCompleted": false,
    "createdAt": "2026-02-21T10:00:00.000Z"
  }
}
```

---

#### `PATCH /api/maintenance/:id/complete`

Mark maintenance as complete. Vehicle returns to **Available** only when **all** open logs for that vehicle are completed.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager` |

---

### Expense Endpoints

All routes require authentication.

#### `GET /api/expenses`

List all expenses.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |
| **Filters** | `vehicle`, `type` |

---

#### `POST /api/expenses`

Record a new expense.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `fleet_manager`, `financial_analyst` |

**Request Body:**
```json
{
  "vehicle": "65b2c3d4e5f6a7b8c9d0e1f2",
  "liters": 120,
  "cost": 210.50,
  "date": "2026-02-20",
  "type": "Fuel"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Expense recorded successfully",
  "data": {
    "_id": "65f6a7b8c9d0e1f2a3b4c5d6",
    "vehicle": { "_id": "65b2c3...", "name": "Volvo FH16", "licensePlate": "ABC-1234" },
    "liters": 120,
    "cost": 210.50,
    "date": "2026-02-20T00:00:00.000Z",
    "type": "Fuel"
  }
}
```

---

#### `GET /api/expenses/vehicle/:vehicleId`

Get all expenses for a specific vehicle with aggregated cost summary.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | Any authenticated user |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "pagination": { "total": 12, "page": 1, "limit": 20, "pages": 1 },
  "data": [ "..." ],
  "summary": {
    "totalOperationalCost": 8750.25,
    "byType": [
      { "_id": "Fuel", "totalCost": 6200, "totalLiters": 3500, "count": 8 },
      { "_id": "Toll", "totalCost": 1550.25, "totalLiters": 0, "count": 3 },
      { "_id": "Misc", "totalCost": 1000, "totalLiters": 0, "count": 1 }
    ]
  }
}
```

---

### Analytics Endpoints

All analytics routes require `financial_analyst` or `fleet_manager` role.

#### `GET /api/analytics/dashboard`

Fleet-wide KPI dashboard.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `financial_analyst`, `fleet_manager` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "fleet": {
      "totalVehicles": 50,
      "activeFleetCount": 45,
      "availableVehicles": 30,
      "onTripVehicles": 12,
      "inShopVehicles": 3,
      "retiredVehicles": 5,
      "utilizationRate": "26.7%"
    },
    "drivers": {
      "totalDrivers": 40,
      "availableDrivers": 25
    },
    "trips": {
      "totalTrips": 320,
      "completedTrips": 285,
      "activeTrips": 12,
      "totalDistanceKm": 145000
    },
    "financials": {
      "totalRevenue": 875000,
      "totalExpenses": 234000,
      "totalMaintenanceCost": 89000,
      "netProfit": 552000
    }
  }
}
```

---

#### `GET /api/analytics/vehicle-roi/:vehicleId`

Calculate Return on Investment for a specific vehicle.

**Formula:** `ROI = (Revenue – Total Costs) / Acquisition Cost × 100`

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `financial_analyst`, `fleet_manager` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "vehicle": {
      "_id": "65b2c3d4e5f6a7b8c9d0e1f2",
      "name": "Volvo FH16",
      "licensePlate": "ABC-1234",
      "acquisitionCost": 120000,
      "odometer": 45230,
      "status": "Available"
    },
    "metrics": {
      "totalRevenue": 87500,
      "totalExpenses": 12300,
      "totalMaintenanceCost": 4500,
      "totalCosts": 16800,
      "netProfit": 70700,
      "roi": "58.92%",
      "tripCount": 45,
      "totalDistanceKm": 12450
    }
  }
}
```

---

#### `GET /api/analytics/fuel-efficiency/:vehicleId`

Fuel efficiency metrics for a specific vehicle.

**Formula:** `Fuel Efficiency = Total Distance (km) / Total Liters`

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `financial_analyst`, `fleet_manager` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "vehicle": {
      "_id": "65b2c3d4e5f6a7b8c9d0e1f2",
      "name": "Volvo FH16",
      "licensePlate": "ABC-1234",
      "odometer": 45230
    },
    "fuelMetrics": {
      "totalDistanceKm": 12450,
      "totalLiters": 3500,
      "totalFuelCost": 6200,
      "refuelCount": 28,
      "fuelEfficiencyKmPerLiter": "3.56 km/L",
      "costPerKm": "$0.50/km"
    }
  }
}
```

---

### Compliance Endpoints

All compliance routes require `safety_officer` or `fleet_manager` role.

#### `GET /api/compliance/report`

Full compliance report covering licenses, mileage, and safety.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `safety_officer`, `fleet_manager` |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "expiredLicenses": {
      "count": 2,
      "drivers": [
        { "_id": "65c3d4...", "name": "John Doe", "licenseExpiryDate": "2025-12-01T00:00:00.000Z", "status": "Available" }
      ]
    },
    "expiringLicensesNext30Days": {
      "count": 3,
      "drivers": [
        { "_id": "65c4e5...", "name": "Jane Smith", "licenseExpiryDate": "2026-03-10T00:00:00.000Z" }
      ]
    },
    "highMileageVehicles": {
      "count": 5,
      "vehicles": [
        { "_id": "65b2c3...", "name": "Freightliner Cascadia", "licensePlate": "XYZ-9999", "odometer": 152000 }
      ]
    },
    "lowSafetyScoreDrivers": {
      "count": 1,
      "drivers": [
        { "_id": "65c5f6...", "name": "Bob Wilson", "safetyScore": 35 }
      ]
    }
  }
}
```

---

#### `GET /api/compliance/expired-licenses`

Get all drivers with expired licenses.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `safety_officer`, `fleet_manager` |

---

#### `GET /api/compliance/expiring-licenses`

Get drivers whose licenses expire within N days.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `safety_officer`, `fleet_manager` |
| **Query Params** | `?days=30` (default: 30) |

---

#### `GET /api/compliance/low-safety-scores`

Get drivers with safety scores below a threshold.

| | |
|---|---|
| **Auth Required** | Yes |
| **Roles** | `safety_officer`, `fleet_manager` |
| **Query Params** | `?threshold=50` (default: 50) |

---

## 📋 Business Rules & Validations

### Trip Creation Rules

Before a trip can be created, ALL of the following must be true:

| Rule | Error if Violated |
|---|---|
| Vehicle must exist | `Vehicle not found` |
| Driver must exist | `Driver not found` |
| Vehicle status must be `Available` | `Vehicle is not available. Current status: {status}` |
| Driver status must be `Available` | `Driver is not available. Current status: {status}` |
| Driver license must not be expired | `Driver's license expired on {date}` |
| Cargo weight ≤ vehicle max capacity | `Cargo weight ({x} kg) exceeds vehicle max load capacity ({y} kg)` |

### Trip Dispatch Rules

- Trip must be in `Draft` status
- Vehicle & driver availability are **re-validated** at dispatch time
- Driver license expiry is **re-checked** at dispatch time
- On dispatch: Vehicle → `On Trip`, Driver → `On Trip`

### Trip Completion Rules

- Trip must be in `Dispatched` status
- Vehicle odometer is incremented by `distanceKm`
- Vehicle → `Available`, Driver → `Available`

### Trip Cancellation Rules

- Cannot cancel a `Completed` or already `Cancelled` trip
- If cancelling a `Dispatched` trip, vehicle & driver are restored to `Available`

### Vehicle Rules

| Rule | Description |
|---|---|
| Retired vehicles cannot be assigned | Prevents trip creation with retired vehicles |
| In Shop vehicles are unavailable | Cannot create trips with vehicles in maintenance |
| Cannot delete On Trip vehicles | Must complete/cancel trip first |
| Cannot retire On Trip vehicles | Must complete/cancel trip first |
| License plates are unique | Enforced at database level |

### Maintenance Rules

| Rule | Description |
|---|---|
| Creating a log → vehicle `In Shop` | Automatic status transition |
| Completing a log → check all logs | Vehicle returns to `Available` only when ALL open logs are completed |
| No maintenance for On Trip/Retired | Blocked by business logic |

### Driver Rules

| Rule | Description |
|---|---|
| Expired license blocks assignment | Cannot be assigned to trips |
| Suspended drivers unavailable | Cannot be assigned to trips |
| Cannot manually leave On Trip status | Must complete the trip through trip lifecycle |

---

## 🔄 Status System

### Vehicle Status

```
Available ──→ On Trip ──→ Available (trip completed)
    │              │
    ├──→ In Shop ──→ Available (maintenance completed)
    │
    ├──→ Out of Service
    │
    └──→ Retired (permanent, fleet_manager only)
```

| Status | Description |
|---|---|
| `Available` | Ready to be assigned to trips |
| `On Trip` | Currently assigned to an active dispatched trip |
| `In Shop` | Under maintenance |
| `Retired` | Permanently decommissioned |
| `Out of Service` | Temporarily unavailable |

### Driver Status

| Status | Description |
|---|---|
| `Available` | Ready to be assigned to trips |
| `On Trip` | Currently on a dispatched trip |
| `Off Duty` | Not currently working |
| `Suspended` | Cannot be assigned to any trip |

### Trip Status

```
Draft ──→ Dispatched ──→ Completed
  │           │
  └───────────┴──→ Cancelled
```

| Status | Description |
|---|---|
| `Draft` | Created but not yet dispatched |
| `Dispatched` | Trip is active, vehicle & driver are On Trip |
| `Completed` | Trip finished, odometer updated, resources freed |
| `Cancelled` | Trip cancelled, resources freed if was dispatched |

---

## ❌ Error Handling

All errors follow a consistent JSON format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "License plate is required. Max load capacity is required.",
  "errors": [
    "License plate is required",
    "Max load capacity is required"
  ]
}
```

### Business Logic Error (422)

```json
{
  "success": false,
  "message": "Cargo weight (30000 kg) exceeds vehicle max load capacity (25000 kg)"
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "message": "Authentication required. Please provide a valid token."
}
```

### Authorization Error (403)

```json
{
  "success": false,
  "message": "Role 'dispatcher' is not authorized to access this resource."
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Vehicle not found"
}
```

### Duplicate Key (409)

```json
{
  "success": false,
  "message": "Duplicate value for field: licensePlate"
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/fleetflow

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `5000` | Server port |
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Dev fallback | Secret key for signing JWT tokens |
| `JWT_EXPIRE` | No | `7d` | Token expiration duration |

---

## 🚀 Running the Project

### Prerequisites

- **Node.js** v16+ installed
- **MongoDB** running locally or a cloud MongoDB URI (e.g., MongoDB Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/fleetflow.git
cd fleetflow/Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:5000` with hot reload via nodemon.

### Start Production Server

```bash
npm start
```

### Verify Server

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "FleetFlow API is running",
  "timestamp": "2026-02-21T08:00:00.000Z"
}
```

---

## 📁 Folder Structure

```
Backend/
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json
└── src/
    ├── app.js                      # Express app — middleware, routes, error handler
    ├── server.js                   # Entry point — DB connection, process handlers
    │
    ├── config/
    │   ├── db.js                   # Mongoose connection setup
    │   └── constants.js            # Enums, roles, pagination defaults
    │
    ├── models/
    │   ├── User.js                 # Auth user — bcrypt, JWT methods
    │   ├── Vehicle.js              # Status enum, unique plate, indexes
    │   ├── Driver.js               # License expiry virtual, safety score
    │   ├── Trip.js                 # Vehicle/Driver refs, lifecycle timestamps
    │   ├── MaintenanceLog.js       # Completion tracking, vehicle ref
    │   └── Expense.js              # Fuel/Toll/Misc types
    │
    ├── controllers/
    │   ├── authController.js       # Register, login, getMe
    │   ├── vehicleController.js    # CRUD + retire + status management
    │   ├── driverController.js     # CRUD + status + performance stats
    │   ├── tripController.js       # Create, dispatch, complete, cancel
    │   ├── maintenanceController.js # Create (→ In Shop), complete (→ Available)
    │   ├── expenseController.js    # CRUD + per-vehicle aggregation
    │   ├── analyticsController.js  # Dashboard, ROI, fuel efficiency
    │   └── complianceController.js # Reports, license checks, safety alerts
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── vehicleRoutes.js
    │   ├── driverRoutes.js
    │   ├── tripRoutes.js
    │   ├── maintenanceRoutes.js
    │   ├── expenseRoutes.js
    │   ├── analyticsRoutes.js
    │   └── complianceRoutes.js
    │
    ├── middlewares/
    │   ├── auth.js                 # authenticateUser (JWT) + authorizeRoles (RBAC)
    │   └── errorHandler.js         # Centralized error processing
    │
    ├── services/
    │   ├── tripService.js          # Trip validation, dispatch, complete, cancel logic
    │   ├── analyticsService.js     # Dashboard KPIs, ROI, fuel efficiency calcs
    │   └── complianceService.js    # License expiry, safety score, mileage checks
    │
    └── utils/
        ├── AppError.js             # Custom error classes (400–422)
        ├── asyncHandler.js         # Async route wrapper (catch → next)
        ├── queryHelpers.js         # Pagination, filtering, sorting builder
        └── sendResponse.js         # Standardized JSON response helper
```

### Architecture Principles

- **Controllers** handle HTTP request/response only — no business logic
- **Services** contain all business rules, validations, and derived calculations
- **Models** define schema, validation, indexes, and instance methods
- **Middlewares** handle cross-cutting concerns (auth, errors)
- **Utils** provide reusable helpers shared across the application

---

## 🔮 Future Improvements

- [ ] **Refresh Tokens** — Implement token rotation with access + refresh token pairs
- [ ] **Geolocation Tracking** — Real-time GPS tracking with coordinates and ETA
- [ ] **WebSocket Notifications** — Live updates for trip status changes and alerts
- [ ] **File Uploads** — Vehicle images, driver documents, inspection reports
- [ ] **Automated Scheduling** — AI-based trip assignment and maintenance scheduling
- [ ] **Audit Logs** — Track all system changes with user attribution
- [ ] **Multi-tenancy** — Support multiple fleet companies on a single instance
- [ ] **PDF Report Generation** — Export analytics and compliance reports
- [ ] **Email Notifications** — License expiry warnings, maintenance reminders
- [ ] **Unit & Integration Tests** — Jest + Supertest test suite
- [ ] **API Documentation** — Swagger/OpenAPI spec generation
- [ ] **Docker Support** — Containerized deployment with docker-compose
- [ ] **CI/CD Pipeline** — GitHub Actions for automated testing and deployment

---

## 📄 License

ISC

---

Built with Node.js, Express, and MongoDB.
