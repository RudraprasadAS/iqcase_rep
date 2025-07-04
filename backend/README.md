# Case Management Backend (NestJS)

This is the NestJS backend for the Case Management System. It provides REST APIs to replace direct Supabase calls from the frontend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase project (already configured)

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your Supabase configuration:
```env
SUPABASE_URL=https://nytxdkvpgbvndtbvcvxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your-jwt-secret-key
PORT=3001
```

3. **Start the development server:**
```bash
npm run start:dev
```

The backend will be available at:
- **API**: http://localhost:3001/api
- **Documentation**: http://localhost:3001/api/docs

## 📚 API Documentation

### Swagger/OpenAPI
Visit http://localhost:3001/api/docs for interactive API documentation.

### Available Endpoints

#### 🔔 Notifications (`/api/notifications`)
- `GET /` - Get all notifications for current user
- `GET /unread-count` - Get unread notifications count
- `PATCH /:id/read` - Mark notification as read
- `PATCH /mark-all-read` - Mark all notifications as read
- `DELETE /:id` - Delete notification
- `POST /task-assignment` - Create task assignment notification
- `POST /case-assignment` - Create case assignment notification
- `POST /activity-notification` - Notify relevant users about case activity

#### 🔐 Permissions (`/api/permissions`)
- `GET /check` - Check single permission
- `POST /bulk-check` - Check multiple permissions at once

#### 👥 Users (`/api/users`)
- `GET /me` - Get current user info
- `GET /` - Get all users
- `GET /:id` - Get user by ID

#### 📝 Audit (`/api/audit`)
- `POST /case-activity` - Log case activity
- `POST /case-created` - Log case creation
- `POST /message-added` - Log message addition
- `POST /task-created` - Log task creation

#### 🔑 Auth (`/api/auth`)
- `GET /me` - Get current user
- `GET /user-info` - Get detailed user info

## 🏗️ Architecture

### Module Structure
```
src/
├── modules/
│   ├── auth/          # JWT authentication & user validation
│   ├── users/         # User management
│   ├── permissions/   # RBAC & access control
│   ├── notifications/ # Notification system
│   └── audit/         # Activity logging
├── common/
│   └── supabase/      # Supabase service wrapper
└── main.ts           # Application bootstrap
```

### Key Features
- **JWT Authentication**: Validates Supabase auth tokens
- **Role-Based Access Control**: Centralized permission checking
- **Activity Logging**: Comprehensive audit trail
- **Notification System**: Real-time user notifications
- **Type Safety**: Full TypeScript support with DTOs
- **API Documentation**: Auto-generated Swagger docs

## 🔄 Migration Progress

### ✅ Completed Modules
- [x] **Notifications** - Full CRUD + business logic
- [x] **Permissions** - Permission checking system
- [x] **Users** - User info and management
- [x] **Audit** - Activity logging
- [x] **Auth** - JWT validation with Supabase

### 🚧 Next Steps
- [ ] **Cases Module** - Core case management logic
- [ ] **Reports Module** - Report generation and queries
- [ ] **Dashboard Module** - Dashboard widgets and data
- [ ] **Tasks Module** - Task management
- [ ] **Messages Module** - Case messaging system

## 🔧 Frontend Integration

### Replace Frontend Hooks
Replace existing hooks with API-based versions:

```typescript
// OLD: Direct Supabase
import { useNotifications } from '@/hooks/useNotifications';

// NEW: API-based
import { useNotificationsApi } from '@/hooks/useNotificationsApi';
```

### API Service
Use the centralized API service:

```typescript
import { apiService } from '@/services/api';

// Create notification
await apiService.createTaskAssignmentNotification({
  assignedUserId: 'user-id',
  taskName: 'Complete review',
  caseId: 'case-id',
  createdByUserId: 'creator-id'
});

// Check permission
const result = await apiService.checkPermission('cases.edit_case', 'edit');
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Development

### Adding New Modules
1. Generate module: `nest g module modules/example`
2. Generate service: `nest g service modules/example`
3. Generate controller: `nest g controller modules/example`
4. Add to `app.module.ts`

### Code Style
- Use TypeScript strict mode
- Follow NestJS conventions
- Add Swagger decorators for documentation
- Include proper error handling and logging

## 🚀 Deployment

The backend is designed to be deployed alongside your existing Supabase setup. It acts as a business logic layer while still using Supabase for data storage and authentication.