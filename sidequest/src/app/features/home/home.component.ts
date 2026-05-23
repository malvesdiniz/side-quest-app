import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { UserGroupService } from '../../core/services/user-group.service';
import { UserGroup } from '../../core/models/user-group.model';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Sword,
  Map,
  ScrollText,
  Dice5,
  Users,
  LogIn,
  Link,
  ChevronRight,
  Compass,
} from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Sword,
        Map,
        ScrollText,
        Dice5,
        Users,
        LogIn,
        Link,
        ChevronRight,
        Compass,
      }),
    },
  ],
  template: `
    <div class="home">
      <!-- ── Hero ── -->
      <div class="home__hero">
        <div class="home__orb"></div>
        <div class="home__sigil"><lucide-icon name="sword" [size]="60" /></div>
        <h1 class="home__title">SideQuest</h1>
        <p class="home__tagline">
          Monthly challenges for you and your friends.<br />Complete quests. Face the consequences.
        </p>
      </div>

      <!-- ── Exactly one auth state is visible at a time ── -->
      @if (authService.loading()) {

        <!-- 1. Loading -->
        <div class="home__card sq-card home__card--center">
          <span class="home__spinner home__spinner--dark"></span>
        </div>

      } @else if (!authService.currentUser()) {

        <!-- 2. Logged out -->
        <div class="home__card sq-card">
          <div class="home__card-header">
            <span class="home__card-icon"><lucide-icon name="log-in" [size]="22" /></span>
            <h2 class="home__card-title">Sign in to get started</h2>
          </div>

          <p class="home__auth-sub">Create or join a group using your Google account.</p>

          @if (authError()) {
            <div class="sq-error" style="margin-top: 10px">{{ authError() }}</div>
          }

          <button class="home__google-btn" (click)="signIn()" [disabled]="authLoading()">
            @if (authLoading()) {
              <span class="home__spinner home__spinner--dark"></span> Signing in…
            } @else {
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                width="18"
                height="18"
              />
              Sign in with Google
            }
          </button>

          <p class="home__auth-hint">Your groups will appear here after signing in.</p>
        </div>

      } @else {

        <!-- 3. Logged in -->

        <!-- Create group card -->
        <div class="home__card sq-card">
          <div class="home__card-header">
            <span class="home__card-icon"><lucide-icon name="map" [size]="22" /></span>
            <h2 class="home__card-title">Start a new adventure</h2>
          </div>

          @if (createError()) {
            <div class="sq-error" style="margin-bottom: 14px">{{ createError() }}</div>
          }

          <div class="stack" style="gap: 16px;">
            <div>
              <label class="sq-label">Group name</label>
              <input
                type="text"
                placeholder="e.g. The Fellowship"
                [(ngModel)]="groupName"
                (keydown.enter)="createGroup()"
              />
            </div>
            <div class="home__two-col">
              <div>
                <label class="sq-label">Min quests / month</label>
                <input type="number" min="1" max="20" [(ngModel)]="minQuests" />
              </div>
              <div>
                <label class="sq-label">Max to assign</label>
                <input type="number" min="1" max="30" [(ngModel)]="maxQuests" />
              </div>
            </div>
            <button
              class="sq-btn sq-btn--primary"
              (click)="createGroup()"
              [disabled]="createLoading()"
            >
              @if (createLoading()) {
                <span class="home__spinner"></span> Creating…
              } @else {
                <lucide-icon name="sword" [size]="18" /> Create Group
              }
            </button>
          </div>
        </div>

        <!-- Join by code/link card -->
        <div class="home__card sq-card">
          <div class="home__card-header">
            <span class="home__card-icon"><lucide-icon name="link" [size]="22" /></span>
            <h2 class="home__card-title">Open a group</h2>
          </div>

          @if (joinError()) {
            <div class="sq-error" style="margin-bottom: 14px">{{ joinError() }}</div>
          }

          <div class="stack" style="gap: 12px;">
            <div>
              <label class="sq-label">Group code or link</label>
              <input
                type="text"
                placeholder="abc123 or https://…/group/abc123"
                [(ngModel)]="joinInput"
                (keydown.enter)="openGroup()"
              />
            </div>
            <button class="sq-btn sq-btn--ghost" (click)="openGroup()">Open group</button>
          </div>
        </div>

        <!-- My groups card — only rendered when currentUser() is guaranteed non-null -->
        <div class="home__card sq-card">
          <div class="home__card-header">
            <span class="home__card-icon"><lucide-icon name="users" [size]="22" /></span>
            <h2 class="home__card-title">Your groups</h2>
          </div>

          <!-- User row -->
          <div class="home__user-row">
            @if (authService.currentUser()!.photoURL) {
              <img
                class="home__user-photo"
                [src]="authService.currentUser()!.photoURL!"
                [alt]="authService.currentUser()!.displayName ?? ''"
                referrerpolicy="no-referrer"
              />
            } @else {
              <span class="home__user-avatar">
                {{
                  initials(
                    authService.currentUser()!.displayName ?? authService.currentUser()!.email ?? '?'
                  )
                }}
              </span>
            }
            <div class="home__user-meta">
              <span class="home__user-name">{{
                authService.currentUser()!.displayName ?? 'Google user'
              }}</span>
              <span class="home__user-email">{{ authService.currentUser()!.email }}</span>
            </div>
            <button class="home__sign-out" (click)="signOut()">Sign out</button>
          </div>

          <div class="home__divider"></div>

          <!-- Groups list -->
          @if (groupsLoading()) {
            <div class="home__list-loading">
              <span class="home__spinner home__spinner--dark"></span>
            </div>
          } @else if (userGroups().length === 0) {
            <div class="home__group-empty">
              <lucide-icon name="compass" [size]="32" />
              <p>You are not in any groups yet.<br />Open a group link to get started.</p>
            </div>
          } @else {
            <div class="home__groups-list">
              @for (g of userGroups(); track g.groupId) {
                <button class="home__group-item" (click)="goToGroup(g.groupId)">
                  <span class="home__group-name">{{ g.groupName }}</span>
                  <lucide-icon name="chevron-right" [size]="16" class="home__group-chevron" />
                </button>
              }
            </div>
          }
        </div>

      }
    </div>
  `,
  styles: [
    `
      .home {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 20px 48px;
        background: linear-gradient(180deg, #fff8ee 0%, #fdf8f3 60%);
      }

      /* ── Hero ── */
      .home__hero {
        position: relative;
        text-align: center;
        padding: 64px 20px 36px;
        width: 100%;
      }

      .home__orb {
        position: absolute;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 180px;
        height: 180px;
        background: radial-gradient(ellipse at center, rgba(240, 165, 0, 0.22) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
      }

      .home__sigil {
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
        position: relative;
        animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        color: var(--amber);
      }

      .home__title {
        font-family: 'Lora', serif;
        font-size: 2.8rem;
        font-weight: 700;
        color: #2d2013;
        letter-spacing: -0.01em;
        margin-bottom: 12px;
        position: relative;
      }

      .home__tagline {
        font-size: 0.95rem;
        font-weight: 500;
        color: #7c6a54;
        line-height: 1.6;
        max-width: 280px;
        margin: 0 auto;
      }

      /* ── Cards ── */
      .home__card {
        width: 100%;
        max-width: 440px;
        padding: 28px 24px;
        margin-bottom: 16px;
        animation: fadeUp 0.3s ease both;
      }

      .home__card--center {
        display: flex;
        justify-content: center;
        padding: 32px;
      }

      .home__card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .home__card-icon {
        background: #fff3cc;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        flex-shrink: 0;
        color: var(--amber-dark);
      }

      .home__card-title {
        font-family: 'Lora', serif;
        font-size: 1.2rem;
        font-weight: 700;
        color: #2d2013;
      }

      .home__two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      /* ── Spinners ── */
      .home__spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        flex-shrink: 0;
      }

      .home__spinner--dark {
        border-color: rgba(0, 0, 0, 0.1);
        border-top-color: var(--amber-dark, #b97d0a);
      }

      /* ── Auth card (not signed in) ── */
      .home__auth-sub {
        font-size: 0.9rem;
        color: var(--text-2, #7c6a54);
        line-height: 1.55;
        margin-bottom: 18px;
      }

      .home__auth-hint {
        margin-top: 16px;
        font-size: 0.8rem;
        color: var(--text-3, #b5a090);
        text-align: center;
        line-height: 1.5;
      }

      .home__google-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 12px 20px;
        background: #fff;
        border: 1.5px solid var(--border, #e8ddd0);
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text, #2d2013);
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
      }

      .home__google-btn:hover {
        border-color: #4285f4;
        box-shadow: 0 2px 10px rgba(66, 133, 244, 0.18);
      }

      .home__google-btn:disabled {
        opacity: 0.55;
        pointer-events: none;
      }

      /* ── User row ── */
      .home__user-row {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--bg-3, #f8f4ef);
        border-radius: 12px;
        padding: 10px 12px;
      }

      .home__user-photo {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 2px solid var(--border, #e8ddd0);
      }

      .home__user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--amber-light, #fff3cc);
        border: 2px solid var(--amber, #f0a500);
        color: var(--amber-dark, #b97d0a);
        font-weight: 800;
        font-size: 0.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .home__user-meta {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
      }

      .home__user-name {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--text, #2d2013);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .home__user-email {
        font-size: 0.72rem;
        color: var(--text-3, #b5a090);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .home__sign-out {
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--text-3, #b5a090);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.15s;
      }

      .home__sign-out:hover {
        color: var(--coral, #f97066);
      }

      /* ── Divider ── */
      .home__divider {
        height: 1px;
        background: var(--border, #e8ddd0);
        margin: 18px 0;
      }

      /* ── Groups list ── */
      .home__list-loading {
        display: flex;
        justify-content: center;
        padding: 12px 0;
      }

      .home__groups-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .home__group-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px 14px;
        background: var(--surface, #fff);
        border: 1.5px solid var(--border, #e8ddd0);
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        transition:
          border-color 0.15s,
          background 0.15s,
          box-shadow 0.15s;
      }

      .home__group-item:hover {
        border-color: var(--amber, #f0a500);
        background: #fffdf7;
        box-shadow: 0 2px 8px rgba(240, 165, 0, 0.1);
      }

      .home__group-name {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text, #2d2013);
      }

      .home__group-chevron {
        color: var(--text-3, #b5a090);
        flex-shrink: 0;
      }

      /* ── Empty state ── */
      .home__group-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 8px 0 4px;
        color: var(--text-3, #b5a090);
        text-align: center;
      }

      .home__group-empty p {
        font-size: 0.85rem;
        line-height: 1.55;
        color: var(--text-2, #7c6a54);
      }

      /* ── Decorative pills ── */
      .home__pills {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        margin-top: 8px;
        animation: fadeUp 0.3s 0.25s ease both;
      }

      .home__pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border: 1.5px solid #e8ddd0;
        border-radius: 999px;
        padding: 6px 16px;
        font-size: 0.8rem;
        font-weight: 700;
        color: #7c6a54;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(180, 120, 50, 0.08);
      }

      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.7);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  groupName = '';
  minQuests = 5;
  maxQuests = 10;
  createLoading = signal(false);
  createError = signal('');

  joinInput = '';
  joinError = signal('');

  authLoading = signal(false);
  authError = signal('');

  userGroups = signal<UserGroup[]>([]);
  groupsLoading = signal(false);

  constructor(
    private groupService: GroupService,
    private router: Router,
    readonly authService: AuthService,
    private userGroupService: UserGroupService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.waitForAuth();
    const user = this.authService.currentUser();
    if (user) {
      await this.loadUserGroups(user.uid);
    }
  }

  private waitForAuth(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.authService.loading()) {
        resolve();
        return;
      }
      const interval = setInterval(() => {
        if (!this.authService.loading()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  private async loadUserGroups(uid: string): Promise<void> {
    this.groupsLoading.set(true);
    try {
      const groups = await this.userGroupService.getUserGroups(uid);
      this.userGroups.set(groups);
    } catch {
      this.userGroups.set([]);
    } finally {
      this.groupsLoading.set(false);
    }
  }

  async signIn(): Promise<void> {
    this.authLoading.set(true);
    this.authError.set('');
    try {
      const user = await this.authService.signInWithGoogle();
      await this.loadUserGroups(user.uid);
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        this.authError.set(e?.message ?? 'Sign-in failed. Please try again.');
      }
    } finally {
      this.authLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.userGroups.set([]);
    this.groupName = '';
    this.joinInput = '';
    this.createError.set('');
    this.joinError.set('');
    this.authError.set('');
  }

  parseGroupId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/\/group\/([^/?#]+)/);
    return match ? match[1] : trimmed;
  }

  openGroup(): void {
    const id = this.parseGroupId(this.joinInput);
    if (!id) {
      this.joinError.set('Enter a group code or link.');
      return;
    }
    this.joinError.set('');
    this.router.navigate(['/group', id]);
  }

  goToGroup(groupId: string): void {
    this.router.navigate(['/group', groupId]);
  }

  async createGroup(): Promise<void> {
    const name = this.groupName.trim();
    if (!name) {
      this.createError.set('Give your group a name.');
      return;
    }
    if (this.minQuests < 1) {
      this.createError.set('Min quests must be at least 1.');
      return;
    }
    if (this.maxQuests < this.minQuests) {
      this.createError.set('Max to assign must be at least the min quests value.');
      return;
    }
    this.createLoading.set(true);
    this.createError.set('');
    try {
      const id = await this.groupService.createGroup(name, this.minQuests, this.maxQuests);
      this.router.navigate(['/group', id]);
    } catch (e: any) {
      this.createError.set(e?.message ?? 'Something went wrong.');
    } finally {
      this.createLoading.set(false);
    }
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
