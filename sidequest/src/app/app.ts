import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <router-outlet />
      @if (groupId()) {
        <nav class="bottom-nav">
          <a class="bottom-nav__item"
             [routerLink]="['/group', groupId()]"
             routerLinkActive="bottom-nav__item--active"
             [routerLinkActiveOptions]="{ exact: true }">
            <span class="bottom-nav__bubble">
              <span class="bottom-nav__icon">⚔️</span>
            </span>
            <span class="bottom-nav__label">Home</span>
          </a>
          <a class="bottom-nav__item"
             [routerLink]="['/group', groupId(), 'quests']"
             routerLinkActive="bottom-nav__item--active">
            <span class="bottom-nav__bubble">
              <span class="bottom-nav__icon">📜</span>
            </span>
            <span class="bottom-nav__label">Quests</span>
          </a>
          <a class="bottom-nav__item"
             [routerLink]="['/group', groupId(), 'participants']"
             routerLinkActive="bottom-nav__item--active">
            <span class="bottom-nav__bubble">
              <span class="bottom-nav__icon">👥</span>
            </span>
            <span class="bottom-nav__label">Party</span>
          </a>
          <a class="bottom-nav__item"
             [routerLink]="['/group', groupId(), 'consequences']"
             routerLinkActive="bottom-nav__item--active">
            <span class="bottom-nav__bubble">
              <span class="bottom-nav__icon">🎲</span>
            </span>
            <span class="bottom-nav__label">Fate</span>
          </a>
        </nav>
      }
    </div>
  `,
  styles: [`
    /* Shell */
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: #fdf8f3;
      color: #2d2013;
    }

    /* ── Nav bar container ── */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: stretch;
      background: rgba(255, 252, 248, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1.5px solid #e8ddd0;
      padding-bottom: env(safe-area-inset-bottom);
      z-index: 100;
      box-shadow: 0 -4px 24px rgba(180,120,50,.08);
    }

    /* ── Each tab item ── */
    .bottom-nav__item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 10px 4px 8px;
      text-decoration: none;
      transition: opacity .15s;
    }

    /* ── The bubble that highlights on active ── */
    .bottom-nav__bubble {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 30px;
      border-radius: 999px;
      transition: background .18s ease, transform .15s ease;
    }

    .bottom-nav__icon {
      font-size: 1.3rem;
      line-height: 1;
      display: block;
      transition: transform .18s ease;
    }

    .bottom-nav__label {
      font-size: .65rem;
      font-weight: 700;
      letter-spacing: .04em;
      color: #b5a090;
      text-transform: uppercase;
      transition: color .18s;
    }

    /* ── Active state ── */
    .bottom-nav__item--active .bottom-nav__bubble {
      background: #fff3cc;
      transform: translateY(-2px);
    }

    .bottom-nav__item--active .bottom-nav__icon {
      transform: scale(1.15);
    }

    .bottom-nav__item--active .bottom-nav__label {
      color: #b97d0a;
    }
  `],
})
export class App {
  groupId = signal<string | null>(null);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const match = e.urlAfterRedirects.match(/\/group\/([^/]+)/);
        this.groupId.set(match ? match[1] : null);
      });
  }
}