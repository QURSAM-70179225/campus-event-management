import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { validateLoginForm } from '../utils/validation';
import AuthShell from '../components/AuthShell';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { Spinner } from '../components/States';

/** Where to go after login: back to the page that required it, else the role's dashboard. */
function destinationFor(user, from) {
  const fromPath = from?.pathname;
  const usable = fromPath && !['/login', '/signup'].includes(fromPath);
  if (usable) {
    // A student shouldn't land on /admin (and vice versa)
    if (fromPath.startsWith('/admin') && user.role !== 'admin') return '/dashboard';
    if (fromPath.startsWith('/dashboard') && user.role === 'admin') return '/admin';
    return `${fromPath}${from.search || ''}`;
  }
  return user.role === 'admin' ? '/admin' : '/dashboard';
}

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
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
    const found = validateLoginForm(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const { user: loggedIn, message } = await login(values.email.trim(), values.password);
      toast.success(message);
      navigate(destinationFor(loggedIn, location.state?.from), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err, 'Login failed. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in with the email you registered with.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {formError}
          </div>
        )}
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
        <FormField label="Password" error={errors.password}>
          {(field) => (
            <PasswordInput
              {...field}
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={onChange}
            />
          )}
        </FormField>
        <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
          {submitting && <Spinner className="h-4 w-4" />}
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Don't have an account?{' '}
        <Link to="/signup" state={location.state} className="font-semibold text-violet hover:underline">
          Create a student account
        </Link>
      </p>
    </AuthShell>
  );
}
