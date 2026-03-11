# Inventory Management System

A full-stack inventory management web app built for a clothing brand. Features real-time sales tracking, barcode generation and scanning, role-based access control, and an analytics dashboard.

**Live Demo:** [inventoryapp-psi-nine.vercel.app](https://inventoryapp-psi-nine.vercel.app)

---

## Features

- **Authentication** — Secure login with admin and staff roles
- **Products Management** — Add, edit, delete and search products with categories, pricing and discounts
- **Barcode Generator** — Generate and print CODE128 barcodes for any product
- **Barcode Scanner** — Camera-based barcode scanning or manual SKU entry to look up and sell products
- **Sales Recording** — Every sale is recorded in real time with product details, price and staff info
- **Analytics Dashboard** — Live revenue tracking, sales graphs (7/30/90 days), low stock alerts and daily sales records
- **Staff Activity Log** — Track every sale made by each staff member with filters by date and staff
- **Manage Staff** — Admin can add staff accounts with role-based permissions and preview staff access
- **Role Based Access** — Admin sees everything, staff only sees products, barcode generator and scan page
- **Mobile Responsive** — Works on any device, installable as a PWA

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth) |
| Charts | Recharts |
| Barcode | JsBarcode, html5-qrcode |
| Deployment | Vercel |
| Version Control | GitHub |

---

## Pages

- **Dashboard** — Revenue stats, sales graph, low stock alerts, daily sales record
- **Products** — Full product catalog with search and category filter
- **Barcode Generator** — Select product and generate printable barcode
- **Scan Product** — Scan barcode or enter SKU manually to sell items
- **Staff Activity** — Admin view of all staff sales with filters
- **Manage Staff** — Add/remove staff, assign roles, preview staff access

---

## Database Schema

```
products    → id, name, category, price, stock, discount, sku
sales       → id, product_id, product_name, sku, category, original_price, discount, final_price, sold_by
profiles    → id, email, full_name
user_roles  → id, user_id, role
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- Supabase account

### Installation

```bash
# Clone the repo
git clone https://github.com/Aimansadaf/Inventory-management-app.git

# Navigate to project
cd Inventory-management-app

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Run Locally

```bash
npm run dev
```

App runs at `http://localhost:8080`

---

## Demo Credentials

```
Admin
Email: admin@store.com
Password: Store1234

Staff
Email: (create via Manage Staff page)
```

---

## Project Structure

```
src/
  components/       # Reusable UI components
  hooks/            # Auth and data hooks
  pages/            # App pages
    Dashboard.tsx       # Analytics dashboard
    Products.tsx        # Product catalog
    BarcodePage.tsx     # Barcode generator
    ScanPage.tsx        # Barcode scanner + sell
    StaffActivity.tsx   # Staff activity log
    ManageStaff.tsx     # Staff management
  integrations/     # Supabase client
  lib/              # Utilities
```

---

## Role Based Access

| Feature | Admin | Staff |
|---|---|---|
| Dashboard | Yes | No |
| View Products | Yes | Yes |
| Add/Edit/Delete Products | Yes | No |
| Barcode Generator | Yes | Yes |
| Scan and Sell | Yes | Yes |
| Staff Activity | Yes | No |
| Manage Staff | Yes | No |

---

## Deployment

This app is deployed on Vercel with automatic deployments on every push to the main branch. Database is hosted on Supabase (PostgreSQL).

---

## Built By

**Aiman Sadaf** — [GitHub](https://github.com/Aimansadaf)

First full stack deployed project — built end to end with React, Supabase and Vercel.
