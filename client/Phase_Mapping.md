# Lmsify — Frontend to Backend Phase Mapping

This document maps the frontend implementation phases to the corresponding backend phases, ensuring feature parity and proper integration points.

## Phase Mapping

| FE Phase | BE Phase | Feature Area | Status |
|----------|----------|--------------|--------|
| FE-1 | N/A | Frontend Scaffold | ✅ Completed |
| FE-2 | BE-1, BE-2 | Authentication System | 🚧 Pending |
| FE-3 | BE-3, BE-4 | Course Management | 🚧 Pending |
| FE-4 | BE-8 | Payment Integration | 🚧 Pending |
| FE-5 | BE-5, BE-6 | User Dashboard | 🚧 Pending |
| FE-6 | BE-9 | Admin Panel | 🚧 Pending |
| FE-7 | N/A | Polish & Deployment | 🚧 Pending |

## Integration Points by Phase

### FE-2 ↔ BE-1, BE-2 (Authentication)
- **API Endpoints:**
  - `POST /api/v1/register`
  - `POST /api/v1/login`
  - `GET /api/v1/me`
  - `GET /api/v1/logout`
  - `PUT /api/v1/changepassword`
  - `POST /api/v1/auth/refresh`
- **Data Models:**
  - User schema (name, email, role)
  - Session management
  - Password hashing
- **Security:**
  - JWT access tokens (15 min)
  - HttpOnly refresh cookies (30 days)
  - Password validation and hashing
  - Session rotation and reuse detection

### FE-3 ↔ BE-3, BE-4 (Course Management)
- **API Endpoints:**
  - `GET /api/v1/courses`
  - `GET /api/v1/course/:id`
  - `POST /api/v1/course/createcourse` (admin)
  - `PUT /api/v1/course/:id` (admin)
  - `DELETE /api/v1/course/:id` (admin)
  - `POST /api/v1/course/:id` (lectures - admin)
  - `DELETE /api/v1/course/:id/lecture/:lectureId` (admin)
- **Data Models:**
  - Course schema (title, description, price, etc.)
  - Lecture schema (title, description, video)
  - User course enrollment
- **Features:**
  - Course listing and search
  - Course detail view
  - Lecture playback
  - Access control for purchased courses

### FE-4 ↔ BE-8 (Payment Integration)
- **API Endpoints:**
  - `POST /api/v1/payment/create-order`
  - `POST /api/v1/payment/verify`
  - `POST /api/v1/payment/webhook`
- **Data Models:**
  - Payment schema (user, course, amount, status)
  - User purchased courses
- **Features:**
  - Razorpay checkout integration
  - Payment verification
  - Webhook handling
  - Course access granting

### FE-5 ↔ BE-5, BE-6 (User Dashboard)
- **API Endpoints:**
  - `PUT /api/v1/user/updateprofile`
  - `PUT /api/v1/user/updateprofilepicture`
  - `POST /api/v1/addtoplaylist`
  - `DELETE /api/v1/removefromplaylist`
- **Data Models:**
  - User playlist
  - User profile updates
  - Profile picture management
- **Features:**
  - Profile management
  - Playlist management
  - Watch history
  - Progress tracking

### FE-6 ↔ BE-9 (Admin Panel)
- **API Endpoints:**
  - `GET /api/v1/admin/users`
  - `GET /api/v1/admin/stats`
  - `DELETE /api/v1/admin/user/:id`
- **Data Models:**
  - User management
  - System statistics
  - Course management
- **Features:**
  - User management dashboard
  - System statistics
  - Course management
  - Admin controls

## Shared Components and Utilities

### Authentication
- **BE:** `src/controllers/authController.ts`, `src/middlewares/auth.ts`
- **FE:** `src/stores/authStore.ts`, `src/api/client.ts`, `src/features/auth/`

### API Communication
- **BE:** `src/app.ts` (CORS, error handling), `src/middlewares/error.ts`
- **FE:** `src/api/client.ts` (axios interceptors), `src/api/schemas/`

### File Handling
- **BE:** `src/config/r2.ts`, `src/middlewares/upload.ts`
- **FE:** Components will use presigned URLs from BE

### Validation
- **BE:** Zod schemas in `src/schemas/`
- **FE:** Zod schemas in `src/api/schemas/` (copied from BE)

## Environment Variables

### Shared
- `FRONTEND_URL` - Used by BE for CORS
- `API_BASE_URL` - Used by FE for API calls

### BE-Specific
- Database connections
- Redis configuration
- R2 credentials
- Razorpay keys
- JWT secrets

### FE-Specific
- `VITE_API_URL` - API base URL for development
- Feature flags
- Analytics keys

## Testing Strategy Alignment

### Unit Testing
- **BE:** Jest for controllers, services, models
- **FE:** Vitest for components, hooks, utilities

### Integration Testing
- **BE:** Supertest for API endpoints
- **FE:** React Testing Library for component integration

### E2E Testing
- **Both:** Cypress/Playwright for full user flows
- Focus on critical paths: Auth → Course Browse → Purchase → View Content

## Deployment Coordination

### Development
- Both FE and BE run on localhost
- CORS configured for cross-origin requests
- Shared `.env` files for consistent configuration

### Production
- FE: Static hosting (Vercel, Netlify, S3)
- BE: Container deployment (Docker, ECS, Kubernetes)
- Shared domain with path-based routing or subdomain separation
- SSL termination at CDN/load balancer level

## Version Compatibility

This mapping assumes:
- Latest stable versions of all dependencies
- Compatible API contracts between FE and BE
- Shared understanding of data models and validation schemas
- Coordinated releases for feature parity