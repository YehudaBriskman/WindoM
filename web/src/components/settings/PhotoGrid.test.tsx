import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PhotoGrid } from './PhotoGrid';
import type { PhotoRecord } from '../../types/photos';

const { showSettingsMessage } = vi.hoisted(() => ({ showSettingsMessage: vi.fn() }));
vi.mock('./SettingsMessage', () => ({ showSettingsMessage }));

const photo: PhotoRecord = {
  id: 'p1',
  imageUrl: 'data:,',
  thumbUrl: 'data:,',
  photographer: 'Ansel',
  photographerUrl: '',
  timestamp: 0,
  liked: false,
  source: 'local',
};

function deferred() {
  let resolve!: (v: boolean) => void;
  const promise = new Promise<boolean>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => vi.clearAllMocks());

describe('PhotoGrid pending guard and feedback', () => {
  it('disables like and delete while a like is in flight, then confirms it', async () => {
    const write = deferred();
    const onLike = vi.fn().mockReturnValue(write.promise);
    render(<PhotoGrid photos={[photo]} onLike={onLike} onSelect={vi.fn()} onDelete={vi.fn()} />);
    const like = screen.getByRole('button', { name: 'Like photo by Ansel' }) as HTMLButtonElement;
    const del = screen.getByRole('button', { name: 'Delete photo by Ansel' }) as HTMLButtonElement;

    fireEvent.click(like);
    expect(like.disabled).toBe(true);
    expect(del.disabled).toBe(true);
    fireEvent.click(like);
    expect(onLike).toHaveBeenCalledTimes(1);

    await act(async () => write.resolve(true));
    expect(like.disabled).toBe(false);
    expect(showSettingsMessage).toHaveBeenCalledWith('Added to liked photos', 'success');
  });

  it('reports a delete that did not save', async () => {
    const onDelete = vi.fn().mockResolvedValue(false);
    render(<PhotoGrid photos={[photo]} onLike={vi.fn()} onSelect={vi.fn()} onDelete={onDelete} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete photo by Ansel' }));
    });
    expect(showSettingsMessage).toHaveBeenCalledWith('Couldn’t delete that photo. Try again.', 'error');
  });

  it('reports a like that threw', async () => {
    const onLike = vi.fn().mockRejectedValue(new Error('quota'));
    render(<PhotoGrid photos={[photo]} onLike={onLike} onSelect={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Like photo by Ansel' }));
    });
    expect(showSettingsMessage).toHaveBeenCalledWith('Couldn’t save that like. Try again.', 'error');
  });
});
