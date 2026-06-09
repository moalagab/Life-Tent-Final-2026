# Life Tent Platform - UI/UX Wireframes
## Visual Structure & Layout Documentation

---

## 1️⃣ LANDING PAGE (الصفحة الرئيسية)

```
┌─────────────────────────────────────────────────────────────┐
│                     HEADER NAVIGATION                        │
├─────────────────────────────────────────────────────────────┤
│ Logo                                                    [BTN] │
│                                                    Sign In    │
│                                                    Sign Up    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    HERO SECTION                              │
│                                                               │
│        "Organize Your Life, Achieve Your Goals"             │
│                                                               │
│        Subtitle: All-in-one platform for life management    │
│                                                               │
│                    [CTA BUTTON]                             │
│                   Get Started Free                          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              FEATURES SECTION (3-4 columns)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Task Mgmt    │  │ Finance      │  │ Goals & OKR  │      │
│  │              │  │              │  │              │      │
│  │ Description  │  │ Description  │  │ Description  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    TESTIMONIALS / STATS                      │
│                                                               │
│  "Helped 10K+ users"  |  "4.9★ Rating"  |  "99% Uptime"    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    FOOTER                                    │
│  Links | Social | Copyright                                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Fixed Header with Logo + Auth buttons
- Full-width Hero with CTA
- Feature Cards (3 columns, responsive)
- Social Proof Section
- Standard Footer

---

## 2️⃣ LOGIN PAGE (صفحة تسجيل الدخول)

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│                   LEFT SIDE (50%)            RIGHT SIDE (50%)  │
│                                                                │
│                                          ┌──────────────────┐  │
│              [LOGO/BRANDING]            │  Life Tent       │  │
│                                          │                  │  │
│              Visual Elements             │  Welcome Back    │  │
│              + Value Prop                │                  │  │
│                                          ├──────────────────┤  │
│                                          │                  │  │
│                                          │ Email:           │  │
│                                          │ [________TEXT___] │  │
│                                          │                  │  │
│                                          │ Password:        │  │
│                                          │ [________TEXT___] │  │
│                                          │                  │  │
│                                          │ [ ] Remember Me  │  │
│                                          │ Forgot Password? │  │
│                                          │                  │  │
│                                          │  [SIGN IN BTN]   │  │
│                                          │                  │  │
│                                          │ Don't have acc?  │  │
│                                          │ [Sign Up Link]   │  │
│                                          │                  │  │
│                                          │ OR               │  │
│                                          │ [Google][Apple]  │  │
│                                          │                  │  │
│                                          └──────────────────┘  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Split Layout (Visual + Form)
- Form Fields (Email, Password)
- Remember Me Checkbox
- Sign In Button (CTA)
- Social Login Options
- Sign Up Link (Cross-promotion)

---

## 3️⃣ DASHBOARD (لوحة التحكم - الصفحة الرئيسية للمستخدم)

```
┌───────────────────────────────────────────────────────────────────┐
│ HEADER SECTION                                                     │
├───────┬───────────────────────────────────────────────────────────┤
│       │                                                             │
│ SIDE  │  [LOGO]        "Good Morning, User"       [SETTINGS]     │
│ BAR   │                Date & Time                [PROFILE]      │
│       │                                            [LOGOUT]       │
│ NAV   ├───────────────────────────────────────────────────────────┤
│       │                                                             │
│ •Dash │           MAIN CONTENT AREA (12-col grid)                │
│ •Task │                                                             │
│ •Proj │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│ •Goal │  │  KPI STRIP  │  │   KPI CARD  │  │  KPI CARD   │      │
│ •Fin  │  │   (3 cols)  │  │   (3 cols)  │  │   (3 cols)  │      │
│ •Habi │  │             │  │             │  │             │      │
│ •Cal  │  │ Today: 8/10 │  │ Week: 32%   │  │ Month: $500 │      │
│ •Pomo │  └─────────────┘  └─────────────┘  └─────────────┘      │
│       │                                                             │
│ •Sett │  ┌──────────────────────┐  ┌──────────────────────┐      │
│ •Help │  │  FOCUS TASKS         │  │  RECENT PROJECTS    │      │
│       │  │  (6 cols, 4 rows)    │  │  (6 cols, 3 rows)   │      │
│       │  │                      │  │                      │      │
│       │  │ ☐ Task 1        [P]  │  │ ▌ Project A    50%  │      │
│       │  │ ☐ Task 2        [M]  │  │ ▌ Project B    75%  │      │
│       │  │ ☐ Task 3        [H]  │  │ ▌ Project C    30%  │      │
│       │  │ ☐ Task 4        [H]  │  │                      │      │
│       │  │                      │  │ [See All]            │      │
│       │  │ [+ Add Task]         │  └──────────────────────┘      │
│       │  └──────────────────────┘                                 │
│       │                                                             │
│       │  ┌──────────────────────┐  ┌──────────────────────┐      │
│       │  │  HABIT STREAKS       │  │  FINANCE SNAPSHOT   │      │
│       │  │  (6 cols, 3 rows)    │  │  (6 cols, 3 rows)   │      │
│       │  │                      │  │                      │      │
│       │  │ Morning Run    🔥 12d │  │ Net Worth: $50,000  │      │
│       │  │ Reading        🔥 8d  │  │ Income: $5,000      │      │
│       │  │ Meditation     🔥 3d  │  │ Expenses: $2,000    │      │
│       │  │                      │  │                      │      │
│       │  │ [See All]            │  │ [Detailed View]     │      │
│       │  └──────────────────────┘  └──────────────────────┘      │
│       │                                                             │
└───────┴───────────────────────────────────────────────────────────┘
```

**Layout Structure**:
- Sidebar Navigation (Fixed, Collapsible)
- Top Header Bar
- Content Grid (12 columns)
- Widget-based Layout
- 4 Main Sections: KPIs, Focus Tasks, Projects, Habits, Finance
- Responsive Cards

**Sidebar Menu Items**:
```
▼ Dashboard (Home icon)
  Tasks (Checklist icon)
  Projects (Folder icon)
  Goals (Target icon)
  Finance (Wallet icon)
  Habits (Repeat icon)
  Calendar (Date icon)
  Studio (Image icon)
  Pomodoro (Timer icon)
  ─────────────────
  Settings (Gear icon)
  Help (Help icon)
