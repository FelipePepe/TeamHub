import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockTareasService = vi.hoisted(() => ({
  listByProyecto: vi.fn(),
  listByUsuario: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateEstado: vi.fn(),
  reasignar: vi.fn(),
  delete: vi.fn(),
}));

const mockToTareaResponse = vi.hoisted(() => vi.fn((t: any) => t));

vi.mock('../../middleware/auth.js', () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set('user', {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'admin@example.com',
      nombre: 'Admin',
      rol: 'ADMIN',
    });
    await next();
  }),
}));

vi.mock('../../services/tareas.service.js', () => ({
  tareasService: mockTareasService,
}));

vi.mock('../../services/mappers.js', () => ({
  toTareaResponse: mockToTareaResponse,
}));

// Import after mocks
import { tareasRoutes } from '../tareas.routes.js';
import type { HonoEnv } from '../../types/hono.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createApp = () => {
  const app = new Hono<HonoEnv>();
  app.route('/', tareasRoutes);
  return app;
};

const proyectoId = '550e8400-e29b-41d4-a716-446655440001';
const tareaId = '550e8400-e29b-41d4-a716-446655440002';
const usuarioId = '550e8400-e29b-41d4-a716-446655440003';

const mockTarea = {
  id: tareaId,
  proyectoId,
  titulo: 'Tarea Test',
  descripcion: 'Descripcion test',
  estado: 'TODO',
  prioridad: 'MEDIUM',
  usuarioAsignadoId: null,
  fechaInicio: null,
  fechaFin: null,
  horasEstimadas: null,
  horasReales: null,
  orden: 1,
  dependeDe: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// ── Tests ───────────────────────────────────────────────────────────
describe('tareas.routes', () => {
  let app: Hono<HonoEnv>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockToTareaResponse.mockImplementation((t: any) => t);
    app = createApp();
  });

  // ── GET /proyectos/:proyectoId/tareas ─────────────────────────────
  describe('GET /proyectos/:proyectoId/tareas', () => {
    it('returns list of tareas for a project', async () => {
      mockTareasService.listByProyecto.mockResolvedValue([mockTarea]);

      const res = await app.request(`/proyectos/${proyectoId}/tareas`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(body.data[0]).toEqual(mockTarea);
      expect(mockTareasService.listByProyecto).toHaveBeenCalledWith(
        proyectoId,
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('returns empty array when project has no tareas', async () => {
      mockTareasService.listByProyecto.mockResolvedValue([]);

      const res = await app.request(`/proyectos/${proyectoId}/tareas`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual([]);
    });

    it('returns 500/error for invalid UUID in proyectoId', async () => {
      const res = await app.request('/proyectos/not-a-uuid/tareas', {
        method: 'GET',
      });

      // Zod parseParams will throw for invalid UUID
      expect(res.status).not.toBe(200);
      expect(mockTareasService.listByProyecto).not.toHaveBeenCalled();
    });
  });

  // ── GET /usuarios/:usuarioId/tareas ───────────────────────────────
  describe('GET /usuarios/:usuarioId/tareas', () => {
    it('returns list of tareas for a user', async () => {
      mockTareasService.listByUsuario.mockResolvedValue([mockTarea]);

      const res = await app.request(`/usuarios/${usuarioId}/tareas`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(1);
      expect(mockTareasService.listByUsuario).toHaveBeenCalledWith(
        usuarioId,
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('returns empty array when user has no tareas', async () => {
      mockTareasService.listByUsuario.mockResolvedValue([]);

      const res = await app.request(`/usuarios/${usuarioId}/tareas`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toEqual([]);
    });
  });

  // ── GET /tareas/:id ───────────────────────────────────────────────
  describe('GET /tareas/:id', () => {
    it('returns a single tarea by ID', async () => {
      mockTareasService.getById.mockResolvedValue(mockTarea);

      const res = await app.request(`/tareas/${tareaId}`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(mockTarea);
      expect(mockTareasService.getById).toHaveBeenCalledWith(
        tareaId,
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('returns error for invalid UUID', async () => {
      const res = await app.request('/tareas/invalid-uuid', {
        method: 'GET',
      });

      expect(res.status).not.toBe(200);
      expect(mockTareasService.getById).not.toHaveBeenCalled();
    });
  });

  // ── POST /proyectos/:proyectoId/tareas ────────────────────────────
  describe('POST /proyectos/:proyectoId/tareas', () => {
    it('creates a tarea and returns 201', async () => {
      const newTarea = { ...mockTarea, titulo: 'Nueva Tarea' };
      mockTareasService.create.mockResolvedValue(newTarea);

      const res = await app.request(`/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: 'Nueva Tarea' }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.titulo).toBe('Nueva Tarea');
      expect(mockTareasService.create).toHaveBeenCalledWith(
        proyectoId,
        expect.objectContaining({ titulo: 'Nueva Tarea' }),
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('returns validation error when titulo is missing', async () => {
      const res = await app.request(`/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // titulo is required (min 1 char)
      expect(res.status).not.toBe(201);
      expect(mockTareasService.create).not.toHaveBeenCalled();
    });

    it('creates a tarea with all optional fields', async () => {
      const fullPayload = {
        titulo: 'Full Tarea',
        descripcion: 'Full description',
        estado: 'IN_PROGRESS',
        prioridad: 'HIGH',
        usuarioAsignadoId: usuarioId,
        fechaInicio: '2024-06-01',
        fechaFin: '2024-06-30',
        horasEstimadas: 40,
        horasReales: 10,
        orden: 5,
      };
      mockTareasService.create.mockResolvedValue({ ...mockTarea, ...fullPayload });

      const res = await app.request(`/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });

      expect(res.status).toBe(201);
      expect(mockTareasService.create).toHaveBeenCalledWith(
        proyectoId,
        expect.objectContaining(fullPayload),
        expect.any(Object),
      );
    });
  });

  // ── PUT /tareas/:id ───────────────────────────────────────────────
  describe('PUT /tareas/:id', () => {
    it('updates a tarea and returns 200', async () => {
      const updatedTarea = { ...mockTarea, titulo: 'Updated Title' };
      mockTareasService.update.mockResolvedValue(updatedTarea);

      const res = await app.request(`/tareas/${tareaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: 'Updated Title' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.titulo).toBe('Updated Title');
      expect(mockTareasService.update).toHaveBeenCalledWith(
        tareaId,
        expect.objectContaining({ titulo: 'Updated Title' }),
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('allows partial update with only some fields', async () => {
      const updatedTarea = { ...mockTarea, prioridad: 'URGENT' };
      mockTareasService.update.mockResolvedValue(updatedTarea);

      const res = await app.request(`/tareas/${tareaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prioridad: 'URGENT' }),
      });

      expect(res.status).toBe(200);
      expect(mockTareasService.update).toHaveBeenCalled();
    });
  });

  // ── PATCH /tareas/:id/estado ──────────────────────────────────────
  describe('PATCH /tareas/:id/estado', () => {
    it('updates the estado of a tarea', async () => {
      const updatedTarea = { ...mockTarea, estado: 'IN_PROGRESS' };
      mockTareasService.updateEstado.mockResolvedValue(updatedTarea);

      const res = await app.request(`/tareas/${tareaId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'IN_PROGRESS' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.estado).toBe('IN_PROGRESS');
      expect(mockTareasService.updateEstado).toHaveBeenCalledWith(
        tareaId,
        'IN_PROGRESS',
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('returns validation error for invalid estado value', async () => {
      const res = await app.request(`/tareas/${tareaId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'INVALID_STATE' }),
      });

      expect(res.status).not.toBe(200);
      expect(mockTareasService.updateEstado).not.toHaveBeenCalled();
    });

    it('accepts all valid estado values', async () => {
      const validEstados = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'];

      for (const estado of validEstados) {
        vi.clearAllMocks();
        mockToTareaResponse.mockImplementation((t: any) => t);
        mockTareasService.updateEstado.mockResolvedValue({ ...mockTarea, estado });

        const res = await app.request(`/tareas/${tareaId}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado }),
        });

        expect(res.status).toBe(200);
        expect(mockTareasService.updateEstado).toHaveBeenCalledWith(
          tareaId,
          estado,
          expect.any(Object),
        );
      }
    });
  });

  // ── PATCH /tareas/:id/asignar ─────────────────────────────────────
  describe('PATCH /tareas/:id/asignar', () => {
    it('reassigns a tarea to another user', async () => {
      const updatedTarea = { ...mockTarea, usuarioAsignadoId: usuarioId };
      mockTareasService.reasignar.mockResolvedValue(updatedTarea);

      const res = await app.request(`/tareas/${tareaId}/asignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioAsignadoId: usuarioId }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.usuarioAsignadoId).toBe(usuarioId);
      expect(mockTareasService.reasignar).toHaveBeenCalledWith(
        tareaId,
        usuarioId,
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('allows unassigning by passing null', async () => {
      const updatedTarea = { ...mockTarea, usuarioAsignadoId: null };
      mockTareasService.reasignar.mockResolvedValue(updatedTarea);

      const res = await app.request(`/tareas/${tareaId}/asignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioAsignadoId: null }),
      });

      expect(res.status).toBe(200);
      expect(mockTareasService.reasignar).toHaveBeenCalledWith(
        tareaId,
        null,
        expect.any(Object),
      );
    });

    it('returns validation error when usuarioAsignadoId is not a valid UUID', async () => {
      const res = await app.request(`/tareas/${tareaId}/asignar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioAsignadoId: 'not-a-uuid' }),
      });

      expect(res.status).not.toBe(200);
      expect(mockTareasService.reasignar).not.toHaveBeenCalled();
    });
  });

  // ── DELETE /tareas/:id ────────────────────────────────────────────
  describe('DELETE /tareas/:id', () => {
    it('deletes a tarea and returns success message', async () => {
      mockTareasService.delete.mockResolvedValue(undefined);

      const res = await app.request(`/tareas/${tareaId}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ message: 'Tarea eliminada' });
      expect(mockTareasService.delete).toHaveBeenCalledWith(
        tareaId,
        expect.objectContaining({ id: '550e8400-e29b-41d4-a716-446655440000' }),
      );
    });

    it('returns error for invalid UUID', async () => {
      const res = await app.request('/tareas/invalid', {
        method: 'DELETE',
      });

      expect(res.status).not.toBe(200);
      expect(mockTareasService.delete).not.toHaveBeenCalled();
    });
  });
});
