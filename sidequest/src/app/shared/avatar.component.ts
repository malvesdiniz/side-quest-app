import { Component, computed, input, linkedSignal } from '@angular/core';

type AvatarState = 'primary' | 'fallback' | 'initials';

/**
 * Renders a circular avatar with a three-level fallback chain:
 *   1. photoUrl  (custom Cloudinary upload)
 *   2. fallbackPhotoUrl  (Google profile photo)
 *   3. Initials derived from name
 *
 * State resets to the top of the chain whenever photoUrl changes.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img
        [src]="src()!"
        [alt]="name()"
        referrerpolicy="no-referrer"
        [class]="imgClass()"
        (error)="onError()"
      />
    } @else {
      <span [class]="initialsClass()">{{ initials() }}</span>
    }
  `,
  styles: [`
    :host { display: contents; }

    .sq-av {
      border-radius: 50%;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      line-height: 1;
      background: var(--amber-light, #fff3cc);
      border: 2px solid var(--amber, #f0a500);
      color: var(--amber-dark, #b97d0a);
    }

    .sq-av--img {
      object-fit: cover;
      background: var(--bg-2);
      border-color: var(--border);
    }

    .sq-av--sm { width: 32px; height: 32px; font-size: 0.72rem; }
    .sq-av--md { width: 36px; height: 36px; font-size: 0.75rem; }
    .sq-av--lg { width: 44px; height: 44px; font-size: 0.85rem; }
  `],
})
export class AvatarComponent {
  name             = input.required<string>();
  photoUrl         = input<string | null | undefined>(null);
  fallbackPhotoUrl = input<string | null | undefined>(null);
  size             = input<'sm' | 'md' | 'lg'>('md');

  // Resets to 'primary' whenever photoUrl changes; can be overridden via set().
  private state = linkedSignal<AvatarState>(() => {
    const p = this.photoUrl();
    const f = this.fallbackPhotoUrl();
    return p ? 'primary' : f ? 'fallback' : 'initials';
  });

  src = computed<string | null>(() => {
    switch (this.state()) {
      case 'primary':  return this.photoUrl()         || null;
      case 'fallback': return this.fallbackPhotoUrl() || null;
      default:         return null;
    }
  });

  initials    = computed(() =>
    this.name().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  );
  imgClass     = computed(() => `sq-av sq-av--img sq-av--${this.size()}`);
  initialsClass = computed(() => `sq-av sq-av--${this.size()}`);

  onError(): void {
    if (this.state() === 'primary' && this.fallbackPhotoUrl()) {
      this.state.set('fallback');
    } else {
      this.state.set('initials');
    }
  }
}
