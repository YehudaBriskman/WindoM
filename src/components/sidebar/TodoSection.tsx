import { useState, useCallback } from 'react';
import { useTodos } from '../../hooks/useTodos';
import { TodoItem } from './TodoItem';

export function TodoSection() {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodos();
  const [input, setInput] = useState('');

  const handleAdd = useCallback(() => {
    if (!input.trim()) return;
    addTodo(input);
    setInput('');
  }, [input, addTodo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd();
    },
    [handleAdd],
  );

  return (
    <div>
      <h3 className="todo-title">Today's Tasks</h3>
      <div className="todo-list">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onRemove={removeTodo} />
        ))}
      </div>
      <div className="todo-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
          className="todo-input glass-input"
        />
        <button onClick={handleAdd} className="todo-add-btn">
          +
        </button>
      </div>
    </div>
  );
}
