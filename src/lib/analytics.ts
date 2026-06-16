/**
 * analytics.ts — PostHog Product Analytics wrapper.
 *
 * Single entry point for all tracking in Life Tent OS.
 *
 * Usage:
 *   import { capture, identify, analyticsReset } from '@/lib/analytics';
 *   capture('task_created', { priority: 'high', source: 'natural_capture' });
 *
 * Setup:
 *   Add to .env:  VITE_POSTHOG_KEY=phc_xxxx
 *                 VITE_POSTHOG_HOST=https://eu.i.posthog.com   (EU cloud)
 *                 or leave host empty for US cloud (app.posthog.com)
 */

import posthog from 'posthog-js';

// ── Typed event catalogue ────────────────────────────────────────────────────
// Every event name lives here — no magic strings scattered in the codebase.

export const EVENTS = {
  // Auth
  USER_SIGNED_UP:          'user_signed_up',
  USER_SIGNED_IN:          'user_signed_in',
  USER_SIGNED_OUT:         'user_signed_out',
  USER_SIGNED_IN_GOOGLE:   'user_signed_in_google',
  PASSWORD_RESET_SENT:     'password_reset_sent',

  // Onboarding
  ONBOARDING_STARTED:      'onboarding_started',
  ONBOARDING_COMPLETED:    'onboarding_completed',
  ONBOARDING_STEP:         'onboarding_step_viewed',

  // Dashboard
  DASHBOARD_VIEWED:        'dashboard_viewed',
  LAYOUT_PRESET_CHANGED:   'layout_preset_changed',

  // Capture
  NATURAL_CAPTURE_USED:    'natural_capture_used',
  NATURAL_CAPTURE_SAVED:   'natural_capture_saved',

  // Tasks
  TASK_CREATED:            'task_created',
  TASK_COMPLETED:          'task_completed',
  TASK_UPDATED:            'task_updated',
  TASK_DELETED:            'task_deleted',
  TASK_FOCUS_SET:          'task_focus_set',

  // Projects
  PROJECT_CREATED:         'project_created',
  PROJECT_ARCHIVED:        'project_archived',
  PROJECT_WORKSPACE_OPENED:'project_workspace_opened',

  // Areas
  AREA_CREATED:            'area_created',
  AREA_WORKSPACE_OPENED:   'area_workspace_opened',

  // Goals
  GOAL_CREATED:            'goal_created',
  GOAL_UPDATED:            'goal_updated',
  GOAL_COMPLETED:          'goal_completed',

  // Habits
  HABIT_CREATED:           'habit_created',
  HABIT_LOGGED:            'habit_logged',
  HABIT_STREAK_MILESTONE:  'habit_streak_milestone',

  // Finance
  TRANSACTION_ADDED:       'transaction_added',
  BUDGET_CREATED:          'budget_created',
  SUBSCRIPTION_ADDED:      'subscription_added',
  DEBT_ADDED:              'debt_added',
  FINANCE_REPORT_VIEWED:   'finance_report_viewed',
  FINANCE_AI_USED:         'finance_ai_used',

  // Pomodoro
  POMODORO_STARTED:        'pomodoro_started',
  POMODORO_COMPLETED:      'pomodoro_completed',
  POMODORO_ABORTED:        'pomodoro_aborted',

  // Knowledge
  NOTE_CREATED:            'note_created',
  COURSE_STARTED:          'course_started',
  COURSE_LESSON_COMPLETED: 'course_lesson_completed',

  // Studio
  MEDIA_ITEM_ADDED:        'media_item_added',
  MEDIA_STATUS_CHANGED:    'media_status_changed',

  // AI
  AI_ANALYSIS_TRIGGERED:   'ai_analysis_triggered',
  AI_ACTION_TAKEN:         'ai_action_taken',
  AI_REFRESHED:            'ai_refreshed',

  // Settings
  LANGUAGE_CHANGED:        'language_changed',
  THEME_CHANGED:           'theme_changed',
  AI_MODE_CHANGED:         'ai_mode_changed',

  // Resources
  RESOURCE_CREATED:        'resource_created',
  RESOURCE_ARCHIVED:       'resource_archived',

  // CRM
  CUSTOMER_CREATED:        'customer_created',
  CASE_CREATED:            'case_created',

  // Module unlock
  MODULE_UNLOCK_VIEWED:    'module_unlock_viewed',
  MODULE_UNLOCKED:         'module_unlocked',

  // Command center
  COMMAND_CENTER_OPENED:   'command_center_opened',
  COMMAND_EXECUTED:        'command_executed',

  // Weekly review
  WEEKLY_REVIEW_STARTED:   'weekly_review_started',
  WEEKLY_REVIEW_COMPLETED: 'weekly_review_completed',

  // Graph
  RELATION_GRAPH_VIEWED:   'relation_graph_viewed',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];

// ── Init ──────────────────────────────────────────────────────────────────────

let _initialised = false;

export function initAnalytics(): void {
  const key  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined;
  const host = import.meta.env.VITE_POSTHOG_HOST as string | undefined;

  if (!key) return; // silently skip if no key configured

  posthog.init(key, {
    api_host:                 host ?? 'https://us.i.posthog.com',
    person_profiles:          'identified_only',  // no anonymous profiles stored
    capture_pageview:         false,              // we handle page views manually
    capture_pageleave:        true,
    autocapture:              true,               // clicks, inputs, forms
    session_recording: {
      maskAllInputs: true,                        // GDPR: never record passwords
    },
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.debug();
    },
  });

  _initialised = true;
}

// ── User identity ─────────────────────────────────────────────────────────────

export function identify(userId: string, props?: {
  email?: string;
  name?: string;
  created_at?: string;
  plan?: string;
}): void {
  if (!_initialised) return;
  posthog.identify(userId, props);
}

export function analyticsReset(): void {
  if (!_initialised) return;
  posthog.reset();
}

// ── Page views ────────────────────────────────────────────────────────────────

export function capturePageView(path: string): void {
  if (!_initialised) return;
  posthog.capture('$pageview', { $current_url: path });
}

// ── Event tracking ────────────────────────────────────────────────────────────

export function capture(
  event: EventName | string,
  properties?: Record<string, unknown>,
): void {
  if (!_initialised) return;
  posthog.capture(event, properties);
}

// ── Feature flags ─────────────────────────────────────────────────────────────

export function isFeatureEnabled(flag: string): boolean {
  if (!_initialised) return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}

export function getFeatureFlag(flag: string): string | boolean | undefined {
  if (!_initialised) return undefined;
  return posthog.getFeatureFlag(flag);
}

// re-export posthog instance for advanced use
export { posthog };
