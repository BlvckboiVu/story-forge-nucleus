import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoginForm } from '@/components/auth/LoginForm';
import { validateLoginForm } from '@/components/auth/LoginValidation';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, guestLogin } = useAuth();
  const { toast } = useToast();
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (email: string, password: string) => {
    const validationErrors = validateLoginForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        navigate('/app/dashboard');
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      } else {
        setErrors({ general: result.error || 'Sign in failed' });
        toast({
          title: 'Error',
          description: result.error || 'Sign in failed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrors({});
    setLoading(true);

    try {
      const result = await guestLogin();
      
      if (result.success) {
        navigate('/app/dashboard');
        toast({
          title: 'Welcome!',
          description: result.warning || 'You are now logged in as a guest.',
        });
      } else {
        setErrors({ general: result.error || 'Guest login failed' });
        toast({
          title: 'Error',
          description: result.error || 'Guest login failed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm
            onSubmit={handleSubmit}
            loading={loading}
            errors={errors}
            onErrorChange={clearError}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGuestLogin}
            disabled={loading}
          >
            Continue as Guest
          </Button>

          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
