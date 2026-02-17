import { useState, useEffect, useCallback } from 'react';
import { syncStorage } from '../lib/chrome-storage';
import type { TodoItem } from '../types/calendar';

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Load on mount
  useEffect(() => {
    syncStorage.get<TodoItem[]>('todos', []).then(setTodos);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const unsub = syncStorage.onChange((changes) => {
      if (changes.todos) setTodos(changes.todos.newValue as TodoItem[]);
    });
    return unsub;
  }, []);

  const save = useCallback(async (next: TodoItem[]) => {
    setTodos(next);
    await syncStorage.set('todos', next);
  }, []);

  const addTodo = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const item: TodoItem = {
        id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        text: text.trim(),
        completed: false,
      };
      save([...todos, item]);
    },
    [todos, save],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      save(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    },
    [todos, save],
  );

  const removeTodo = useCallback(
    (id: string) => {
      save(todos.filter((t) => t.id !== id));
    },
    [todos, save],
  );

  return { todos, addTodo, toggleTodo, removeTodo };
}
