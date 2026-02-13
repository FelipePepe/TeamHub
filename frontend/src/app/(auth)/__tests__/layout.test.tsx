import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthLayout from '../layout';

describe('auth/layout', () => {
  it('renderiza contenedor de autenticación', () => {
    render(
      <AuthLayout>
        <div>Contenido</div>
      </AuthLayout>
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});

