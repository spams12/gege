import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { doc, setDoc } from 'firebase/firestore';

const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), { ssr: false });
const SignupForm = dynamic(() => import('@/components/auth/SignupForm'), { ssr: false });
const ForgotPasswordForm = dynamic(() => import('@/components/auth/ForgotPasswordForm'), { ssr: false });

const AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const router = useRouter(); // Changed from useNavigate
  const { userProfile, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Error and success states removed, will use toasts

  useEffect(() => {
    if (userProfile && !userLoading) {
      router.push('/'); // Changed from navigate
    }
  }, [userProfile, userLoading, router]); // Changed navigate to router

  const resetState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    // setError and setSuccess removed as states are removed
  };

  const getErrorMessage = (err: unknown) => {
    if (err instanceof FirebaseError) {
      const code = err.code;
      const translation = t(`authErrors.${code}`);
      if (translation && translation !== `authErrors.${code}`) {
        return translation;
      }
      if (code === 'auth/invalid-login-credentials') {
        return t('authErrors.auth/invalid-login-credentials');
      }
    }
    return typeof err === 'string' ? err : t('authErrors.internal-error') || 'An error occurred.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // setError(null); // Removed as error state is removed
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // router.push('/'); // Redirect on successful login, handled by useEffect now
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: t('auth.errorTitle', 'Error'), description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null); // Removed
    // setSuccess(null); // Removed
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: t('auth.errorTitle', 'Error'), description: t('auth.passwordsDoNotMatch', 'Passwords do not match') });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: t('auth.successTitle', 'Success'), description: t('auth.signupSuccess', 'Signup successful!') });
      await setDoc(doc(db, 'customers', userCredential.user.uid), {
              email: userCredential.user.email,
              uid: userCredential.user.uid,
            }, { merge: true });
      router.push('/user-info'); // Changed from navigate
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: t('auth.errorTitle', 'Error'), description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null); // Removed
    // setSuccess(null); // Removed
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: t('auth.successTitle', 'Success'), description: t('auth.resetEmailSent', 'Password reset email sent!') });
    } catch (err: unknown) {
      toast({ variant: 'destructive', title: t('auth.errorTitle', 'Error'), description: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  const Switcher = () => (
    <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
      {mode === 'login' && (
        <>
          <span>{t('auth.forgotTitle')}?{' '}</span>
            <button type="button" className="text-primary hover:underline" onClick={() => { setMode('forgot'); resetState(); }}>{t('auth.forgotTab')}</button>
          
          <br />
          <span>{t('auth.signupTitle')}?{' '}</span>
            <button type="button" className="text-primary hover:underline" onClick={() => { setMode('signup'); resetState(); }}>{t('auth.signupTab')}</button>
          
        </>
      )}
      {mode === 'signup' && (
        <>
          <span>{t('auth.loginTitle')}?{' '}</span>
            <button type="button" className="text-primary hover:underline" onClick={() => { setMode('login'); resetState(); }}>{t('auth.loginTab')}</button>
          
        </>
      )}
      {mode === 'forgot' && (
        <>
          <span>{t('auth.loginTitle')}?{' '}</span>
            <button type="button" className="text-primary hover:underline" onClick={() => { setMode('login'); resetState(); }}>{t('auth.loginTab')}</button>
          
        </>
      )}
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {mode === 'login' && t('auth.loginTitle')}
            {mode === 'signup' && t('auth.signupTitle')}
            {mode === 'forgot' && t('auth.forgotTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-6 border-b border-border" />
          {/* Error and success messages are now handled by toasts */}
          <React.Suspense fallback={<div>Loading...</div>}>
            {mode === 'login' && (
              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                loading={loading}
                handleLogin={handleLogin}
              />
            )}
            {mode === 'signup' && (
              <SignupForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                loading={loading}
                handleSignup={handleSignup}
              />
            )}
            {mode === 'forgot' && (
              <ForgotPasswordForm
                email={email}
                setEmail={setEmail}
                loading={loading}
                handleForgot={handleForgot}
              />
            )}
          </React.Suspense>
          <Switcher />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;