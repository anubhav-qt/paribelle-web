# Marketplace - Full-Stack Multi-Vendor E-Commerce Platform

A modern, scalable multi-vendor marketplace built with Next.js, NestJS, and React Native. This platform enables multiple vendors to sell their products while providing customers with a unified shopping experience.

## 🎯 Project Goals

- **Multi-Vendor Support**: Enable unlimited vendors to create stores and manage products independently
- **Unified Customer Experience**: Single platform for customers to browse and purchase from multiple vendors
- **Scalable Architecture**: Monorepo structure with shared packages for consistency and maintainability
- **Cross-Platform**: Web and mobile applications sharing the same backend API
- **Modern Tech Stack**: Leveraging latest technologies for performance and developer experience
- **Secure & Reliable**: Industry-standard authentication, authorization, and payment processing

## ✨ Features

### 🔐 Authentication & Authorization
- [x] Email/Password authentication with JWT tokens
- [x] Google OAuth 2.0 social login
- [x] Secure password hashing with bcrypt
- [x] Role-based access control (Customer, Vendor, Admin)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] Session management across devices

### 👥 User Management
- [x] User registration and login
- [x] User profile management
- [ ] Address book management
- [ ] Order history
- [ ] Wishlist functionality
- [ ] User reviews and ratings

### 🏪 Vendor Management
- [ ] Vendor registration and onboarding
- [ ] Vendor dashboard
- [ ] Product catalog management
- [ ] Inventory tracking
- [ ] Order fulfillment system
- [ ] Vendor analytics and reports
- [ ] Store customization (logo, banner, description)
- [ ] Multi-warehouse support

### 📦 Product Management
- [ ] Product creation with rich descriptions
- [ ] Multiple product images and videos
- [ ] Product categories and subcategories
- [ ] Product variants (size, color, etc.)
- [ ] Stock management and alerts
- [ ] Product search with filters
- [ ] Advanced search with Elasticsearch
- [ ] Product recommendations

### 🛒 Shopping Experience
- [ ] Shopping cart functionality
- [ ] Guest checkout
- [ ] Multiple payment methods (Stripe, PayPal, etc.)
- [ ] Shipping calculator
- [ ] Order tracking
- [ ] Invoice generation
- [ ] Discount codes and coupons
- [ ] Flash sales and promotions

### 💬 Communication
- [ ] Customer support chat
- [ ] Vendor-customer messaging
- [ ] Email notifications (order updates, shipping, etc.)
- [ ] Push notifications (mobile app)
- [ ] Review and rating system

### 📊 Admin Dashboard
- [ ] Platform analytics and KPIs
- [ ] User management
- [ ] Vendor approval and management
- [ ] Category management
- [ ] Commission and fee management
- [ ] Platform settings and configuration
- [ ] Content management system (CMS)

### 🔍 Search & Discovery
- [ ] Full-text product search
- [ ] Advanced filtering (price, category, vendor, ratings)
- [ ] Sort options (price, popularity, newest)
- [ ] Recently viewed products
- [ ] Trending products
- [ ] Category browsing

### 📱 Mobile Application
- [ ] iOS and Android apps with React Native
- [ ] Native performance and UX
- [ ] Offline support
- [ ] Push notifications
- [ ] Biometric authentication

### 🚀 Performance & Scalability
- [ ] CDN integration for static assets
- [ ] Image optimization and lazy loading
- [ ] Database query optimization
- [ ] Caching layer (Redis)
- [ ] API rate limiting
- [ ] Horizontal scaling support

### 🔒 Security
- [x] JWT-based authentication
- [x] Password hashing (bcrypt)
- [x] HTTPS enforcement
- [x] SQL injection prevention (ORM)
- [x] XSS protection
- [x] CSRF protection
- [x] Input validation and sanitization
- [x] Security headers (Helmet.js)

## 🏗️ Project Structure

