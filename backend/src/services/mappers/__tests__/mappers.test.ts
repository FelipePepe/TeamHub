import { describe, it, expect } from 'vitest';
import { resolveActiveState, toNumberOrUndefined } from '../utils.js';
import { toTareaResponse } from '../tareas.js';
import { toTimetrackingResponse } from '../timetracking.js';
import { toUserResponse, toDepartamentoResponse } from '../users.js';
import { toPlantillaResponse, toTareaPlantillaResponse } from '../plantillas.js';
import { toProyectoResponse, toAsignacionResponse } from '../proyectos.js';
import { toProcesoResponse, toTareaOnboardingResponse } from '../procesos.js';

// ─── Utils ───────────────────────────────────────────────────────────
describe('resolveActiveState', () => {
  it('returns true when activo is explicitly true', () => {
    expect(resolveActiveState({ activo: true, deletedAt: null })).toBe(true);
  });

  it('returns false when activo is explicitly false', () => {
    expect(resolveActiveState({ activo: false, deletedAt: null })).toBe(false);
  });

  it('returns true when activo is undefined and deletedAt is null', () => {
    expect(resolveActiveState({ deletedAt: null })).toBe(true);
  });

  it('returns true when activo is undefined and deletedAt is undefined', () => {
    expect(resolveActiveState({})).toBe(true);
  });

  it('returns false when activo is undefined and deletedAt is a Date', () => {
    expect(resolveActiveState({ deletedAt: new Date() })).toBe(false);
  });

  it('returns false when activo is undefined and deletedAt is a string', () => {
    expect(resolveActiveState({ deletedAt: '2024-01-01T00:00:00Z' })).toBe(false);
  });

  it('prefers activo boolean over deletedAt', () => {
    expect(resolveActiveState({ activo: true, deletedAt: new Date() })).toBe(true);
    expect(resolveActiveState({ activo: false, deletedAt: null })).toBe(false);
  });
});

