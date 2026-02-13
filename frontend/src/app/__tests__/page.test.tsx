import { describe, it, expect, vi } from 'vitest';
import HomePage from '../page';

const navMocks = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock('next/navigation', () => navMocks);

describe('app/page', () => {
  it('redirige a login', () => {
    HomePage();
    expect(navMocks.redirect).toHaveBeenCalledWith('/login');
  });
});

