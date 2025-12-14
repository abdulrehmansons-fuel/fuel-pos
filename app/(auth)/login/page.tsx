'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fuel, Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { loginApi } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'admin' as 'admin' | 'employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoading(true);
    setError('');

    try {
      const user = await loginApi({
        username: formData.username,
        password: formData.password
      });

      if (user.role === 'admin') {
        toast.success(`Welcome back, ${user.fullName}!`);
        router.push('/admin/dashboard');
      } else {
        toast.success(`Welcome back, ${user.fullName}!`);
        // Redirect to employer dashboard
        router.push('/employer/dashboard');
      }

      router.refresh();

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid username or password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-teal-50 via-background to-cyan-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-md mx-4 backdrop-blur-sm bg-card/95 shadow-2xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-75 animate-pulse"></div>
              <div className="relative p-4 rounded-full bg-gradient-to-r from-primary to-accent">
                <Fuel className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Petrol POS
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sign in to your account to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5" method="post">
            {error && formData.username && formData.password && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            {/* User Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.userType === 'admin' ? 'default' : 'outline'}
                  className={`h-12 transition-all duration-200 ${formData.userType === 'admin'
                    ? 'bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30'
                    : 'hover:border-primary/50'
                    }`}
                  onClick={() => handleInputChange('userType', 'admin')}
                  disabled={loading}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Admin
                </Button>
                <Button
                  type="button"
                  variant={formData.userType === 'employee' ? 'default' : 'outline'}
                  className={`h-12 transition-all duration-200 ${formData.userType === 'employee'
                    ? 'bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30'
                    : 'hover:border-primary/50'
                    }`}
                  onClick={() => handleInputChange('userType', 'employee')}
                  disabled={loading}
                >
                  <User className="mr-2 h-4 w-4" />
                  Employer
                </Button>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  autoComplete="username"

                  className="pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11 border-muted-foreground/20 focus:border-primary transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/30 transition-all duration-200 font-semibold text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