describe('toNumberOrUndefined', () => {
  it('returns undefined for null', () => {
    expect(toNumberOrUndefined(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(toNumberOrUndefined(undefined)).toBeUndefined();
  });

  it('returns the number when given a number', () => {
    expect(toNumberOrUndefined(42)).toBe(42);
    expect(toNumberOrUndefined(0)).toBe(0);
    expect(toNumberOrUndefined(-5)).toBe(-5);
    expect(toNumberOrUndefined(3.14)).toBe(3.14);
  });

  it('parses valid numeric strings', () => {
    expect(toNumberOrUndefined('42')).toBe(42);
    expect(toNumberOrUndefined('3.14')).toBe(3.14);
    expect(toNumberOrUndefined('0')).toBe(0);
    expect(toNumberOrUndefined('-10')).toBe(-10);
  });

  it('returns undefined for empty string', () => {
    expect(toNumberOrUndefined('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only string', () => {
    expect(toNumberOrUndefined('   ')).toBeUndefined();
  });

  it('returns undefined for non-numeric string', () => {
    expect(toNumberOrUndefined('abc')).toBeUndefined();
  });

  it('returns undefined for other types', () => {
    expect(toNumberOrUndefined(true)).toBeUndefined();
    expect(toNumberOrUndefined({})).toBeUndefined();
    expect(toNumberOrUndefined([])).toBeUndefined();
  });
});

// ─── Tareas ──────────────────────────────────────────────────────────
describe('toTareaResponse', () => {
  const baseTarea = {
    id: 'tarea-1',
    proyectoId: 'proy-1',
    titulo: 'Mi tarea',
    descripcion: 'Descripción',
    estado: 'pendiente',
    prioridad: 'alta',
    usuarioAsignadoId: 'user-1',
    fechaInicio: '2024-01-01',
    fechaFin: '2024-01-31',
    horasEstimadas: '10',
    horasReales: '5',
    orden: '3',
    dependeDe: 'tarea-0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toTareaResponse(baseTarea);
    expect(result).toEqual({
      id: 'tarea-1',
      proyectoId: 'proy-1',
      titulo: 'Mi tarea',
      descripcion: 'Descripción',
      estado: 'pendiente',
      prioridad: 'alta',
      usuarioAsignadoId: 'user-1',
      fechaInicio: '2024-01-01',
      fechaFin: '2024-01-31',
      horasEstimadas: 10,
      horasReales: 5,
      orden: 3,
      dependeDe: 'tarea-0',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    });
  });

  it('converts numeric string fields to numbers', () => {
    const result = toTareaResponse({ ...baseTarea, horasEstimadas: '8.5', horasReales: '3', orden: '1' });
    expect(result.horasEstimadas).toBe(8.5);
    expect(result.horasReales).toBe(3);
    expect(result.orden).toBe(1);
  });

  it('handles null optional fields', () => {
    const result = toTareaResponse({
      ...baseTarea,
      descripcion: null,
      usuarioAsignadoId: null,
      fechaInicio: null,
      fechaFin: null,
      horasEstimadas: null,
      horasReales: null,
      orden: null,
      dependeDe: null,
    });
    expect(result.descripcion).toBeNull();
    expect(result.usuarioAsignadoId).toBeNull();
    expect(result.horasEstimadas).toBeUndefined();
    expect(result.horasReales).toBeUndefined();
    expect(result.orden).toBeUndefined();
  });
});

// ─── Timetracking ────────────────────────────────────────────────────
describe('toTimetrackingResponse', () => {
  const baseRegistro = {
    id: 'tt-1',
    usuarioId: 'user-1',
    proyectoId: 'proy-1',
    fecha: '2024-06-15',
    horas: '8',
    descripcion: 'Trabajo del día',
    facturable: true,
    estado: 'pendiente',
    aprobadoPor: null,
    aprobadoAt: null,
    rechazadoPor: null,
    rechazadoAt: null,
    comentarioRechazo: null,
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toTimetrackingResponse(baseRegistro);
    expect(result.id).toBe('tt-1');
    expect(result.usuarioId).toBe('user-1');
    expect(result.proyectoId).toBe('proy-1');
    expect(result.fecha).toBe('2024-06-15');
    expect(result.horas).toBe(8);
    expect(result.descripcion).toBe('Trabajo del día');
    expect(result.facturable).toBe(true);
    expect(result.estado).toBe('pendiente');
  });

  it('converts horas string to number', () => {
    const result = toTimetrackingResponse({ ...baseRegistro, horas: '4.5' });
    expect(result.horas).toBe(4.5);
  });

  it('handles horas as number directly', () => {
    const result = toTimetrackingResponse({ ...baseRegistro, horas: 7 } as any);
    expect(result.horas).toBe(7);
  });

  it('maps approval fields', () => {
    const result = toTimetrackingResponse({
      ...baseRegistro,
      estado: 'aprobado',
      aprobadoPor: 'manager-1',
      aprobadoAt: '2024-06-16T10:00:00Z',
    });
    expect(result.aprobadoPor).toBe('manager-1');
    expect(result.aprobadoAt).toBe('2024-06-16T10:00:00Z');
  });

  it('maps rejection fields', () => {
    const result = toTimetrackingResponse({
      ...baseRegistro,
      estado: 'rechazado',
      rechazadoPor: 'manager-1',
      rechazadoAt: '2024-06-16T10:00:00Z',
      comentarioRechazo: 'Horas incorrectas',
    });
    expect(result.rechazadoPor).toBe('manager-1');
    expect(result.rechazadoAt).toBe('2024-06-16T10:00:00Z');
    expect(result.comentarioRechazo).toBe('Horas incorrectas');
  });
});

// ─── Users ───────────────────────────────────────────────────────────
describe('toUserResponse', () => {
  const baseUser = {
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Juan',
    apellidos: 'García',
    rol: 'EMPLEADO',
    departamentoId: 'dep-1',
    managerId: 'user-0',
    activo: true,
    deletedAt: null,
  };

  it('maps all fields correctly', () => {
    const result = toUserResponse(baseUser);
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      nombre: 'Juan',
      apellidos: 'García',
      rol: 'EMPLEADO',
      departamentoId: 'dep-1',
      managerId: 'user-0',
      activo: true,
    });
  });

  it('converts null apellidos to undefined', () => {
    const result = toUserResponse({ ...baseUser, apellidos: null });
    expect(result.apellidos).toBeUndefined();
  });

  it('converts null departamentoId to undefined', () => {
    const result = toUserResponse({ ...baseUser, departamentoId: null });
    expect(result.departamentoId).toBeUndefined();
  });

  it('converts null managerId to undefined', () => {
    const result = toUserResponse({ ...baseUser, managerId: null });
    expect(result.managerId).toBeUndefined();
  });

  it('resolves active state from deletedAt when activo is undefined', () => {
    const { activo: _, ...withoutActivo } = baseUser;
    const result = toUserResponse({ ...withoutActivo, deletedAt: null });
    expect(result.activo).toBe(true);

    const result2 = toUserResponse({ ...withoutActivo, deletedAt: new Date() });
    expect(result2.activo).toBe(false);
  });
});

describe('toDepartamentoResponse', () => {
  const baseDep = {
    id: 'dep-1',
    nombre: 'Ingeniería',
    codigo: 'ING',
    descripcion: 'Departamento de ingeniería',
    responsableId: 'user-1',
    color: '#FF0000',
    activo: true,
    deletedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toDepartamentoResponse(baseDep);
    expect(result).toEqual({
      id: 'dep-1',
      nombre: 'Ingeniería',
      codigo: 'ING',
      descripcion: 'Departamento de ingeniería',
      responsableId: 'user-1',
      color: '#FF0000',
      activo: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    });
  });

  it('resolves active state from deletedAt', () => {
    const result = toDepartamentoResponse({ ...baseDep, activo: undefined, deletedAt: '2024-06-01' });
    expect(result.activo).toBe(false);
  });

  it('handles null optional fields', () => {
    const result = toDepartamentoResponse({
      ...baseDep,
      descripcion: null,
      responsableId: null,
      color: null,
    });
    expect(result.descripcion).toBeNull();
    expect(result.responsableId).toBeNull();
    expect(result.color).toBeNull();
  });
});

