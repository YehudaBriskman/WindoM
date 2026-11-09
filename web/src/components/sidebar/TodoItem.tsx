import { X } from 'lucide-react';
import type { TodoItem as TodoItemType } from '../../types/calendar';

interface TodoItemProps {
  todo: TodoItemType;
  /** A write for this item is in flight: its controls stay disabled until it settles. */
  pending?: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TodoItem({ todo, pending = false, onToggle, onRemove }: TodoItemProps) {
  return (
    <div className="todo-item" aria-busy={pending || undefined}>
      <input
        type="checkbox"
        aria-label={todo.text}
        checked={todo.completed}
        disabled={pending}
        onChange={() => onToggle(todo.id)}
      />
      <span className={`todo-item-text ${todo.completed ? 'completed' : ''}`}>{todo.text}</span>
      <button
        type="button"
        onClick={() => onRemove(todo.id)}
        className="todo-item-remove"
        aria-label={`Remove task: ${todo.text}`}
        disabled={pending}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
