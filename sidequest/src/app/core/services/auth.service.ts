import { Injectable, signal, computed } from '@angular/core';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ── State ─────────────────────────────────────────────────────────────────

  /** The currently signed-in Firebase user, or null if not authenticated. */
  readonly currentUser = signal<User | null>(null);

  /**
   * True while Firebase is resolving the initial auth state on page load.
   * Components should gate their UI on this to avoid a flash of "not logged in".
   */
  readonly loading = signal<boolean>(true);

  /** Convenience: true once loading is done AND a user is present. */
  readonly isLoggedIn = computed(() => !this.loading() && this.currentUser() !== null);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  constructor() {
    // onAuthStateChanged fires once immediately with the current user (or null),
    // then again on every login / logout. We use it as the single source of truth.
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
      this.loading.set(false);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Opens a Google sign-in popup.
   * Resolves with the signed-in User on success.
   * Throws on cancellation or error — callers should catch.
   */
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    // Request profile + email scopes (already default, but explicit is clearer)
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }

  /**
   * Signs the current user out.
   * The onAuthStateChanged listener above will set currentUser to null automatically.
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }
}
