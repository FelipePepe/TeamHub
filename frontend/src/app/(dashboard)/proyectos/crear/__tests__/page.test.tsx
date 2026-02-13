import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import CrearProyectoRedirectPage from '../page';

const routerMocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));

describe('proyectos/crear/page', () => {
  beforeEach(() => {
    routerMocks.replace.mockReset();
  });

  it('redirige al listado con modal crear', async () => {
    render(<CrearProyectoRedirectPage />);
    await waitFor(() => {
      expect(routerMocks.replace).toHaveBeenCalledWith('/proyectos?crear=1');
    });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

