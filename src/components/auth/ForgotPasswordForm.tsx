import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  handleForgot: (e: React.FormEvent) => Promise<void>;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  setEmail,
  loading,
  handleForgot,
}) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleForgot} className="space-y-5">
      <div>
        <Label htmlFor="email">{t('auth.emailLabel')}</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
      </div>
      <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold" disabled={loading}>{loading ? t('auth.loading') : t('auth.resetButton')}</Button>
    </form>
  );
};

export default ForgotPasswordForm;