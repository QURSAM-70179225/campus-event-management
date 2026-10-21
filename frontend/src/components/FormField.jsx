import { useId } from 'react';

/** Label + input/select/textarea + error/hint text, wired up for screen readers. */
export default function FormField({ label, error, hint, as = 'input', className = '', children, ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const Component = as;
  const base = as === 'textarea' ? 'input min-h-28 resize-y' : 'input';

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children ? (
        children({ id, describedBy, invalid: Boolean(error) })
      ) : (
        <Component
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${base} ${error ? 'input-error' : ''}`}
          {...props}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
