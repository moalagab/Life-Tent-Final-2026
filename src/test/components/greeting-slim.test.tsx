import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GreetingSlim } from '@/components/dashboard/GreetingSlim';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('@/hooks/useLanguage', () => ({ useLanguage: vi.fn() }));
vi.mock('@/lib/hijri', () => ({ formatHijriDate: () => 'Dhul-Hijja 1, 1446' }));

// Pull the mocked functions so each test can configure them
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

const mockUseAuth = vi.mocked(useAuth);
const mockUseLanguage = vi.mocked(useLanguage);

// Default: English, user with full name
beforeEach(() => {
  mockUseLanguage.mockReturnValue({
    currentLanguage: 'en',
    t: (k: string) => k,
    isRTL: false,
    changeLanguage: vi.fn(),
    toggleLanguage: vi.fn(),
  });
  mockUseAuth.mockReturnValue({
    user: {
      email: 'john@example.com',
      user_metadata: { full_name: 'John Doe' },
    },
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  });
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-06-01T09:00:00')); // 09:00 → morning
});

afterEach(() => {
  vi.useRealTimers();
});

// ── User name ──────────────────────────────────────────────────────────────

describe('user name display', () => {
  it('shows first name from full_name', () => {
    render(<GreetingSlim />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('shows email prefix when no full_name', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      user: { email: 'jane@example.com', user_metadata: {} },
    });
    render(<GreetingSlim />);
    expect(screen.getByText('jane')).toBeInTheDocument();
  });

  it('shows fallback "there" when user is null', () => {
    mockUseAuth.mockReturnValue({ ...mockUseAuth(), user: null });
    render(<GreetingSlim />);
    expect(screen.getByText('there')).toBeInTheDocument();
  });
});

// ── Time-based greeting (English) ─────────────────────────────────────────

describe('English time-based greetings', () => {
  it('shows "Good morning" before noon (09:00)', () => {
    vi.setSystemTime(new Date('2024-06-01T09:00:00'));
    render(<GreetingSlim />);
    expect(screen.getByRole('heading').textContent).toMatch(/Good morning/i);
  });

  it('shows "Good afternoon" at 13:00', () => {
    vi.setSystemTime(new Date('2024-06-01T13:00:00'));
    render(<GreetingSlim />);
    expect(screen.getByRole('heading').textContent).toMatch(/Good afternoon/i);
  });

  it('shows "Good evening" at 18:00', () => {
    vi.setSystemTime(new Date('2024-06-01T18:00:00'));
    render(<GreetingSlim />);
    expect(screen.getByRole('heading').textContent).toMatch(/Good evening/i);
  });

  it('shows "Good night" at 22:00', () => {
    vi.setSystemTime(new Date('2024-06-01T22:00:00'));
    render(<GreetingSlim />);
    expect(screen.getByRole('heading').textContent).toMatch(/Good night/i);
  });
});

// ── Arabic greetings ───────────────────────────────────────────────────────

describe('Arabic time-based greetings', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({
      currentLanguage: 'ar',
      t: (k: string) => k,
      isRTL: true,
      changeLanguage: vi.fn(),
      toggleLanguage: vi.fn(),
    });
  });

  it('shows صباح الخير before noon', () => {
    vi.setSystemTime(new Date('2024-06-01T08:00:00'));
    render(<GreetingSlim />);
    expect(screen.getByRole('heading').textContent).toContain('صباح الخير');
  });

  it('shows مساء الخير at 15:00', () => {
    vi.setSystemTime(new Date('2024-06-01T15:00:00'));
    render(<GreetingSlim />);
    expect(screen.getByRole('heading').textContent).toContain('مساء الخير');
  });

  it('shows Arabic fallback "صديقي" when user is null', () => {
    mockUseAuth.mockReturnValue({ ...mockUseAuth(), user: null });
    render(<GreetingSlim />);
    expect(screen.getByText('صديقي')).toBeInTheDocument();
  });
});
