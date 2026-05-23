import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GlassSelect } from './GlassSelect';

const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];

describe('GlassSelect keyboard navigation', () => {
  it('opens, navigates, selects, and closes with the keyboard', () => {
    const onChange = vi.fn();
    render(<GlassSelect value="one" onChange={onChange} options={options} />);

    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const firstOption = screen.getByRole('option', { name: 'One' });
    expect(document.activeElement).toBe(firstOption);

    fireEvent.keyDown(firstOption, { key: 'ArrowDown' });
    const secondOption = screen.getByRole('option', { name: 'Two' });
    expect(document.activeElement).toBe(secondOption);

    fireEvent.keyDown(secondOption, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes with Escape and returns focus to the trigger', () => {
    render(<GlassSelect value="one" onChange={vi.fn()} options={options} />);

    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'End' });

    const lastOption = screen.getByRole('option', { name: 'Three' });
    expect(document.activeElement).toBe(lastOption);

    fireEvent.keyDown(lastOption, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
