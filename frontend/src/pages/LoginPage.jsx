import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicineBottleIcon from '../components/icons/MedicineBottleIcon';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('pharmacist');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(username, password, role);
        setInfo('Account created — you can now log in.');
        setMode('login');
        setPassword('');
      } else {
        await login(username, password);
        navigate('/', { replace: true });
      }
    } catch (err) {
      const apiMessage = err.response?.data?.error;
      const details = err.response?.data?.details;
      setError(apiMessage || (details && details[0]?.msg) || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm">
            <MedicineBottleIcon className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">MediTrack</h1>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {isRegister ? 'Create your first-time account' : 'Sign in to the pharmacist dashboard'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="pharmacist">Pharmacist</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
          >
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
            setInfo('');
          }}
          className="mt-4 w-full text-center text-sm text-sky-600 hover:text-sky-500"
        >
          {isRegister ? 'Already have an account? Log in' : "First time here? Create an account"}
        </button>
      </div>
    </div>
  );
}
