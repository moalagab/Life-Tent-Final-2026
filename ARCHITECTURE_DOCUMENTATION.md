# Life Tent Application - Architecture Documentation

## Table of Contents
1. [Database Architecture](#database-architecture)
2. [API Routes & Data Flow](#api-routes--data-flow)
3. [Business Logic](#business-logic)
4. [Technology Stack](#technology-stack)

---

## Database Architecture

### Database Provider
- **Platform**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Row Level Security (RLS)
- **Real-time**: Supabase Real-time subscriptions

### Core Tables & Schema

#### 1. **Authentication & Profiles**
```
profiles
├── id (UUID, PK)
├── user_id (FK -> auth.users, unique)
├── full_name (TEXT)
├── avatar_url (TEXT)
├── preferred_language (TEXT, default: 'ar')
├── timezone (TEXT, default: 'Asia/Riyadh')
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```
- **RLS Policies**: Users can only view/edit their own profile
- **Auto-trigger**: Profile created automatically on user signup

#### 2. **Projects (PARA + PMP Framework)**
```
projects
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── title (TEXT)
├── description (TEXT)
├── status (ENUM: 'active', 'on_hold', 'completed', 'archived')
├── phase (ENUM: 'initiation', 'planning', 'execution', 'monitoring', 'closing')
├── para_category (ENUM: 'project', 'area', 'resource', 'archive')
├── color (TEXT)
├── due_date (DATE)
├── progress (INTEGER: 0-100)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```
- **RLS**: Full user isolation
- **Relations**: 1-to-many with tasks, goals, finance transactions

#### 3. **Tasks**
```
tasks
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── project_id (FK -> projects, nullable)
├── title (TEXT)
├── description (TEXT)
├── status (ENUM: 'backlog', 'todo', 'in_progress', 'review', 'done', 'archived')
├── priority (ENUM: 'low', 'medium', 'high', 'urgent')
├── due_date (DATE)
├── due_time (TIME)
├── completed_at (TIMESTAMPTZ)
├── blocked_by (FK -> tasks, self-reference)
├── recurrence (ENUM: 'none', 'daily', 'weekly', 'monthly', 'yearly')
├── is_focus (BOOLEAN, for focus/priority tasks)
├── position (INTEGER, for ordering)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```
- **Key Feature**: Support for recurring tasks and task dependencies
- **Focus Tasks**: Filtered subset for daily focus
- **Ordering**: Position-based for kanban/list views

#### 4. **Goals & Key Results (OKR Framework)**
```
goals
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── title (TEXT)
├── description (TEXT)
├── perspective (ENUM: 'financial', 'customer', 'processes', 'learning')
├── target_value (DECIMAL)
├── current_value (DECIMAL)
├── unit (TEXT)
├── start_date (DATE)
├── end_date (DATE)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

key_results
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── goal_id (FK -> goals)
├── title (TEXT)
├── target_value (DECIMAL)
├── current_value (DECIMAL)
├── unit (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```
- **OKR Logic**: Goals have multiple Key Results
- **Progress Calculation**: Automatic average of KR progress

#### 5. **Finance Module**

##### Accounts
```
accounts
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── name (TEXT)
├── type (TEXT)
├── currency (TEXT, default: 'SAR')
├── balance (DECIMAL)
├── icon (TEXT)
├── color (TEXT)
├── account_type (ENUM: 'bank', 'wallet', 'cash', 'credit', 'investment')
├── opening_balance (NUMERIC)
├── is_active (BOOLEAN)
├── last_reconciled_at (TIMESTAMPTZ)
├── reconciled_balance (NUMERIC)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

##### Transactions
```
transactions
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── account_id (FK -> accounts)
├── type (ENUM: 'income', 'expense', 'transfer', 'investment')
├── amount (DECIMAL)
├── currency (TEXT, default: 'SAR')
├── category (TEXT)
├── description (TEXT)
├── date (DATE)
├── payee_id (FK -> payees, nullable)
├── is_split (BOOLEAN)
├── is_reconciled (BOOLEAN)
├── reconciled_at (TIMESTAMPTZ)
├── journal_entry_id (FK -> journal_entries)
├── project_id (FK -> projects)
├── tags (TEXT[])
├── receipt_url (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

##### Subscriptions
```
subscriptions
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── name (TEXT)
├── amount (DECIMAL)
├── currency (TEXT)
├── billing_cycle (ENUM: 'monthly', 'quarterly', 'yearly')
├── next_billing_date (DATE)
├── category (TEXT)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

##### Debts
```
debts
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── name (TEXT)
├── total_amount (DECIMAL)
├── remaining_amount (DECIMAL)
├── monthly_payment (DECIMAL)
├── currency (TEXT, default: 'SAR')
├── start_date (DATE)
├── end_date (DATE)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

##### Budgets
```
budgets
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── category (TEXT)
├── limit_amount (DECIMAL)
├── spent_amount (DECIMAL)
├── currency (TEXT)
├── month (INTEGER)
├── year (INTEGER)
├── status (ENUM: 'draft', 'active', 'closed')
├── notes (TEXT)
├── closed_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
└── UNIQUE(user_id, category, month, year)
```

##### Finance Support Tables
```
categories (hierarchical)
├── id (UUID, PK)
├── user_id (FK)
├── name (TEXT)
├── parent_id (FK -> categories)
├── type (ENUM: 'income', 'expense', 'transfer')
├── icon (TEXT)
├── color (TEXT)
└── is_system (BOOLEAN)

payees
├── id (UUID, PK)
├── user_id (FK)
├── name (TEXT)
├── default_category_id (FK)
└── notes (TEXT)

journal_entries (double-entry accounting)
├── id (UUID, PK)
├── user_id (FK)
├── date (DATE)
├── memo (TEXT)
├── source_type (TEXT)
├── is_posted (BOOLEAN)
└── posted_at (TIMESTAMPTZ)

journal_lines
├── id (UUID, PK)
├── journal_entry_id (FK)
├── account_id (FK)
├── debit (NUMERIC)
├── credit (NUMERIC)
├── currency (TEXT)
└── memo (TEXT)

transaction_splits
├── id (UUID, PK)
├── transaction_id (FK)
├── amount (NUMERIC)
├── category_id (FK)
├── project_id (FK)
└── memo (TEXT)

envelopes (envelope budgeting)
├── id (UUID, PK)
├── user_id (FK)
├── budget_id (FK)
├── name (TEXT)
├── target_amount (NUMERIC)
├── available_amount (NUMERIC)
├── color (TEXT)
└── icon (TEXT)

sinking_funds
├── id (UUID, PK)
├── user_id (FK)
├── name (TEXT)
├── target_amount (NUMERIC)
├── current_amount (NUMERIC)
├── target_date (DATE)
├── monthly_contribution (NUMERIC)
├── linked_envelope_id (FK)
├── is_active (BOOLEAN)
└── ...timestamps
```

#### 6. **Habits & Mood Tracking**
```
habits
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── name (TEXT)
├── description (TEXT)
├── icon (TEXT)
├── color (TEXT)
├── frequency (ENUM: 'daily', 'weekly', 'monthly', 'yearly')
├── target_count (INTEGER)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

habit_logs
├── id (UUID, PK)
├── user_id (FK -> auth.users)
├── habit_id (FK -> habits)
├── completed_at (DATE)
├── count (INTEGER)
├── notes (TEXT)
└── created_at (TIMESTAMPTZ)
```

---

## API Routes & Data Flow

### Authentication Routes
**Provider**: Supabase Auth

```
POST /auth/signup
  Input: { email, password, fullName }
  Output: User object
  Logic: Create user + auto-create profile
  
POST /auth/login
  Input: { email, password }
  Output: Session token
  
POST /auth/reset-password
  Input: { email }
  Output: Reset link sent to email
  
PUT /auth/update-password
  Input: { newPassword }
  Output: Updated user
```

### Dashboard Routes (Protected)

#### Projects API
```
GET /api/projects
  Query: Filter by status, PARA category
  Returns: Project[]
  Cache: React Query key: ['projects', user_id]

GET /api/projects/active
  Returns: Project[] (status='active', limit 5)
  Cache Key: ['active-projects', user_id]

POST /api/projects
  Input: ProjectInsert
  Output: Project
  Side-effects: Invalidates cache

PUT /api/projects/:id
  Input: ProjectUpdate
  Output: Updated Project
  
DELETE /api/projects/:id
  Output: void
```

#### Tasks API
```
GET /api/tasks
  Sorting: position ASC (kanban order)
  Relations: projects(title)
  Cache Key: ['tasks', user_id]

GET /api/tasks/focus
  Filter: is_focus=true AND status!='done'
  Limit: 5
  Sort: priority DESC
  Cache Key: ['focus-tasks', user_id]

POST /api/tasks
  Input: TaskInsert
  Output: Task
  
PUT /api/tasks/:id
  Supports: status, priority, due_date, completion
  
DELETE /api/tasks/:id
```

#### Goals & Key Results API
```
GET /api/goals
  Filter: is_active=true (unless includeArchived=true)
  Relations: projects, habits
  Cache Key: ['goals', user_id, includeArchived]

GET /api/goals/with-kr
  Returns: Goal[] with calculated progress
  Logic: avg(KR.current_value / KR.target_value * 100)
  Cache Key: ['goals-with-kr', user_id]

GET /api/key-results
  Cache Key: ['key-results', user_id]

POST /api/goals
POST /api/goals/:id/key-results

PUT /api/key-results/:id
  Auto-invalidates parent goal progress

DELETE /api/goals/:id
  Cascade: Deletes all associated KRs

PATCH /api/goals/:id/archive
  Update: is_active = false
```

#### Finance API
```
GET /api/accounts
  Returns: Account[] with current balance
  Cache Key: ['accounts', user_id]

GET /api/transactions
  Sorting: date DESC
  Optional limit parameter
  Relations: accounts(name)
  Cache Key: ['transactions', user_id, limit]

GET /api/finance/monthly-stats
  Returns: {
    netWorth: sum of account balances,
    monthlyIncome: sum of 'income' type,
    monthlyExpenses: sum of 'expense' type,
    savingsRate: ((income - expenses) / income) * 100
  }
  Cache Key: ['monthly-stats', user_id]

GET /api/subscriptions
  Filter: is_active=true
  Sort: next_billing_date ASC

POST /api/accounts
POST /api/transactions
POST /api/subscriptions
POST /api/debts
POST /api/budgets

PUT /api/accounts/:id
PUT /api/transactions/:id
PUT /api/budgets/:id

DELETE /api/accounts/:id
DELETE /api/transactions/:id
```

#### Habits API
```
GET /api/habits
  Returns: Habit[] with is_active=true
  Cache Key: ['habits', user_id]

GET /api/habit-logs
  Filter by habit_id
  Sort: completed_at DESC

POST /api/habits
POST /api/habit-logs/:habit_id

PUT /api/habits/:id
DELETE /api/habits/:id
```

---

## Business Logic

### Core Patterns

#### 1. **React Query + Hooks Pattern**
Every data entity has custom hooks:
- `useX()` - fetch query
- `useCreateX()` - create mutation
- `useUpdateX()` - update mutation
- `useDeleteX()` - delete mutation

**Cache Invalidation Strategy**:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['entity'] })
  queryClient.invalidateQueries({ queryKey: ['related-entities'] })
}
```

#### 2. **User Isolation (Row Level Security)**
Every table has RLS policies:
```sql
-- Example for tasks table
CREATE POLICY "Users can view own tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

All queries automatically filter by current user.

#### 3. **Task Management Logic**
- **Status Flow**: backlog → todo → in_progress → review → done
- **Priority Levels**: low, medium, high, urgent
- **Focus Tasks**: Limited to 5 items, auto-filtered
- **Dependencies**: blocked_by allows task dependencies
- **Recurrence**: Supports daily/weekly/monthly/yearly
- **Completion Tracking**: Records completed_at timestamp

#### 4. **Goal Tracking (OKR)**
```typescript
// Progress calculation for goals
const gKRs = keyResults.filter(kr => kr.goal_id === goal.id)
const progress = Math.round(
  gKRs.reduce((sum, kr) => 
    sum + (kr.current_value / kr.target_value * 100), 0
  ) / gKRs.length
)
```

- Manual progress updates via KR updates
- Archiving: Goals can be archived (is_active=false)
- Perspectives: Financial, Customer, Processes, Learning

#### 5. **Finance Logic**

**Monthly Statistics Calculation**:
```typescript
const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0)
const income = transactions
  .filter(tx => tx.type === 'income')
  .reduce((sum, tx) => sum + tx.amount, 0)
const expenses = transactions
  .filter(tx => tx.type === 'expense')
  .reduce((sum, tx) => sum + tx.amount, 0)
const savingsRate = ((income - expenses) / income) * 100
```

**Transaction Types**:
- `income`: Money coming in
- `expense`: Money going out
- `transfer`: Between accounts
- `investment`: Investment transactions

**Account Management**:
- Multiple currencies supported
- Balance tracking with reconciliation
- Account types: bank, wallet, cash, credit, investment

**Budget System**:
- Month/year based
- Category-level limits
- Status tracking: draft → active → closed
- Envelope budgeting support
- Sinking funds for large future expenses

#### 6. **Habit Tracking**
```typescript
// Habit completion logging
habit_logs {
  habit_id,
  completed_at: DATE,
  count: INTEGER,  // Daily count (e.g., 10 for "10 pushups")
  notes: TEXT
}
```

- Frequency: daily, weekly, monthly, yearly
- Target count: Expected reps/completions
- Streaks: Calculated from consecutive logs
- Correlations: Can link to mood/goals

#### 7. **Project Management**
- **PARA Framework**: Project, Area, Resource, Archive
- **PMP Phases**: Initiation → Planning → Execution → Monitoring → Closing
- **Status**: active, on_hold, completed, archived
- **Progress**: 0-100 percentage
- **Relations**: One project can have many tasks

#### 8. **Real-time Updates**
Supabase subscriptions available for:
- Live task updates
- Transaction notifications
- Habit completion syncing
- Goal progress updates

### Error Handling
All mutations wrapped in try-catch:
```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  // Error logged, toast shown to user
  throw error
}
```

### Caching Strategy
- **Cache Key Structure**: [entityName, userId, filters?]
- **Stale Time**: Default React Query settings
- **Invalidation**: On create/update/delete
- **Related Queries**: Cascade invalidation for related entities

---

## Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **State Management**: 
  - React Query (server state)
  - React Context (auth state)
  - Local storage (persistence)
- **UI Components**: Custom UI library (shadcn/ui based)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Real-time subscriptions
- **API Client**: @supabase/supabase-js
- **Environment**: Edge Functions support (not yet used)

### Hooks Organization
Located in `/src/hooks/`:
- `useAuth.tsx` - Authentication context
- `useTasks.tsx` - Task CRUD
- `useProjects.tsx` - Project CRUD
- `useGoals.tsx` - Goals & KR management
- `useFinance.tsx` - Finance operations
- `useBudgets.tsx` - Budget management
- `useHabits.tsx` - Habit tracking
- `useAdvancedFinance.tsx` - Complex finance logic
- `useUnifiedCalendar.tsx` - Calendar integration
- And 30+ more specialized hooks

### Utility Libraries
- `lib/utils.ts` - Helper functions
- `lib/prayer-times.ts` - Islamic prayer times
- `lib/hijri.ts` - Hijri calendar conversion
- `lib/pdf-export.ts` - PDF generation
- `lib/export-utils.ts` - Data export functionality

### Project Structure
```
src/
├── pages/           # Route pages (dashboard, tasks, goals, etc.)
├── components/      # Reusable UI components
│   ├── dashboard/   # Dashboard widgets
│   ├── finance/     # Finance module components
│   ├── crm/         # CRM module
│   └── ui/          # Base UI components
├── hooks/           # Custom React hooks
├── integrations/    # External integrations
│   └── supabase/    # Supabase client & types
├── lib/             # Utilities & helpers
├── i18n/            # Internationalization (ar/en)
└── assets/          # Static assets
```

---

## Key Features Summary

| Feature | Module | Status | Progress |
|---------|--------|--------|----------|
| Task Management | Tasks | ✅ Complete | Kanban, focus tasks, recurrence |
| Project Management | Projects | ✅ Complete | PARA + PMP phases |
| Goal Tracking | Goals | ✅ Complete | OKR framework with KRs |
| Finance | Finance | ✅ Advanced | Multi-currency, double-entry, budgeting |
| Habit Tracking | Habits | ✅ Complete | Logging, streaks, correlations |
| User Auth | Auth | ✅ Complete | Email/password, session persistence |
| Calendar | Calendar | ✅ Complete | Unified view (tasks, events, habits) |
| Studio | Content | ✅ Partial | Media management |
| Pomodoro | Productivity | ✅ Complete | Timer with task integration |
| CRM | CRM | ✅ Basic | Customer, case, communication mgmt |

---

## Next Steps for Refactoring

### Phase 1: Backend Structure
1. Create backend API layer (Edge Functions or separate API)
2. Move business logic from hooks to server
3. Implement proper error handling
4. Add request validation schemas (Zod/Joi)

### Phase 2: Data Layer
1. Create data access layer (DAL) for each entity
2. Abstract Supabase queries into separate modules
3. Implement caching layer improvements
4. Add data transformation layer (DTOs)

### Phase 3: Business Logic
1. Extract complex logic from hooks to services
2. Create domain models
3. Implement repository pattern
4. Add comprehensive logging

### Phase 4: Frontend Architecture
1. Organize components by domain
2. Create page-level containers
3. Implement proper error boundaries
4. Add loading skeletons

### Phase 5: Testing
1. Add unit tests for business logic
2. Add integration tests for API flows
3. Add E2E tests for critical paths
4. Add component tests

---

## Notes
- All timestamps use TIMESTAMPTZ (timezone-aware)
- User language preference: Arabic ('ar') or English ('en')
- Default timezone: Asia/Riyadh (CST)
- Default currency: SAR (Saudi Riyal)
- Row Level Security is enabled on all user-data tables
- Profile auto-creation on user signup via trigger
