import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout, { metadata } from '../layout';

vi.mock('@/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <div data-testid="providers">{children}</div>,
}));

describe('app/layout', () => {
  it('define metadata y estructura base', () => {
    expect(metadata.title).toBe('TeamHub');
    expect(metadata.description).toContain('TeamHub');

    const element = RootLayout({ children: <span>child</span> });
    expect(element.props.lang).toBe('es');
    expect(element.props.children.props.className).toContain('antialiased');
  });
});

