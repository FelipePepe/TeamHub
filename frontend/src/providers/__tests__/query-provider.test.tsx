import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryProvider } from '../query-provider';

describe('query-provider', () => {
  it('renderiza children', () => {
    render(
      <QueryProvider>
        <div>QueryChild</div>
      </QueryProvider>
    );
    expect(screen.getByText('QueryChild')).toBeInTheDocument();
  });
});

