import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PasskeyCredentialSummary } from 'app/core/auth/models/auth.model';

/**
 * Drives the in-app WebAuthn (passkey) ceremonies for applicants against Spring Security's built-in
 * endpoints (`/webauthn/register/options`, `/webauthn/register`, `/webauthn/authenticate/options`,
 * `/login/webauthn`) and manages credentials via `/api/auth/webauthn/passkeys`.
 *
 * TUM staff passkeys are handled separately through Keycloak; this service is only for the application's own
 * (applicant) sessions. All calls include credentials so the session cookie (carrying the ceremony challenge)
 * and the app access-token cookie are sent.
 */
@Injectable({ providedIn: 'root' })
export class WebAuthnService {
  private readonly http = inject(HttpClient);
  private readonly options = { withCredentials: true } as const;

  /** Registers a new passkey for the currently authenticated applicant. */
  async register(label: string): Promise<void> {
    this.assertSupported();
    const optionsJson = await firstValueFrom(
      this.http.post<PublicKeyCredentialCreationOptionsJSON>('/webauthn/register/options', {}, this.options),
    );

    const created = (await navigator.credentials.create({
      publicKey: this.toCreationOptions(optionsJson),
    })) as PublicKeyCredential | null;
    if (created === null) {
      throw new Error('Passkey creation was cancelled');
    }

    const response = created.response as AuthenticatorAttestationResponse;
    const credential = {
      id: created.id,
      rawId: bufferToBase64Url(created.rawId),
      response: {
        attestationObject: bufferToBase64Url(response.attestationObject),
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        transports: typeof response.getTransports === 'function' ? response.getTransports() : [],
      },
      type: created.type,
      clientExtensionResults: created.getClientExtensionResults(),
      authenticatorAttachment: created.authenticatorAttachment ?? undefined,
    };

    await firstValueFrom(this.http.post('/webauthn/register', { publicKey: { credential, label } }, this.options));
  }

  /** Authenticates the current browser via an existing passkey and establishes an app session. */
  async authenticate(): Promise<void> {
    this.assertSupported();
    const optionsJson = await firstValueFrom(
      this.http.post<PublicKeyCredentialRequestOptionsJSON>('/webauthn/authenticate/options', {}, this.options),
    );

    const assertion = (await navigator.credentials.get({
      publicKey: this.toRequestOptions(optionsJson),
    })) as PublicKeyCredential | null;
    if (assertion === null) {
      throw new Error('Passkey authentication was cancelled');
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    const credential = {
      id: assertion.id,
      rawId: bufferToBase64Url(assertion.rawId),
      response: {
        authenticatorData: bufferToBase64Url(response.authenticatorData),
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        signature: bufferToBase64Url(response.signature),
        userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
      },
      type: assertion.type,
      clientExtensionResults: assertion.getClientExtensionResults(),
      authenticatorAttachment: assertion.authenticatorAttachment ?? undefined,
    };

    await firstValueFrom(this.http.post('/login/webauthn', credential, this.options));
  }

  /** Lists the current applicant's registered passkeys. */
  async list(): Promise<PasskeyCredentialSummary[]> {
    return firstValueFrom(this.http.get<PasskeyCredentialSummary[]>('/api/auth/webauthn/passkeys', this.options));
  }

  /** Removes one of the current applicant's passkeys by credential id. */
  async remove(credentialId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/auth/webauthn/passkeys/${encodeURIComponent(credentialId)}`, this.options));
  }

  private assertSupported(): void {
    if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined' || !window.isSecureContext) {
      throw new Error('Passkeys are not supported in this browser context');
    }
  }

  private toCreationOptions(json: PublicKeyCredentialCreationOptionsJSON): PublicKeyCredentialCreationOptions {
    return {
      ...json,
      challenge: base64UrlToBuffer(json.challenge),
      user: { ...json.user, id: base64UrlToBuffer(json.user.id) },
      excludeCredentials: (json.excludeCredentials ?? []).map(credential => ({
        ...credential,
        id: base64UrlToBuffer(credential.id),
      })),
    } as PublicKeyCredentialCreationOptions;
  }

  private toRequestOptions(json: PublicKeyCredentialRequestOptionsJSON): PublicKeyCredentialRequestOptions {
    return {
      ...json,
      challenge: base64UrlToBuffer(json.challenge),
      allowCredentials: (json.allowCredentials ?? []).map(credential => ({
        ...credential,
        id: base64UrlToBuffer(credential.id),
      })),
    } as PublicKeyCredentialRequestOptions;
  }
}

/** Minimal shapes of Spring's option JSON (binary fields are base64url strings). */
interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string;
  user: { id: string; name: string; displayName: string };
  excludeCredentials?: { id: string; type: string; transports?: string[] }[];
  [key: string]: unknown;
}

interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string;
  allowCredentials?: { id: string; type: string; transports?: string[] }[];
  [key: string]: unknown;
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