```
marketplace/
├── apps/
│   ├── backend/          # NestJS API server (Port 3001)
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   │   ├── auth/           # Authentication
│   │   │   │   ├── users/          # User management
│   │   │   │   ├── vendors/        # Vendor management
│   │   │   │   ├── products/       # Product catalog
│   │   │   │   ├── orders/         # Order processing
│   │   │   │   ├── payments/       # Payment handling
│   │   │   │   ├── categories/     # Categories
│   │   │   │   ├── reviews/        # Reviews & ratings
│   │   │   │   ├── notifications/  # Notifications
│   │   │   │   ├── analytics/      # Analytics
│   │   │   │   ├── admin/          # Admin features
│   │   │   │   └── promotions/     # Promotions
│   │   │   ├── common/   # Shared utilities
│   │   │   └── config/   # Configuration
│   │   ├── ecosystem.config.js  # PM2 config
│   │   └── tsconfig.json
│   │
│   ├── web/              # Next.js web application (Port 3000)
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   │   ├── login/           # Login page
│   │   │   │   ├── signup/          # Sign up page
│   │   │   │   └── api/             # API routes
│   │   │   │       └── auth/        # Auth endpoints
│   │   │   ├── components/ # Reusable components
│   │   │   └── lib/      # Utilities and helpers
│   │   ├── public/       # Static assets
│   │   └── next.config.js
│   │
│   └── mobile/           # React Native mobile app
│       ├── app/          # Expo router
│       │   ├── (tabs)/   # Tab navigation
│       │   │   ├── index.tsx      # Home
│       │   │   ├── search.tsx     # Search
│       │   │   ├── cart.tsx       # Cart
│       │   │   └── profile.tsx    # Profile
│       │   └── _layout.tsx
│       ├── lib/          # API client
│       └── app.json      # Expo config
│
├── packages/             # Shared packages (future)
│   ├── ui/              # Shared UI components
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Shared utilities
│
├── docs/                # Documentation
│   ├── api.md              # API documentation
│   ├── database.md         # Database schema
│   ├── deployment.md       # Deployment guide
│   ├── getting-started.md  # Getting started
│   ├── payments.md         # Payment integration
│   ├── roadmap.md          # Project roadmap
│   └── vendor-onboarding.md # Vendor guide
│
└── scripts/            # Automation scripts
    ├── install-all.ps1      # Install dependencies
    ├── start-dev.ps1        # Start dev servers
    ├── stop-all.ps1         # Stop all services
    ├── restart-services.ps1 # Restart services
    ├── create-database.ps1  # Database setup
    └── fix-permissions.ps1  # Fix permissions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git
- Windows PowerShell (for scripts)

### 1. Clone Repository
```bash
git clone https://gitlab.com/ajaniljoshijobs/marketplace.git
cd marketplace
```

### 2. Install Dependencies
```powershell
.\install-all.ps1
```

### 3. Setup Environment Variables

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/marketplace"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS="http://localhost:3000"
```

