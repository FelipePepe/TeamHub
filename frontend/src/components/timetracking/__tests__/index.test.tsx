import { describe, it, expect } from 'vitest';
import {
  WeekNavigation,
  TimesheetCell,
  TimesheetGrid,
  CopyWeekDialog,
  GanttChart,
  GanttTooltip,
  GanttZoomControls,
} from '../index';

describe('timetracking/index exports', () => {
  it('exporta componentes de timetracking', () => {
    expect(WeekNavigation).toBeDefined();
    expect(TimesheetCell).toBeDefined();
    expect(TimesheetGrid).toBeDefined();
    expect(CopyWeekDialog).toBeDefined();
    expect(GanttChart).toBeDefined();
    expect(GanttTooltip).toBeDefined();
    expect(GanttZoomControls).toBeDefined();
  });
});