// ─── Plantillas ──────────────────────────────────────────────────────
describe('toPlantillaResponse', () => {
  const basePlantilla = {
    id: 'plan-1',
    nombre: 'Onboarding Dev',
    descripcion: 'Plantilla de onboarding',
    departamentoId: 'dep-1',
    rolDestino: 'EMPLEADO',
    duracionEstimadaDias: 30,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    activo: true,
    deletedAt: null,
  };

  it('maps all fields correctly', () => {
    const result = toPlantillaResponse(basePlantilla);
    expect(result).toEqual({
      id: 'plan-1',
      nombre: 'Onboarding Dev',
      descripcion: 'Plantilla de onboarding',
      departamentoId: 'dep-1',
      rolDestino: 'EMPLEADO',
      duracionEstimadaDias: 30,
      activo: true,
      createdBy: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    });
  });

  it('resolves active state from deletedAt when activo is undefined', () => {
    const result = toPlantillaResponse({ ...basePlantilla, activo: undefined, deletedAt: new Date() });
    expect(result.activo).toBe(false);
  });

  it('handles null optional fields', () => {
    const result = toPlantillaResponse({
      ...basePlantilla,
      descripcion: null,
      departamentoId: null,
      rolDestino: null,
      duracionEstimadaDias: null,
      createdBy: null,
    });
    expect(result.descripcion).toBeNull();
    expect(result.departamentoId).toBeNull();
    expect(result.rolDestino).toBeNull();
    expect(result.duracionEstimadaDias).toBeNull();
    expect(result.createdBy).toBeNull();
  });
});

describe('toTareaPlantillaResponse', () => {
  const baseTareaPlantilla = {
    id: 'tp-1',
    plantillaId: 'plan-1',
    titulo: 'Configurar entorno',
    descripcion: 'Instalar herramientas',
    categoria: 'tecnica',
    responsableTipo: 'manager',
    responsableId: 'user-1',
    diasDesdeInicio: 1,
    duracionEstimadaHoras: '4',
    orden: 1,
    obligatoria: true,
    requiereEvidencia: false,
    instrucciones: 'Seguir la guía',
    recursosUrl: ['https://docs.example.com'],
    dependencias: ['tp-0'],
  };

  it('maps all fields correctly', () => {
    const result = toTareaPlantillaResponse(baseTareaPlantilla);
    expect(result).toEqual({
      id: 'tp-1',
      plantillaId: 'plan-1',
      titulo: 'Configurar entorno',
      descripcion: 'Instalar herramientas',
      categoria: 'tecnica',
      responsableTipo: 'manager',
      responsableId: 'user-1',
      diasDesdeInicio: 1,
      duracionEstimadaHoras: 4,
      orden: 1,
      obligatoria: true,
      requiereEvidencia: false,
      instrucciones: 'Seguir la guía',
      recursosUrl: ['https://docs.example.com'],
      dependencias: ['tp-0'],
    });
  });

  it('converts duracionEstimadaHoras from string to number', () => {
    const result = toTareaPlantillaResponse({ ...baseTareaPlantilla, duracionEstimadaHoras: '2.5' });
    expect(result.duracionEstimadaHoras).toBe(2.5);
  });

  it('handles null optional fields', () => {
    const result = toTareaPlantillaResponse({
      ...baseTareaPlantilla,
      descripcion: null,
      responsableId: null,
      diasDesdeInicio: null,
      duracionEstimadaHoras: null,
      obligatoria: null,
      requiereEvidencia: null,
      instrucciones: null,
      recursosUrl: null,
      dependencias: null,
    });
    expect(result.descripcion).toBeNull();
    expect(result.responsableId).toBeNull();
    expect(result.duracionEstimadaHoras).toBeUndefined();
    expect(result.obligatoria).toBeNull();
    expect(result.recursosUrl).toBeNull();
    expect(result.dependencias).toBeNull();
  });
});