**Web** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### 4. Setup Database
```powershell
# Option 1: Use automated script
.\create-database.ps1

# Option 2: Manual setup
cd apps/backend
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 5. Start Development Servers
```powershell
.\start-dev.ps1
```

Access:
- **Web App**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs

### 6. Stop Services
```powershell
.\stop-all.ps1
```

## 🛠️ Tech Stack

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (planned)
- **Data Fetching**: Native fetch / TanStack Query (planned)
- **Forms**: React Hook Form (planned)
- **Validation**: Zod (planned)
- **Icons**: Lucide React

### Backend (API)
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM
- **Authentication**: Passport.js + JWT
- **Password Hashing**: bcrypt
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet.js
- **Compression**: compression middleware
- **Process Management**: PM2

### Mobile
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Language**: TypeScript
- **State Management**: Zustand (planned)

### Database Schema
- **Users**: Authentication and profiles
- **Vendors**: Vendor information and stores
- **Products**: Product catalog
- **Categories**: Product categorization
- **Orders**: Order management
- **Order Items**: Individual order items
- **Payments**: Payment transactions
- **Reviews**: Product reviews and ratings

### DevOps & Tools
- **Monorepo**: npm workspaces
- **Version Control**: Git + GitLab
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest (planned), Playwright (planned)
- **CI/CD**: GitLab CI (planned)
- **Deployment**: Docker, AWS (planned)

## 📝 Development Scripts

### PowerShell Scripts (Windows)
- `.\install-all.ps1` - Install all dependencies across workspace
- `.\start-dev.ps1` - Start backend and web in development mode
- `.\stop-all.ps1` - Stop all running services
- `.\restart-services.ps1` - Restart all services
- `.\create-database.ps1` - Setup database and run migrations
- `.\fix-permissions.ps1` - Fix file permissions

### Manual Commands

**Backend:**
```bash
cd apps/backend
npm run start:dev    # Development with hot reload
npm run build        # Production build
npm run start:prod   # Production server
npm run test         # Run tests
npm run lint         # Lint code
```

**Web:**
```bash
cd apps/web
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Lint code
```

**Mobile:**
```bash
cd apps/mobile
npm run start        # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
```

## 🔐 Authentication Flow

### Email/Password Login
1. User enters credentials on `/login`
2. Frontend sends POST to `/api/auth/login`
3. Backend validates credentials using LocalAuthGuard
4. Backend returns JWT token and user data
5. Frontend stores token in localStorage
6. Subsequent requests include token in Authorization header

### Email/Password Registration
1. User fills form on `/signup`
2. Frontend sends POST to `/api/auth/signup`
3. Backend validates data and checks for existing user
4. Backend hashes password with bcrypt
5. Backend creates user in database
6. Backend returns JWT token
7. Frontend stores token and redirects

### Google OAuth Login
1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/google`
3. Backend redirects to Google OAuth consent screen
4. User authorizes the application
5. Google redirects to `/api/auth/google/callback?code=xxx`
6. Frontend exchanges authorization code for access token
7. Frontend fetches user info from Google
8. Frontend sends user data to backend `/api/v1/auth/google-login`
9. Backend finds or creates user account
10. Backend returns JWT token
11. Frontend stores token in localStorage via URL parameter
12. User redirected to homepage

### Token Storage & Usage
- **Storage**: localStorage (client-side) + HTTP-only cookies (backup)
- **Format**: JWT with user email, ID, and role
- **Expiration**: 7 days
- **Usage**: Included in Authorization header: `Bearer <token>`
- **Cross-device**: Each device gets its own token after login

## 📚 API Documentation

Interactive API documentation available at:
- **Development**: http://localhost:3001/api/docs
- **Swagger UI**: Full endpoint documentation with try-it-out feature

### Main Endpoints

**Authentication:**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/google-login` - Login/register with Google

**Users:**
- `GET /api/v1/users` - Get all users (admin)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 🗄️ Database Schema

### Core Entities

**User**
- id (UUID, primary key)
- email (unique)
- password (hashed)
- firstName
- lastName
- phone
- role (customer, vendor, admin)
- status (active, inactive, suspended)
- avatar
- emailVerifiedAt
- phoneVerifiedAt
- lastLoginAt
- createdAt, updatedAt

**Vendor**
- id (UUID)
- userId (foreign key)
- storeName
- storeDescription
- logo
- banner
- status (pending, approved, rejected, suspended)
- Other vendor details

**Product**
- id (UUID)
- name
- description
- price
- compareAtPrice
- costPerItem
- sku
- barcode
- trackQuantity
- quantity
- status (draft, active, archived)
- Images and variants

**Order**
- id (UUID)
- userId
- orderNumber
- status (pending, confirmed, processing, shipped, delivered, cancelled)
- subtotal, tax, shipping, total
- Tracking and fulfillment info

See `docs/database.md` for complete schema details.

## 🚀 Deployment

### Backend (NestJS)
**Recommended Stack:**
- **Platform**: AWS EC2 or ECS with Docker
- **Database**: AWS RDS (PostgreSQL)
- **File Storage**: AWS S3 for uploads
- **Process Manager**: PM2 (already configured)

**Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-production-secret"
PORT=3001
ALLOWED_ORIGINS="https://yourdomain.com"
```

