import { describe, it, expect } from 'vitest';
import { TaskList, TaskFormModal, TaskGanttChart } from '../index';

describe('tareas/index exports', () => {
  it('exporta componentes de tareas', () => {
    expect(TaskList).toBeDefined();
    expect(TaskFormModal).toBeDefined();
    expect(TaskGanttChart).toBeDefined();
  });
});
