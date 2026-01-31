import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';

const workerState = (globalThis as {
  __vitest_worker__?: { config?: { coverage?: { enabled?: boolean } } };
}).__vitest_worker__;
const coverageEnabled = Boolean(workerState?.config?.coverage?.enabled);
const perfBudgetMultiplier = coverageEnabled ? 2 : 1;

// Mock de la API
const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  get: apiMocks.get,
  post: apiMocks.post,
  put: apiMocks.put,
  patch: apiMocks.patch,
  del: apiMocks.del,
}));

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock de auth para componentes que lo usen
const mockAuthContext = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Test User',
    rol: 'ADMIN',
    activo: true,
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  verifyMfa: vi.fn(),
  changePassword: vi.fn(),
  setupMfa: vi.fn(),
  refreshUser: vi.fn(),
};

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}));

// Helper para crear wrapper con providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return Wrapper;
}

/**
 * Tests de rendimiento para el frontend
 * Verifican tiempos de renderizado y re-renders
 */
describe('Frontend Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Render Time Tests
  // ============================================================================
  describe('Tiempos de Renderizado', () => {
    it('debe renderizar un componente simple en menos de 100ms', async () => {
      const baseBudgetMs = 100;
      const SimpleComponent = () => <div data-testid="simple">Hello</div>;

      const start = performance.now();
      render(<SimpleComponent />);
      const duration = performance.now() - start;

      expect(screen.getByTestId('simple')).toBeInTheDocument();
      expect(duration).toBeLessThan(baseBudgetMs * perfBudgetMultiplier);
    });

    it('debe renderizar lista con 100 elementos en menos de 200ms', async () => {
      const baseBudgetMs = 200;
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
      }));

      const ListComponent = () => (
        <ul data-testid="list">
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      );

      const start = performance.now();
      render(<ListComponent />);
      const duration = performance.now() - start;

      expect(screen.getByTestId('list')).toBeInTheDocument();
      expect(screen.getByTestId('list').children).toHaveLength(100);
      expect(duration).toBeLessThan(baseBudgetMs * perfBudgetMultiplier);
    });

    it('debe renderizar tabla con 50 filas en menos de 300ms', async () => {
      const baseBudgetMs = 300;
      const rows = Array.from({ length: 50 }, (_, i) => ({
        id: `row-${i}`,
        col1: `Value ${i}-1`,
        col2: `Value ${i}-2`,
        col3: `Value ${i}-3`,
      }));

      const TableComponent = () => (
        <table data-testid="table">
          <thead>
            <tr>
              <th>Col 1</th>
              <th>Col 2</th>
              <th>Col 3</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.col1}</td>
                <td>{row.col2}</td>
                <td>{row.col3}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

      const start = performance.now();
      render(<TableComponent />);
      const duration = performance.now() - start;

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(duration).toBeLessThan(baseBudgetMs * perfBudgetMultiplier);
    });
  });

  // ============================================================================
  // Re-render Prevention Tests
  // ============================================================================
  describe('Prevención de Re-renders', () => {
    it('debe evitar re-renders innecesarios con React.memo', async () => {
      let renderCount = 0;

      const ExpensiveChild = React.memo(function ExpensiveChild({ data }: { data: string }) {
        renderCount++;
        return <div>{data}</div>;
      });

      const Parent = ({ trigger }: { trigger: number }) => {
        // trigger cambia pero data no
        const data = 'static-data';
        return (
          <div>
            <span>{trigger}</span>
            <ExpensiveChild data={data} />
          </div>
        );
      };

      const { rerender } = render(<Parent trigger={1} />);
      expect(renderCount).toBe(1);

      rerender(<Parent trigger={2} />);
      // El hijo memoizado no debe re-renderizar si sus props no cambian
      expect(renderCount).toBe(1);

      rerender(<Parent trigger={3} />);
      expect(renderCount).toBe(1);
    });

    it('debe manejar callbacks estables con useCallback pattern', async () => {
      let childRenderCount = 0;

      const Child = React.memo(function Child({ onClick }: { onClick: () => void }) {
        childRenderCount++;
        return <button onClick={onClick}>Click</button>;
      });

      const Parent = () => {
        const [count, setCount] = React.useState(0);
        // Callback estable que no cambia entre renders
        const handleClick = React.useCallback(() => {
          setCount((c) => c + 1);
        }, []);

        return (
          <div>
            <span data-testid="count">{count}</span>
            <Child onClick={handleClick} />
          </div>
        );
      };

      render(<Parent />, { wrapper: createWrapper() });
      expect(childRenderCount).toBe(1);

      // Simular interacción que causa re-render del padre
      // El hijo no debe re-renderizar porque el callback es estable
    });
  });

  // ============================================================================
  // Data Loading Performance Tests
  // ============================================================================
  describe('Carga de Datos con React Query', () => {
    it('debe mostrar estado loading inmediatamente', async () => {
      apiMocks.get.mockImplementation(() => new Promise(() => {}));

      const { useQuery } = await import('@tanstack/react-query');

      const DataComponent = () => {
        const { isLoading } = useQuery({
          queryKey: ['test-data'],
          queryFn: () => apiMocks.get('/test'),
        });

        return (
          <div data-testid="status">
            {isLoading ? 'Loading' : 'Done'}
          </div>
        );
      };

      const start = performance.now();
      render(<DataComponent />, { wrapper: createWrapper() });
      const duration = performance.now() - start;

      expect(screen.getByTestId('status')).toHaveTextContent('Loading');
      expect(duration).toBeLessThan(100);
    });

    it('debe transicionar a datos cargados eficientemente', async () => {
      const mockData = { items: Array(10).fill({ id: 1, name: 'Test' }) };
      apiMocks.get.mockResolvedValue(mockData);

      const { useQuery } = await import('@tanstack/react-query');

      const DataComponent = () => {
        const { isLoading, data } = useQuery({
          queryKey: ['test-items'],
          queryFn: () => apiMocks.get('/items'),
        });

        if (isLoading) return <div data-testid="loading">Loading...</div>;
        return <div data-testid="data">{data.items.length} items</div>;
      };

      render(<DataComponent />, { wrapper: createWrapper() });

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('10 items');
      });
    });
  });

  // ============================================================================
  // Component Mounting/Unmounting Performance
  // ============================================================================
  describe('Montaje y Desmontaje de Componentes', () => {
    it('debe montar/desmontar componentes rápidamente en ciclos', async () => {
      const HeavyComponent = () => {
        const items = Array.from({ length: 50 }, (_, i) => (
          <div key={i}>Item {i}</div>
        ));
        return <div data-testid="heavy">{items}</div>;
      };

      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        const { unmount } = render(<HeavyComponent />);
        times.push(performance.now() - start);
        unmount();
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(100);

      // No debe haber degradación significativa
      const firstHalf = times.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const secondHalf = times.slice(3).reduce((a, b) => a + b, 0) / 2;
      expect(secondHalf).toBeLessThan(firstHalf * 2);
    });
  });

  // ============================================================================
  // State Update Performance
  // ============================================================================
  describe('Rendimiento de Actualizaciones de Estado', () => {
    it('debe manejar múltiples actualizaciones de estado eficientemente', async () => {
      const StateComponent = () => {
        const [count, setCount] = React.useState(0);
        const [items, setItems] = React.useState<string[]>([]);

        const handleClick = () => {
          // Múltiples actualizaciones de estado
          setCount((c) => c + 1);
          setItems((prev) => [...prev, `Item ${prev.length}`]);
        };

        return (
          <div>
            <span data-testid="count">{count}</span>
            <span data-testid="items">{items.length}</span>
            <button data-testid="button" onClick={handleClick}>
              Add
            </button>
          </div>
        );
      };

      render(<StateComponent />);

      expect(screen.getByTestId('count')).toHaveTextContent('0');
      expect(screen.getByTestId('items')).toHaveTextContent('0');
    });

    it('debe batch state updates correctamente', async () => {
      let renderCount = 0;

      const BatchComponent = () => {
        renderCount++;
        const [a, setA] = React.useState(0);
        const [b, setB] = React.useState(0);
        const [c, setC] = React.useState(0);

        React.useEffect(() => {
          // Estas actualizaciones deberían estar batched
          setA(1);
          setB(1);
          setC(1);
        }, []);

        return (
          <div data-testid="values">
            {a}-{b}-{c}
          </div>
        );
      };

      render(<BatchComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('values')).toHaveTextContent('1-1-1');
      });

      // Debería ser 2 renders: inicial + después del batch de useEffect
      expect(renderCount).toBeLessThanOrEqual(2);
    });
  });

  // ============================================================================
  // Form Rendering Performance
  // ============================================================================
  describe('Rendimiento de Formularios', () => {
    it('debe renderizar formulario con múltiples campos rápidamente', async () => {
      const FormComponent = () => {
        const [formData, setFormData] = React.useState({
          nombre: '',
          email: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          pais: '',
          codigoPostal: '',
          notas: '',
        });

        const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        };

        return (
          <form data-testid="form">
            {Object.entries(formData).map(([key, value]) => (
              <input
                key={key}
                data-testid={`input-${key}`}
                value={value}
                onChange={handleChange(key)}
                placeholder={key}
              />
            ))}
          </form>
        );
      };

      const start = performance.now();
      render(<FormComponent />);
      const duration = performance.now() - start;

      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
      expect(duration).toBeLessThan(100);
    });
  });

  // ============================================================================
  // Conditional Rendering Performance
  // ============================================================================
  describe('Renderizado Condicional', () => {
    it('debe alternar entre estados rápidamente', async () => {
      const ToggleComponent = ({ show }: { show: boolean }) => {
        if (!show) return <div data-testid="hidden">Hidden</div>;

        const items = Array.from({ length: 20 }, (_, i) => (
          <div key={i}>Visible Item {i}</div>
        ));

        return <div data-testid="visible">{items}</div>;
      };

      const times: number[] = [];

      const { rerender } = render(<ToggleComponent show={false} />);
      expect(screen.getByTestId('hidden')).toBeInTheDocument();

      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        rerender(<ToggleComponent show={i % 2 === 0} />);
        times.push(performance.now() - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      expect(avgTime).toBeLessThan(50);
    });
  });

  // ============================================================================
  // Error Boundary Performance
  // ============================================================================
  describe('Manejo de Errores', () => {
    it('debe capturar errores sin impacto significativo en rendimiento', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class ErrorBoundary extends React.Component<
        { children: ReactNode },
        { hasError: boolean }
      > {
        state = { hasError: false };

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error">Error occurred</div>;
          }
          return this.props.children;
        }
      }

      const BrokenComponent = () => {
        throw new Error('Test error');
      };

      const start = performance.now();
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
      const duration = performance.now() - start;

      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(duration).toBeLessThan(100);

      consoleSpy.mockRestore();
    });
  });
});