```

---

## 4️⃣ TASKS PAGE (صفحة المهام - Kanban View)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Tasks                          │
│            │  [FILTERS] Priority▼ Status▼ Project▼  [+ New Task] │
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│            │  KANBAN BOARD (5 columns - scrollable)               │
│            │                                                         │
│   SIDEBAR  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│            │  │ BACKLOG  │ │   TODO   │ │IN PROGRESS│ │ REVIEW │ │
│            │  │  (12)    │ │  (8)     │ │  (5)      │ │ (2)   │ │
│            │  ├──────────┤ ├──────────┤ ├──────────┤ ├─────────┤ │
│            │  │          │ │          │ │          │ │        │ │
│            │  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │┌─────┐ │ │
│            │  │ │Task 1│ │ │ │Task 5│ │ │ │Task 7│ │ ││Task10 │ │
│            │  │ │P: Low│ │ │ │P: M  │ │ │ │P: H │ │ ││P: U  │ │
│            │  │ │Due: - │ │ │ │Due: 2d│ │ │ │Due: 0d│ │ │Due: 1d│ │
│            │  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │└─────┘ │ │
│            │  │          │ │          │ │          │ │        │ │
│            │  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │        │ │
│            │  │ │Task 2│ │ │ │Task 6│ │ │ │Task 8│ │ │        │ │
│            │  │ │P: M  │ │ │ │P: H │ │ │ │P: M  │ │ │        │ │
│            │  │ │Due: 3d│ │ │ │Due: 1d│ │ │ │Due:1d│ │ │        │ │
│            │  │ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │        │ │
│            │  │          │ │          │ │          │ │        │ │
│            │  │ [+ Add]  │ │ [+ Add]  │ │ [+ Add]  │ │[+ Add] │ │
│            │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│            │                                                         │
│            │  [Load More]          DONE (25)                       │
│            │                       [Show/Hide]                     │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Kanban Columns (5 status types)
- Task Cards (Priority, Due Date indicators)
- Drag & Drop (implicit)
- Filter Bar (Top)
- Add New Task Button
- Column Counters

---

## 5️⃣ PROJECTS PAGE (صفحة المشاريع - List/Grid View)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Projects                       │
│            │  [VIEW: Grid/List ▼]  [FILTER: Status▼] [+ New Proj]│
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│   SIDEBAR  │  PROJECTS GRID (3 columns)                           │
│            │                                                         │
│            │  ┌──────────────────┐  ┌──────────────────┐           │
│            │  │   PROJECT CARD   │  │   PROJECT CARD   │           │
│            │  ├──────────────────┤  ├──────────────────┤           │
│            │  │                  │  │                  │           │
│            │  │ [Color Block]    │  │ [Color Block]    │           │
│            │  │ Project A        │  │ Project B        │           │
│            │  │                  │  │                  │           │
│            │  │ Status: Active   │  │ Status: On Hold  │           │
│            │  │ Phase: Planning  │  │ Phase: Execution │           │
│            │  │                  │  │                  │           │
│            │  │ Progress:        │  │ Progress:        │           │
│            │  │ ▓▓▓▓▓░░░░ 50%   │  │ ▓▓▓▓▓▓▓░░░ 75%  │           │
│            │  │                  │  │                  │           │
│            │  │ Tasks: 8/12      │  │ Tasks: 9/12      │           │
│            │  │ Due: 5 days      │  │ Due: 2 days      │           │
│            │  │                  │  │                  │           │
│            │  │ [Menu ▼]         │  │ [Menu ▼]         │           │
│            │  │ Edit | Archive   │  │ Edit | Archive   │           │
│            │  │                  │  │                  │           │
│            │  └──────────────────┘  └──────────────────┘           │
│            │                                                         │
│            │  ┌──────────────────┐  ┌──────────────────┐           │
│            │  │   PROJECT CARD   │  │   PROJECT CARD   │           │
│            │  │  [Similar Layout]│  │  [Similar Layout]│           │
│            │  │                  │  │                  │           │
│            │  └──────────────────┘  └──────────────────┘           │
│            │                                                         │
│            │  [Load More...]                                        │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Project Cards (3-column grid)
- Status Indicator
- Progress Bar
- Task Counter
- Due Date Indicator
- Action Menu

---

## 6️⃣ GOALS PAGE (صفحة الأهداف - OKR Framework)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Goals                          │
│            │  [FILTER: Active▼ Perspective▼]  [+ New Goal]       │
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│   SIDEBAR  │  GOALS LIST (Full width, collapsible sections)       │
│            │                                                         │
│            │  ┌─────────────────────────────────────────────────┐ │
│            │  │ ▼ FINANCIAL GOALS (3 active)                   │ │
│            │  ├─────────────────────────────────────────────────┤ │
│            │  │                                                 │ │
│            │  │ ▌ Goal 1: Save $10,000 for emergency fund     │ │
│            │  │   Target: $10,000  |  Current: $6,500 (65%)   │ │
│            │  │   ▓▓▓▓▓▓░░░░░░░░░░░░░░░░ 65%                 │ │
│            │  │   Start: 01/Jan  |  End: 31/Dec (150 days)    │ │
│            │  │   Key Results: [3 KRs]  [Expand]              │ │
│            │  │   [Edit] [Archive]                             │ │
│            │  │                                                 │ │
│            │  │ ▌ Goal 2: Increase investment portfolio 30%    │ │
│            │  │   Target: +30%  |  Current: +12% (40%)        │ │
│            │  │   ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40%    │ │
│            │  │   Start: 01/Jan  |  End: 31/Dec (150 days)    │ │
│            │  │   Key Results: [2 KRs]  [Expand]              │ │
│            │  │   [Edit] [Archive]                             │ │
│            │  │                                                 │ │
│            │  │ ▌ Goal 3: Reduce monthly expenses 20%          │ │
│            │  │   Target: -20%  |  Current: -8% (40%)         │ │
│            │  │   ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40%    │ │
│            │  │   Start: 01/Mar  |  End: 31/Dec (306 days)    │ │
│            │  │   Key Results: [4 KRs]  [Expand]              │ │
│            │  │   [Edit] [Archive]                             │ │
│            │  │                                                 │ │
│            │  └─────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  ┌─────────────────────────────────────────────────┐ │
│            │  │ ▼ LEARNING GOALS (2 active)                    │ │
│            │  ├─────────────────────────────────────────────────┤ │
│            │  │  [Similar structure as above]                   │ │
│            │  └─────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  Archived Goals: [3]  [Show]                         │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Collapsible Sections by Perspective
- Goal Cards with Progress
- Progress Bar
- Target vs Current Display
- Key Results Counter with Expand
- Archive Action

---

## 7️⃣ FINANCE PAGE (صفحة المالية - Overview & Transactions)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Finance                        │
│            │  [TAB: Overview | Accounts | Transactions | Budgets] │
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│   SIDEBAR  │  FINANCE OVERVIEW TAB                                │
│            │                                                         │
│            │  ┌──────────────────┐  ┌──────────────────┐           │
│            │  │   NET WORTH      │  │  MONTHLY STATS   │           │
│            │  │   (Card)         │  │   (Card)         │           │
│            │  ├──────────────────┤  ├──────────────────┤           │
│            │  │                  │  │                  │           │
│            │  │  $50,000.00      │  │ Income: $5,000   │           │
│            │  │  ↑ +2.5% vs month│  │ Expenses: $2,000 │           │
│            │  │                  │  │ Savings: $3,000  │           │
│            │  │                  │  │ Rate: 60% ↑      │           │
│            │  │                  │  │                  │           │
│            │  └──────────────────┘  └──────────────────┘           │
│            │                                                         │
│            │  ┌──────────────────────────────────────────────────┐ │
│            │  │  ACCOUNTS (Quick View)                           │ │
│            │  ├──────────────────────────────────────────────────┤ │
│            │  │                                                  │ │
│            │  │  [Bank Icon] Main Bank          $15,000 ▼      │ │
│            │  │  [Wallet Icon] Cash Wallet      $2,500  ▼      │ │
│            │  │  [Card Icon] Credit Card        -$1,200 ▼      │ │
│            │  │  [Investment Icon] Investment   $32,500 ▼      │ │
│            │  │                                                  │ │
│            │  └──────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  ┌──────────────────────────────────────────────────┐ │
│            │  │  RECENT TRANSACTIONS (Last 5)                   │ │
│            │  ├──────────────────────────────────────────────────┤ │
│            │  │                                                  │ │
│            │  │  [+] Salary        Main Bank    +$3,000  Today  │ │
│            │  │  [-] Groceries     Cash        -$150    Today   │ │
│            │  │  [-] Netflix       Credit Card -$15     Today   │ │
│            │  │  [→] Transfer      Main→Invest +$1,000  Today   │ │
│            │  │  [-] Coffee        Cash        -$5      Today   │ │
│            │  │                                                  │ │
│            │  │  [View All Transactions]                        │ │
│            │  │                                                  │ │
│            │  └──────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  ┌──────────────────────────────────────────────────┐ │
│            │  │  MONTHLY EXPENSE BREAKDOWN (Chart/Categories)   │ │
│            │  ├──────────────────────────────────────────────────┤ │
│            │  │                                                  │ │
│            │  │  Housing:        $800  ████████░░░░░░░░░░ 40%  │ │
│            │  │  Food:           $400  ████░░░░░░░░░░░░░░░░░░ 20% │
│            │  │  Transport:      $200  ██░░░░░░░░░░░░░░░░░░░░ 10% │
│            │  │  Entertainment:  $300  ███░░░░░░░░░░░░░░░░░░░░ 15% │
│            │  │  Other:          $300  ███░░░░░░░░░░░░░░░░░░░░ 15% │
│            │  │                                                  │ │
│            │  │  Total: $2,000                                  │ │
│            │  │                                                  │ │
│            │  └──────────────────────────────────────────────────┘ │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Stats Cards (Net Worth, Monthly Stats)
- Account Quick View
- Recent Transactions List
- Expense Breakdown Chart
- Tab Navigation for different views

---

## 8️⃣ HABITS PAGE (صفحة العادات - Tracking & Analytics)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Habits                         │
│            │  [FILTER: Active▼]  [+ New Habit]                   │
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│   SIDEBAR  │  HABITS TRACKING LIST                                │
│            │                                                         │
│            │  ┌─────────────────────────────────────────────────┐ │
│            │  │ DAILY HABITS                                   │ │
│            │  ├─────────────────────────────────────────────────┤ │
│            │  │                                                 │ │
│            │  │ ☐ Morning Run                                  │ │
│            │  │   🔥 Streak: 42 days  |  Target: Daily 1x     │ │
│            │  │   Today: Not completed  [Mark Complete]        │ │
│            │  │   This week: ✓ ✓ ✓ ✓ ✓ ✗ ✓ (6/7)           │ │
│            │  │   [View Analytics]  [Edit]  [Delete]          │ │
│            │  │                                                 │ │
│            │  │ ✓ Reading                                      │ │
│            │  │   🔥 Streak: 15 days  |  Target: Daily 30min   │ │
│            │  │   Today: Completed (2 days ago) ✓              │ │
│            │  │   This week: ✓ ✓ ✗ ✓ ✓ ✓ ✗ (5/7)           │ │
│            │  │   [View Analytics]  [Edit]  [Delete]          │ │
│            │  │                                                 │ │
│            │  │ ☐ Meditation                                   │ │
│            │  │   🔥 Streak: 3 days  |  Target: Daily 15min    │ │
│            │  │   Today: Not completed  [Mark Complete]        │ │
│            │  │   This week: ✓ ✓ ✓ ✗ ✗ ✗ ✗ (3/7)           │ │
│            │  │   [View Analytics]  [Edit]  [Delete]          │ │
│            │  │                                                 │ │
│            │  └─────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  ┌─────────────────────────────────────────────────┐ │
│            │  │ WEEKLY HABITS                                  │ │
│            │  ├─────────────────────────────────────────────────┤ │
│            │  │                                                 │ │
│            │  │ ✓ Gym Workout                                  │ │
│            │  │   Target: 3x/week  |  This week: 2 completed   │ │
│            │  │   ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 67%      │ │
│            │  │                                                 │ │
│            │  │ ☐ Meal Prep                                    │ │
│            │  │   Target: 1x/week  |  This week: 0 completed   │ │
│            │  │   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%    │ │
│            │  │                                                 │ │
│            │  └─────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  Completed/Archived: [12]  [Show]                    │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Habit Cards with Streak Display
- Frequency Indicator
- Weekly/Daily Progress
- Mark Complete Button
- Week View (Calendar dots)
- Action Menu (Edit, Delete, Analytics)

---

## 9️⃣ CALENDAR PAGE (صفحة التقويم - Unified View)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Calendar                       │
│            │  [Month View▼] [Today] [< Prev | Next >]             │
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│   SIDEBAR  │              MONTH CALENDAR                            │
│            │                                                         │
│ [Sidebar   │  Sun  Mon  Tue  Wed  Thu  Fri  Sat                   │
│  Legend]   │                                                         │
│            │   26   27   28   29   30   31    1                    │
│ Tasks: []  │   2    3    4    5    6    7    8                    │
│ Events:[]  │                                                         │
│ Habits: [] │   9   10   11   12   13   14   15                    │
│ Goals: []  │   [Task]           [Habit]                           │
│            │   Task 1           Exercise   [Event]                │
│            │   Task 2           Meditation Meeting                │
│            │   [2 more]         Reading                           │
│            │                                                         │
│            │  16   17   18   19   20   21   22                    │
│            │   [Habit]      [Goal]                                │
│            │   Reading      Check KR   [Event]                   │
│            │   Exercise     [2 more]   Conference                │
│            │   [1 more]                                           │
│            │                                                         │
│            │  23   24   25   26   27   28   29                    │
│            │   [Task]    [Event]       [Habit]                   │
│            │   Deadline  Deadline      Review Week               │
│            │            [1 more]                                 │
│            │                                                         │
│            │  30    1    2    3    4    5    6                    │
│            │  [Event]                                             │
│            │                                                         │
│            ├───────────────────────────────────────────────────────┤
│            │ TODAY: April 13, 2024                                │
│            │                                                         │
│            │ ┌─────────────────────────────────────────────────┐ │
│            │ │ TASKS TODAY (3)                                │ │
│            │ │ ☐ Complete report       Priority: High         │ │
│            │ │ ✓ Morning standup       Completed at 9:30 AM  │ │
│            │ │ ☐ Review PR             Due: End of day       │ │
│            │ │                                                 │ │
│            │ │ HABITS TODAY (2)                               │ │
│            │ │ ✓ Exercise              Completed 6 hours ago │ │
│            │ │ ☐ Meditation            Pending               │ │
│            │ │                                                 │ │
│            │ └─────────────────────────────────────────────────┘ │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Month/Week/Day View Toggle
- Calendar Grid with Events
- Day Details Sidebar
- Task/Habit/Event Indicators
- Today's Summary

---

## 🔟 SETTINGS PAGE (صفحة الإعدادات)

```
┌───────────────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │  [HEADER] Dashboard > Settings                       │
├────────────┼───────────────────────────────────────────────────────┤
│            │                                                         │
│   SIDEBAR  │  SETTINGS TABS                                        │
│   (Static) │  [Profile] [Account] [Preferences] [Notifications]   │
│            │  [Privacy] [Security] [Integrations] [About]         │
│            │                                                         │
│            ├───────────────────────────────────────────────────────┤
│            │                                                         │
│            │  PROFILE TAB (Selected)                              │
│            │                                                         │
│            │  ┌─────────────────────────────────────────────────┐ │
│            │  │ PROFILE INFORMATION                            │ │
│            │  ├─────────────────────────────────────────────────┤ │
│            │  │                                                 │ │
│            │  │  [Avatar Upload]                               │ │
│            │  │      [Profile Pic]  [Change Photo]             │ │
│            │  │                                                 │ │
│            │  │  Full Name:                                    │ │
│            │  │  [____________________ TEXT INPUT]             │ │
│            │  │                                                 │ │
│            │  │  Email:                                        │ │
│            │  │  [____________________ TEXT INPUT (read-only)]│ │
│            │  │                                                 │ │
│            │  │  Phone:                                        │ │
│            │  │  [____________________ TEXT INPUT]             │ │
│            │  │                                                 │ │
│            │  │  Bio:                                          │ │
│            │  │  [________________ TEXTAREA (3 lines)]         │ │
│            │  │                                                 │ │
│            │  │  [Cancel]  [Save Changes]                     │ │
│            │  │                                                 │ │
│            │  └─────────────────────────────────────────────────┘ │
│            │                                                         │
│            │  ┌─────────────────────────────────────────────────┐ │
│            │  │ PREFERENCES                                    │ │
│            │  ├─────────────────────────────────────────────────┤ │
│            │  │                                                 │ │
│            │  │  Language:              [English ▼]            │ │
│            │  │  Timezone:              [Asia/Riyadh ▼]       │ │
│            │  │  Currency:              [SAR ▼]               │ │
│            │  │  Theme:                 [Light / Dark ◉]      │ │
│            │  │  Date Format:           [DD/MM/YYYY ▼]        │ │
│            │  │                                                 │ │
│            │  │  [Save Preferences]                            │ │
│            │  │                                                 │ │
│            │  └─────────────────────────────────────────────────┘ │
│            │                                                         │
└────────────┴───────────────────────────────────────────────────────┘
```

**Key Elements**:
- Settings Tabs Navigation
- Form Sections
- Input Fields
- Toggle/Dropdown Controls
- Save/Cancel Buttons

---

## 📱 RESPONSIVE BREAKPOINTS

```
Desktop (1920px):  Full layout with sidebar + content
Tablet (768px):    Sidebar collapses to icons, content expands
Mobile (375px):    Sidebar becomes hamburger menu, stacked layout
```

---

## 🎨 LAYOUT GRID SYSTEM

- **Main Grid**: 12 columns (desktop), 6 (tablet), 1 (mobile)
- **Sidebar Width**: 250px (fixed), 60px (collapsed)
- **Header Height**: 60px (fixed)
- **Gutter**: 16px between columns
- **Container Max-width**: 1920px

---

## 🔧 COMPONENT PATTERNS

### Card Layout
```
┌─────────────────────┐
│ Header / Title      │
├─────────────────────┤
│                     │
│ Content             │
│                     │
├─────────────────────┤
│ Footer / Actions    │
└─────────────────────┘
```

### Form Pattern
```
Label:
[Input Field]
Helper Text / Error

[Button]
```

### List Item Pattern
```
[Icon] Title              [Secondary Info]
       Description
       Meta Information   [Action Menu]
```

---

## 📋 NAVIGATION HIERARCHY

```
Level 1: Main Routes (Sidebar)
├── Dashboard
├── Tasks
├── Projects
├── Goals
├── Finance
├── Habits
├── Calendar
├── Studio
├── Pomodoro
├── Settings
└── Help

Level 2: Sub-routes (Top tabs/filters)
├── Finance → Overview, Accounts, Transactions, Budgets
├── Tasks → Kanban, List, Calendar
└── Projects → Grid, List, Timeline

Level 3: Details (Modals/Drawers)
├── Task Details
├── Project Details
└── Goal Details
```

---

## ✅ USABILITY PRINCIPLES

1. **Consistency**: Same elements behave same way everywhere
2. **Feedback**: Actions show immediate response
3. **Clear Hierarchy**: Important elements prominent
4. **Minimal Cognitive Load**: Clear labels, logical grouping
5. **Accessibility**: Keyboard navigation, color contrast
6. **Empty States**: Helpful prompts when no data
7. **Error Prevention**: Confirmations for destructive actions
