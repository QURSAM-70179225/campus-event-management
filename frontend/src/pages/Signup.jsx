import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { passwordStrength, validateSignupForm } from '../utils/validation';
import AuthShell from '../components/AuthShell';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { Spinner } from '../components/States';

const STRENGTH = [
  { label: 'Too weak', color: 'bg-rose-500' },
  { label: 'Weak', color: 'bg-rose-500' },
  { label: 'Fair', color: 'bg-amber-500' },
  { label: 'Good', color: 'bg-emerald-500' },
  { label: 'Strong', color: 'bg-emerald-600' },
];

export default function Signup() {
  const { user, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && !submitting) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateSignupForm(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await signup({ ...values, name: values.name.trim(), email: values.email.trim() });
      toast.success('You can now register for events.', 'Account created');
      const from = location.state?.from;
      navigate(from?.pathname?.startsWith('/events/') ? from.pathname : '/dashboard', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Could not create your account.'));
      setSubmitting(false);
    }
  };

  const strength = values.password ? passwordStrength(values.password) : null;

  return (
    <AuthShell title="Create your student account" subtitle="It takes less than a minute.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {formError}
          </div>
        )}
        <FormField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="e.g. Ayesha Khan"
          value={values.name}
          onChange={onChange}
          error={errors.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@student.uol.edu.pk"
          value={values.email}
          onChange={onChange}
          error={errors.email}
        />
        <FormField label="Password" error={errors.password} hint="At least 8 characters with a letter and a number.">
          {(field) => (
            <PasswordInput {...field} name="password" autoComplete="new-password" value={values.password} onChange={onChange} />
          )}
        </FormField>
        {strength !== null && (
          <div className="-mt-2" aria-live="polite">
            <div className="flex gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? STRENGTH[strength].color : 'bg-line'}`} />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Password strength: {STRENGTH[strength].label}</p>
          </div>
        )}
        <FormField label="Confirm password" error={errors.confirmPassword}>
          {(field) => (
            <PasswordInput
              {...field}
              name="confirmPassword"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={onChange}
            />
          )}
        </FormField>
        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-violet hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
