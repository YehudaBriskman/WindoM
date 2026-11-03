import { useState, useCallback } from 'react';
import { useTodos } from '../../hooks/useTodos';
import { TodoItem } from './TodoItem';
import '../ui/feedback.css';

export function TodoSection() {
  const { todos, loaded, addTodo, toggleTodo, removeTodo } = useTodos();
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  // Ids with a toggle/remove write in flight. Their controls stay disabled
  // until the write settles, so a double click cannot act on one item twice.
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const runFor = useCallback(async (id: string, action: (id: string) => Promise<unknown>) => {
    setPending((prev) => new Set(prev).add(id));
    try {
      await action(id);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const handleToggle = useCallback((id: string) => void runFor(id, toggleTodo), [runFor, toggleTodo]);
  const handleRemove = useCallback((id: string) => void runFor(id, removeTodo), [runFor, removeTodo]);

  const handleAdd = useCallback(async () => {
    if (adding || !input.trim()) return;
    setAdding(true);
    try {
      await addTodo(input);
      setInput('');
    } finally {
      setAdding(false);
    }
  }, [adding, input, addTodo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') void handleAdd();
    },
    [handleAdd],
  );

  return (
    <div>
      <h3 className="todo-title">Today's Tasks</h3>
      <div className="todo-list">
        {todos.length === 0
          ? loaded && <p className="todo-empty">No tasks yet. Add one below.</p>
          : todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                pending={pending.has(todo.id)}
                onToggle={handleToggle}
                onRemove={handleRemove}
              />
            ))}
      </div>
      <div className="todo-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
          aria-label="New task"
          className="todo-input glass-input"
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          className="todo-add-btn"
          aria-label="Add task"
          disabled={adding}
        >
          +
        </button>
      </div>
    </div>
  );
}