// ─── Proyectos ───────────────────────────────────────────────────────
describe('toProyectoResponse', () => {
  const baseProyecto = {
    id: 'proy-1',
    nombre: 'Proyecto Alpha',
    descripcion: 'Descripción del proyecto',
    codigo: 'ALPHA',
    cliente: 'Cliente X',
    fechaInicio: '2024-01-01',
    fechaFinEstimada: '2024-12-31',
    fechaFinReal: null,
    estado: 'en_progreso',
    managerId: 'user-1',
    presupuestoHoras: '1000',
    horasConsumidas: '250',
    prioridad: 'alta',
    color: '#00FF00',
    activo: true,
    deletedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toProyectoResponse(baseProyecto);
    expect(result).toEqual({
      id: 'proy-1',
      nombre: 'Proyecto Alpha',
      descripcion: 'Descripción del proyecto',
      codigo: 'ALPHA',
      cliente: 'Cliente X',
      fechaInicio: '2024-01-01',
      fechaFinEstimada: '2024-12-31',
      fechaFinReal: null,
      estado: 'en_progreso',
      managerId: 'user-1',
      presupuestoHoras: 1000,
      horasConsumidas: 250,
      prioridad: 'alta',
      color: '#00FF00',
      activo: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    });
  });

  it('converts numeric string fields', () => {
    const result = toProyectoResponse({ ...baseProyecto, presupuestoHoras: '500.5', horasConsumidas: '100' });
    expect(result.presupuestoHoras).toBe(500.5);
    expect(result.horasConsumidas).toBe(100);
  });

  it('resolves active state', () => {
    const result = toProyectoResponse({ ...baseProyecto, activo: undefined, deletedAt: '2024-06-01' });
    expect(result.activo).toBe(false);
  });

  it('handles null optional fields', () => {
    const result = toProyectoResponse({
      ...baseProyecto,
      descripcion: null,
      cliente: null,
      fechaInicio: null,
      fechaFinEstimada: null,
      presupuestoHoras: null,
      horasConsumidas: null,
      prioridad: null,
      color: null,
    });
    expect(result.descripcion).toBeNull();
    expect(result.cliente).toBeNull();
    expect(result.presupuestoHoras).toBeUndefined();
    expect(result.horasConsumidas).toBeUndefined();
  });
});

describe('toAsignacionResponse', () => {
  const baseAsignacion = {
    id: 'asig-1',
    proyectoId: 'proy-1',
    usuarioId: 'user-1',
    rol: 'developer',
    dedicacionPorcentaje: '100',
    horasSemanales: '40',
    fechaInicio: '2024-01-01',
    fechaFin: '2024-12-31',
    notas: 'Full time',
    activo: true,
    deletedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toAsignacionResponse(baseAsignacion);
    expect(result).toEqual({
      id: 'asig-1',
      proyectoId: 'proy-1',
      usuarioId: 'user-1',
      rol: 'developer',
      dedicacionPorcentaje: 100,
      horasSemanales: 40,
      fechaInicio: '2024-01-01',
      fechaFin: '2024-12-31',
      notas: 'Full time',
      activo: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    });
  });

  it('converts numeric string fields', () => {
    const result = toAsignacionResponse({ ...baseAsignacion, dedicacionPorcentaje: '50', horasSemanales: '20' });
    expect(result.dedicacionPorcentaje).toBe(50);
    expect(result.horasSemanales).toBe(20);
  });

  it('resolves active state', () => {
    const result = toAsignacionResponse({ ...baseAsignacion, activo: undefined, deletedAt: new Date() });
    expect(result.activo).toBe(false);
  });

  it('handles null optional fields', () => {
    const result = toAsignacionResponse({
      ...baseAsignacion,
      rol: null,
      dedicacionPorcentaje: null,
      horasSemanales: null,
      fechaFin: null,
      notas: null,
    });
    expect(result.rol).toBeNull();
    expect(result.dedicacionPorcentaje).toBeUndefined();
    expect(result.horasSemanales).toBeUndefined();
    expect(result.fechaFin).toBeNull();
    expect(result.notas).toBeNull();
  });
});

