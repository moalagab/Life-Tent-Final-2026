export type SubscriptionPlan   = 'free' | 'pro' | 'business';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type UserFilter         = 'all' | 'pro' | 'business' | 'free' | 'banned';

/** Row returned by get_admin_users() RPC */
export interface AdminUser {
  id:                   string;           // profiles.id
  user_id:              string;           // auth.users.id
  email:                string;           // from auth.users
  full_name:            string | null;
  avatar_url:           string | null;
  is_admin:             boolean;
  is_banned:            boolean;
  banned_at:            string | null;
  banned_reason:        string | null;
  created_at:           string;
  updated_at:           string;
  plan:                 SubscriptionPlan;
  subscription_status:  SubscriptionStatus | null;
}

export interface AdminStats {
  total_users:          number;
  active_today:         number;
  active_this_week:     number;
  new_this_month:       number;
  pro_subscribers:      number;
  business_subscribers: number;
  banned_users:         number;
  total_subscriptions:  number;
}

export interface AdminUsersResult {
  users: AdminUser[];
  total: number;
}
