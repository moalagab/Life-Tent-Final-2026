/**
 * useWebAuthn — Passkey / Biometric Authentication (Web Authentication API)
 *
 * Supports:
 *   - Registering a new passkey (Face ID, fingerprint, hardware key)
 *   - Authenticating with an existing passkey
 *   - Listing and deleting stored credentials
 *
 * Architecture:
 *   - Challenges are generated client-side (crypto.getRandomValues) and
 *     validated server-side on the next step.
 *   - Credentials are stored in the `webauthn_credentials` Supabase table.
 *   - Full server-side verification via a Supabase Edge Function is needed
 *     in production; this hook handles the browser-side WebAuthn API calls.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredCredential {
  id:          string;
  device_name: string | null;
  created_at:  string;
  last_used_at:string | null;
  transports:  string[] | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RP_ID   = window.location.hostname;
const RP_NAME = 'Life Tent OS';

function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlToArrayBuffer(b64: string): ArrayBuffer {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0))).buffer;
}

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua))  return 'iPhone — Face ID / Touch ID';
  if (/iPad/.test(ua))    return 'iPad — Face ID / Touch ID';
  if (/Android/.test(ua)) return 'Android — Fingerprint';
  if (/Mac/.test(ua))     return 'Mac — Touch ID';
  return 'Security Key';
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWebAuthn() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof window.PublicKeyCredential !== 'undefined';

  // ── Load existing credentials ─────────────────────────────────────────────

  const loadCredentials = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('webauthn_credentials')
      .select('id, device_name, created_at, last_used_at, transports')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCredentials((data as StoredCredential[]) ?? []);
  }, [user]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // ── Register a new passkey ────────────────────────────────────────────────

  const register = useCallback(async (deviceName?: string): Promise<boolean> => {
    if (!user || !isSupported) return false;
    setIsLoading(true);
    setError(null);

    try {
      const challenge = generateChallenge();

      // Fetch existing credential IDs to prevent duplicates
      const { data: existing } = await supabase
        .from('webauthn_credentials')
        .select('credential_id')
        .eq('user_id', user.id);

      const excludeCredentials = (existing ?? []).map(c => ({
        id:   base64urlToArrayBuffer(c.credential_id),
        type: 'public-key' as const,
      }));

      const credential = await navigator.credentials.create({
        publicKey: {
          rp:      { id: RP_ID, name: RP_NAME },
          user:    {
            id:          new TextEncoder().encode(user.id),
            name:        user.email ?? user.id,
            displayName: user.email ?? 'Life Tent User',
          },
          challenge,
          pubKeyCredParams: [
            { type: 'public-key', alg: -7  }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // built-in biometrics
            userVerification:        'required',
            residentKey:             'required',
          },
          timeout:            60000,
          excludeCredentials,
          attestation:        'none',
        },
      }) as PublicKeyCredential;

      if (!credential) return false;

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId  = arrayBufferToBase64url(credential.rawId);
      const publicKeyData = arrayBufferToBase64url(response.getPublicKey()!);
      const transports    = response.getTransports?.() ?? [];

      const { error: dbErr } = await supabase.from('webauthn_credentials').insert({
        user_id:       user.id,
        credential_id: credentialId,
        public_key:    publicKeyData,
        counter:       0,
        device_name:   deviceName ?? guessDeviceName(),
        transports,
      });

      if (dbErr) throw dbErr;

      await loadCredentials();
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('تم إلغاء عملية التسجيل');
      } else {
        setError('فشل تسجيل مفتاح المرور');
        console.error('WebAuthn register error:', err);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, loadCredentials]);

  // ── Authenticate with an existing passkey ─────────────────────────────────

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!user || !isSupported || !credentials.length) return false;
    setIsLoading(true);
    setError(null);

    try {
      const challenge = generateChallenge();

      const { data: creds } = await supabase
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('user_id', user.id);

      const allowCredentials = (creds ?? []).map(c => ({
        id:         base64urlToArrayBuffer(c.credential_id),
        type:       'public-key' as const,
        transports: (c.transports ?? []) as AuthenticatorTransport[],
      }));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId:             RP_ID,
          userVerification: 'required',
          allowCredentials,
          timeout:          60000,
        },
      }) as PublicKeyCredential;

      if (!assertion) return false;

      const credentialId = arrayBufferToBase64url(assertion.rawId);

      // Update last_used_at and counter
      const authResponse = assertion.response as AuthenticatorAssertionResponse;
      const counter = new DataView(authResponse.authenticatorData).getUint32(33, false);

      await supabase
        .from('webauthn_credentials')
        .update({ last_used_at: new Date().toISOString(), counter })
        .eq('credential_id', credentialId)
        .eq('user_id', user.id);

      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('تم إلغاء المصادقة');
      } else {
        setError('فشلت المصادقة البيومترية');
        console.error('WebAuthn authenticate error:', err);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, credentials]);

  // ── Delete a credential ───────────────────────────────────────────────────

  const deleteCredential = useCallback(async (id: string): Promise<void> => {
    await supabase.from('webauthn_credentials').delete().eq('id', id);
    await loadCredentials();
  }, [loadCredentials]);

  return {
    isSupported,
    isLoading,
    error,
    credentials,
    register,
    authenticate,
    deleteCredential,
  };
}