// ─── Procesos ────────────────────────────────────────────────────────
describe('toProcesoResponse', () => {
  const baseProceso = {
    id: 'proc-1',
    empleadoId: 'user-1',
    plantillaId: 'plan-1',
    fechaInicio: '2024-01-15',
    fechaFinEsperada: '2024-02-15',
    fechaFinReal: null,
    estado: 'en_progreso',
    progreso: '75',
    notas: 'Progresando bien',
    iniciadoPor: 'user-0',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toProcesoResponse(baseProceso);
    expect(result).toEqual({
      id: 'proc-1',
      empleadoId: 'user-1',
      plantillaId: 'plan-1',
      fechaInicio: '2024-01-15',
      fechaFinEsperada: '2024-02-15',
      fechaFinReal: null,
      estado: 'en_progreso',
      progreso: 75,
      notas: 'Progresando bien',
      iniciadoPor: 'user-0',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    });
  });

  it('converts progreso string to number', () => {
    const result = toProcesoResponse({ ...baseProceso, progreso: '50' });
    expect(result.progreso).toBe(50);
  });

  it('handles null optional fields', () => {
    const result = toProcesoResponse({
      ...baseProceso,
      fechaFinEsperada: null,
      fechaFinReal: null,
      progreso: null,
      notas: null,
      iniciadoPor: null,
    });
    expect(result.fechaFinEsperada).toBeNull();
    expect(result.progreso).toBeUndefined();
    expect(result.notas).toBeNull();
    expect(result.iniciadoPor).toBeNull();
  });
});

describe('toTareaOnboardingResponse', () => {
  const baseTareaOnboarding = {
    id: 'to-1',
    procesoId: 'proc-1',
    tareaPlantillaId: 'tp-1',
    titulo: 'Completar documentación',
    descripcion: 'Rellenar formularios de alta',
    categoria: 'administrativa',
    responsableId: 'user-1',
    fechaLimite: '2024-01-20',
    estado: 'pendiente',
    prioridad: 'alta',
    completadaAt: null,
    completadaPor: null,
    notas: null,
    evidenciaUrl: null,
    comentariosRechazo: null,
    orden: 1,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  };

  it('maps all fields correctly', () => {
    const result = toTareaOnboardingResponse(baseTareaOnboarding);
    expect(result).toEqual({
      id: 'to-1',
      procesoId: 'proc-1',
      tareaPlantillaId: 'tp-1',
      titulo: 'Completar documentación',
      descripcion: 'Rellenar formularios de alta',
      categoria: 'administrativa',
      responsableId: 'user-1',
      fechaLimite: '2024-01-20',
      estado: 'pendiente',
      prioridad: 'alta',
      completadaAt: null,
      completadaPor: null,
      notas: null,
      evidenciaUrl: null,
      comentariosRechazo: null,
      orden: 1,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    });
  });

  it('handles completed task fields', () => {
    const result = toTareaOnboardingResponse({
      ...baseTareaOnboarding,
      estado: 'completada',
      completadaAt: '2024-01-18T14:00:00Z',
      completadaPor: 'user-1',
      notas: 'Completada sin incidencias',
      evidenciaUrl: 'https://storage.example.com/doc.pdf',
    });
    expect(result.estado).toBe('completada');
    expect(result.completadaAt).toBe('2024-01-18T14:00:00Z');
    expect(result.completadaPor).toBe('user-1');
    expect(result.evidenciaUrl).toBe('https://storage.example.com/doc.pdf');
  });

  it('handles rejection fields', () => {
    const result = toTareaOnboardingResponse({
      ...baseTareaOnboarding,
      estado: 'rechazada',
      comentariosRechazo: 'Documentación incompleta',
    });
    expect(result.comentariosRechazo).toBe('Documentación incompleta');
  });

  it('handles null optional fields', () => {
    const result = toTareaOnboardingResponse({
      ...baseTareaOnboarding,
      tareaPlantillaId: null,
      descripcion: null,
      fechaLimite: null,
      prioridad: null,
      orden: null,
    });
    expect(result.tareaPlantillaId).toBeNull();
    expect(result.descripcion).toBeNull();
    expect(result.fechaLimite).toBeNull();
    expect(result.prioridad).toBeNull();
    expect(result.orden).toBeNull();
  });
});
