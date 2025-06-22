import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SignupFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  loading: boolean;
  handleSignup: (e: React.FormEvent) => Promise<void>;
}

const SignupForm: React.FC<SignupFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  handleSignup,
}) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <div>
        <Label htmlFor="email">{t('auth.emailLabel')}</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
      </div>
      <div>
        <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</Label>
        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold" disabled={loading}>{loading ? t('auth.loading') : t('auth.signupButton')}</Button>
    </form>
  );
};

export default SignupForm;