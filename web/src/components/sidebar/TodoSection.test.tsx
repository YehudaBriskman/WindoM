import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoSection } from './TodoSection';
import type { TodoItem } from '../../types/calendar';

const hook = vi.hoisted(() => ({
  todos: [] as TodoItem[],
  loaded: true,
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  removeTodo: vi.fn(),
}));
vi.mock('../../hooks/useTodos', () => ({ useTodos: () => hook }));

function deferred() {
  let resolve!: (v: boolean) => void;
  const promise = new Promise<boolean>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  hook.todos = [{ id: 't1', text: 'Write tests', completed: false }];
  hook.loaded = true;
});

describe('TodoSection empty state', () => {
  it('says there are no tasks once loaded', () => {
    hook.todos = [];
    render(<TodoSection />);
    expect(screen.getByText('No tasks yet. Add one below.')).toBeTruthy();
  });

  it('claims nothing before the first read lands', () => {
    hook.todos = [];
    hook.loaded = false;
    render(<TodoSection />);
    expect(screen.queryByText(/No tasks yet/)).toBeNull();
  });
});

describe('TodoSection pending guard', () => {
  it('disables an item while its remove is in flight, then re-enables it', async () => {
    const write = deferred();
    hook.removeTodo.mockReturnValue(write.promise);
    render(<TodoSection />);
    const remove = screen.getByRole('button', { name: 'Remove todo' }) as HTMLButtonElement;

    fireEvent.click(remove);
    expect(remove.disabled).toBe(true);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(remove); // a disabled button ignores the second click
    expect(hook.removeTodo).toHaveBeenCalledTimes(1);

    await act(async () => write.resolve(true));
    expect(remove.disabled).toBe(false);
  });

  it('disables the add button while an add is in flight', async () => {
    const write = deferred();
    hook.addTodo.mockReturnValue(write.promise);
    render(<TodoSection />);
    fireEvent.change(screen.getByLabelText('New task'), { target: { value: 'Ship it' } });
    const add = screen.getByRole('button', { name: 'Add task' }) as HTMLButtonElement;

    fireEvent.click(add);
    expect(add.disabled).toBe(true);
    fireEvent.keyDown(screen.getByLabelText('New task'), { key: 'Enter' });
    expect(hook.addTodo).toHaveBeenCalledTimes(1);

    await act(async () => write.resolve(true));
    expect(add.disabled).toBe(false);
    expect((screen.getByLabelText('New task') as HTMLInputElement).value).toBe('');
  });
});
