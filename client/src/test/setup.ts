import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill ResizeObserver for jsdom
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock PointerEvent which is not in jsdom but used by Radix UI
if (!window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.PointerEvent = PointerEvent as any;
}
