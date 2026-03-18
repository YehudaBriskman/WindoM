import { X } from 'lucide-react';
import type { TodoItem as TodoItemType } from '../../types/calendar';

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className={`todo-item-text ${todo.completed ? 'completed' : ''}`}>
        {todo.text}
      </span>
      <span
        onClick={() => onRemove(todo.id)}
        className="todo-item-remove"
      >
        <X size={14} />
      </span>
    </div>
  );
}
