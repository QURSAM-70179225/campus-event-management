import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Password field with a show/hide toggle. Used inside FormField's render prop. */
export default function PasswordInput({ id, describedBy, invalid, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={`input pr-11 ${invalid ? 'input-error' : ''}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:bg-mist hover:text-ink"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
