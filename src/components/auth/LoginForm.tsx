import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  handleLogin,
}) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <Label htmlFor="email">{t('auth.emailLabel')}</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
      </div>
      <div>
        <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold" disabled={loading}>{loading ? t('auth.loading') : t('auth.loginButton')}</Button>
    </form>
  );
};

export default LoginForm;