### Frontend (Next.js)
**Recommended Platforms:**
- **Vercel** (optimized for Next.js) - Easiest
- **AWS Amplify** - Good AWS integration
- **Netlify** - Simple deployment
- **Docker** - Full control

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

### Mobile App
- **iOS**: Apple App Store via TestFlight → Production
- **Android**: Google Play Store via Internal Testing → Production
- **Build**: Use EAS Build (Expo Application Services)

See `docs/deployment.md` for detailed deployment guide.

## 🗺️ Roadmap

### Phase 1: MVP (Current - In Progress)
- [x] Project structure and setup
- [x] Basic authentication (email/password)
- [x] Google OAuth integration
- [x] User registration and login
- [x] Backend API with NestJS
- [x] Frontend with Next.js
- [ ] Product listing and detail pages
- [ ] Shopping cart functionality
- [ ] Basic checkout process
- [ ] Order management

### Phase 2: Vendor Portal (Q1 2025)
- [ ] Vendor registration and approval workflow
- [ ] Vendor dashboard with analytics
- [ ] Product management (CRUD)
- [ ] Inventory management
- [ ] Order fulfillment for vendors
- [ ] Vendor settings and customization

### Phase 3: Enhanced Features (Q2 2025)
- [ ] Advanced search with filters
- [ ] Product reviews and ratings
- [ ] Payment gateway integration (Stripe)
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Multi-image upload for products
- [ ] Product variants (size, color)

### Phase 4: Mobile App (Q3 2025)
- [ ] React Native mobile app (iOS + Android)
- [ ] Push notifications
- [ ] Offline support
- [ ] Mobile-optimized checkout
- [ ] Biometric authentication

### Phase 5: Optimization & Scale (Q4 2025)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] CDN integration
- [ ] Caching layer (Redis)
- [ ] Analytics integration (Google Analytics, Mixpanel)
- [ ] A/B testing framework
- [ ] Monitoring and logging (Sentry, LogRocket)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Merge Request

### Coding Standards
- Use TypeScript for all new code
- Follow existing code style (ESLint + Prettier)
- Write unit tests for new features
- Update documentation as needed
- Follow conventional commits format

### Code Review Process
1. All code must be reviewed before merging
2. CI/CD checks must pass
3. Minimum 1 approval required
4. Squash and merge preferred

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Project Owner**: Ajanil Joshi (ajaniljoshi@gmail.com)
- **Backend Development**: [TBD]
- **Frontend Development**: [TBD]
- **Mobile Development**: [TBD]
- **UI/UX Design**: [TBD]

## 📞 Support

For support and questions:
- **Email**: ajaniljoshi@gmail.com
- **GitLab Issues**: [Create an issue](https://gitlab.com/ajaniljoshijobs/marketplace/-/issues)
- **Documentation**: See `docs/` folder

## 🙏 Acknowledgments

- **NestJS** - Excellent backend framework
- **Next.js** - Amazing React framework with great DX
- **Prisma/TypeORM** - Developer-friendly ORM
- **Tailwind CSS** - Utility-first CSS framework
- **Expo** - Simplifying React Native development
- All open-source contributors and maintainers

## 📊 Project Statistics

- **Lines of Code**: ~5,000+ (and growing)
- **Modules**: 12+ backend modules
- **Components**: 10+ React components
- **API Endpoints**: 15+ documented endpoints
- **Tech Stack**: 15+ technologies

---

**Development Status**: 🚧 Active Development  
**Current Version**: 0.1.0-alpha  
**Last Updated**: November 16, 2025  
**Next Milestone**: Product Management Module
