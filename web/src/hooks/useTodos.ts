import { useState, useEffect, useCallback } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import type { TodoItem } from '../types/calendar';

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  // False until the first read lands, so "no tasks" is not claimed before we know.
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    syncStorage.get<TodoItem[]>('todos', []).then((stored) => {
      setTodos(stored);
      setLoaded(true);
    });
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      if (changes.todos) setTodos(changes.todos.newValue as TodoItem[]);
    });
    return unsub;
  }, []);

  // Resolves once the write has landed (true) or failed (false), so callers
  // can hold a control disabled while it is in flight.
  const save = useCallback(async (next: TodoItem[]): Promise<boolean> => {
    setTodos(next);
    return syncStorage.set('todos', next);
  }, []);

  const addTodo = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text.trim()) return false;
      const item: TodoItem = {
        id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        text: text.trim(),
        completed: false,
      };
      return save([...todos, item]);
    },
    [todos, save],
  );

  const toggleTodo = useCallback(
    (id: string): Promise<boolean> => {
      return save(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    },
    [todos, save],
  );

  const removeTodo = useCallback(
    (id: string): Promise<boolean> => {
      return save(todos.filter((t) => t.id !== id));
    },
    [todos, save],
  );

  return { todos, loaded, addTodo, toggleTodo, removeTodo };
}
