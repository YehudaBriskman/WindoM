import { useEffect, useState } from 'react';

interface Message {
  text: string;
  type: 'success' | 'error';
}

let _show: (msg: Message) => void = () => {};

/** Imperative API so hooks/callbacks can show messages without prop drilling */
export function showSettingsMessage(text: string, type: 'success' | 'error' = 'success') {
  _show({ text, type });
}

export function SettingsMessage() {
  const [msg, setMsg] = useState<Message | null>(null);

  useEffect(() => {
    _show = (m) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 3000);
    };
    return () => { _show = () => {}; };
  }, []);

  if (!msg) return null;

  return (
    <div className={`settings-message ${msg.type}`}>
      {msg.text}
    </div>
  );
}
