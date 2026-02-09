# Femtech VIP - Premium Loyalty Program

A comprehensive loyalty management system designed for femtech businesses to enhance customer retention and engagement through an amount-based reward system with tiered benefits.

## 🌟 Features

- **Customer Management**: Add, update, and manage customer profiles
- **Amount-Based Rewards**: Track and award loyalty benefits based on purchase amounts
- **Tier System**: Multiple loyalty tiers with increasing benefits
- **Transaction History**: Detailed records of all customer transactions and spending
- **Customer Portal**: Self-service portal for customers to view their rewards
- **Admin Dashboard**: Comprehensive management interface for administrators
- **Secure Authentication**: Separate login systems for admins and customers
- **Leaderboard**: View top customers based on spending
- **Notifications**: System for sending notifications to customers

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Database**: PostgreSQL (Vercel Postgres)
- **UI Components**: Radix UI Primitives + Custom Shadcn UI components
- **Icons**: Lucide React
- **Authentication**: Custom session-based authentication with secure password hashing
- **Deployment**: Vercel (with analytics integration)

## 📁 Project Structure

```
loyalty-management-platform/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin-specific routes
│   ├── api/               # API routes
│   ├── customer/          # Customer portal routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # Reusable React components
│   ├── ui/                # Shadcn UI components
│   └── *.tsx              # Custom components
├── lib/                   # Business logic and utilities
│   ├── db.ts              # Database operations
│   ├── auth.ts            # Authentication logic
│   └── utils.ts           # Utility functions
├── middleware.ts          # Route protection middleware
└── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn
- PostgreSQL database (Vercel Postgres recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd loyalty-management-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then update `.env.local` with your database connection string and other configurations.

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Authentication

The platform implements a dual authentication system:

- **Admin Authentication**: Secure login for administrators to manage the platform
- **Customer Authentication**: Phone-based login for customers to access their rewards

Both systems use secure password hashing (PBKDF2) and session management with automatic expiration.

## 🗃️ Database Schema

The application uses PostgreSQL with the following main tables:

- `customers`: Stores customer information
- `transactions`: Records all customer transactions
- `tiers`: Defines loyalty tiers with minimum spending requirements
- `tier_benefits`: Associates benefits with each tier
- `admin_users`: Stores administrator accounts
- `admin_sessions`: Manages admin user sessions
- `customer_sessions`: Manages customer user sessions

## 🏗️ API Routes

The application provides RESTful API endpoints organized in the `/app/api` directory:

- `/api/customers`: Manage customer data
- `/api/transactions`: Handle customer transaction records
- `/api/tiers`: Manage loyalty tiers
- `/api/auth`: Authentication endpoints
- `/api/notifications`: Send and manage notifications
- `/api/init`: Initialize the system (if needed)

## 🎨 UI Components

The UI is built using:

- **Shadcn UI**: Pre-built accessible components
- **Radix UI**: Low-level primitives for maximum flexibility
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Beautiful icon library

Custom components include:
- Dashboard with statistics overview
- Customer management interface
- Transaction panels
- Tier editor with benefit management
- Customer leaderboard
- Notification center

## 🧪 Testing

To run tests (if available):
```bash
pnpm test
```

## 🚢 Deployment

The application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in the Vercel dashboard
3. Deploy automatically on pushes to main branch

The `vercel.json` file contains the necessary configuration for deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ for the femtech community