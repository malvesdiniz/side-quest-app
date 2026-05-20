import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService } from '../../core/services/group.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="home">

      <!-- Hero -->
      <div class="home__hero">
        <div class="home__orb"></div>
        <div class="home__sigil">⚔️</div>
        <h1 class="home__title">SideQuest</h1>
        <p class="home__tagline">Monthly challenges for you and your friends.<br>Complete quests. Face the consequences.</p>
      </div>

      <!-- Card -->
      <div class="home__card sq-card">
        <div class="home__card-header">
          <span class="home__card-icon">🗺️</span>
          <h2 class="home__card-title">Start a new adventure</h2>
        </div>

        @if (error()) {
          <div class="sq-error">{{ error() }}</div>
        }

        <div class="stack" style="gap: 18px;">
          <div>
            <label class="sq-label">Group name</label>
            <input
              type="text"
              placeholder="e.g. The Fellowship"
              [(ngModel)]="groupName"
              (keydown.enter)="createGroup()" />
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

          <button class="sq-btn sq-btn--primary" (click)="createGroup()" [disabled]="loading()">
            @if (loading()) {
              <span class="home__spinner"></span> Creating your group…
            } @else {
              ⚔️ &nbsp; Create Group
            }
          </button>
        </div>
      </div>

      <!-- Footer hint -->
      <p class="home__hint">
        Already have a group? Ask your friend to share their link with you.
      </p>

      <!-- Decorative pills -->
      <div class="home__pills">
        <span class="home__pill">📜 Monthly quests</span>
        <span class="home__pill">🎲 Real consequences</span>
        <span class="home__pill">👥 Play together</span>
      </div>

    </div>
  `,
  styles: [`
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

    /* Soft ambient orb behind sigil */
    .home__orb {
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
      width: 180px;
      height: 180px;
      background: radial-gradient(ellipse at center, rgba(240,165,0,.22) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }

    .home__sigil {
      font-size: 3.8rem;
      display: block;
      margin-bottom: 10px;
      position: relative;
      animation: popIn .5s cubic-bezier(.34,1.56,.64,1) both;
    }

    .home__title {
      font-family: 'Lora', serif;
      font-size: 2.8rem;
      font-weight: 700;
      color: #2d2013;
      letter-spacing: -.01em;
      margin-bottom: 12px;
      position: relative;
    }

    .home__tagline {
      font-size: .95rem;
      font-weight: 500;
      color: #7c6a54;
      line-height: 1.6;
      max-width: 280px;
      margin: 0 auto;
    }

    /* ── Card ── */
    .home__card {
      width: 100%;
      max-width: 440px;
      padding: 28px 24px;
      animation: fadeUp .35s .1s ease both;
    }

    .home__card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .home__card-icon {
      font-size: 1.5rem;
      background: #fff3cc;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      flex-shrink: 0;
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

    /* Inline spinner inside button */
    .home__spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }

    /* ── Footer ── */
    .home__hint {
      margin-top: 20px;
      text-align: center;
      color: #b5a090;
      font-size: .85rem;
      font-weight: 500;
      max-width: 280px;
      line-height: 1.5;
      animation: fadeUp .35s .2s ease both;
    }

    /* ── Decorative pills ── */
    .home__pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      animation: fadeUp .35s .3s ease both;
    }

    .home__pill {
      background: #fff;
      border: 1.5px solid #e8ddd0;
      border-radius: 999px;
      padding: 6px 16px;
      font-size: .8rem;
      font-weight: 700;
      color: #7c6a54;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(180,120,50,.08);
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(.7); }
      to   { opacity: 1; transform: scale(1); }
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class HomeComponent {
  groupName = '';
  minQuests = 5;
  maxQuests = 10;
  loading = signal(false);
  error = signal('');

  constructor(private groupService: GroupService, private router: Router) {}

  async createGroup() {
    const name = this.groupName.trim();
    if (!name) { this.error.set('Give your group a name.'); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      const id = await this.groupService.createGroup(name, this.minQuests, this.maxQuests);
      this.router.navigate(['/group', id]);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Something went wrong.');
    } finally {
      this.loading.set(false);
    }
  }
}