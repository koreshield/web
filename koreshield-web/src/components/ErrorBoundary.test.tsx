import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from './ErrorBoundary';

function ThrowingComponent({ message }: { message: string }): null {
  throw new Error(message);
}

describe('RouteErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/dashboard');
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('shows cache mismatch guidance for chunk load failures', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingComponent message="Failed to fetch dynamically imported module" />
      </RouteErrorBoundary>
    );

    expect(screen.getByText('Failed to load page')).toBeInTheDocument();
    expect(
      screen.getByText(/deployment or browser cache mismatch/i)
    ).toBeInTheDocument();
    expect(screen.getByText('/dashboard')).toBeInTheDocument();
    expect(screen.getByText(/ks-/i)).toBeInTheDocument();
  });

  it('shows extension interference guidance for injected script failures', () => {
    render(
      <RouteErrorBoundary>
        <ThrowingComponent message="lockdown-install.js removed intrinsics" />
      </RouteErrorBoundary>
    );

    expect(
      screen.getByText(/browser extension or injected script/i)
    ).toBeInTheDocument();
  });
});
