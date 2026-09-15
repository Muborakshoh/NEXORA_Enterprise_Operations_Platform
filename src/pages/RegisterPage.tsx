/**
 * Register Page
 * 
 * User registration page with validation.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Mock registration - in real app this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store user data
      const userData = {
        id: 'user-' + Date.now(),
        name: formData.name,
        email: formData.email,
        organization: formData.organizationName,
      };

      localStorage.setItem('nexora_user', JSON.stringify(userData));
      localStorage.setItem('nexora_auth_token', 'mock-token-' + Date.now());

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', color: 'bg-red-500', width: '33%' };
    if (strength <= 3) return { level: 'medium', color: 'bg-yellow-500', width: '66%' };
    return { level: 'strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 p-4">
      <div className="max-w-md w-full bg-surface-1 border border-border-subtle rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">NEXORA</h1>
          <p className="text-text-muted mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-surface-2 border rounded-lg text-text-primary focus:outline-none focus:border-accent-500 ${
                validationErrors.name ? 'border-red-500' : 'border-border-subtle'
              }`}
              placeholder="John Doe"
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 bg-surface-2 border rounded-lg text-text-primary focus:outline-none focus:border-accent-500 ${
                validationErrors.email ? 'border-red-500' : 'border-border-subtle'
              }`}
              placeholder="john@company.com"
            />
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
            )}
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              className={`w-full px-3 py-2 bg-surface-2 border rounded-lg text-text-primary focus:outline-none focus:border-accent-500 ${
                validationErrors.organizationName ? 'border-red-500' : 'border-border-subtle'
              }`}
              placeholder="Acme Corporation"
            />
            {validationErrors.organizationName && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.organizationName}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 pr-10 bg-surface-2 border rounded-lg text-text-primary focus:outline-none focus:border-accent-500 ${
                  validationErrors.password ? 'border-red-500' : 'border-border-subtle'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
            )}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.level === 'weak' ? 'text-red-500' :
                    passwordStrength.level === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {passwordStrength.level}
                  </span>
                </div>
                <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 pr-10 bg-surface-2 border rounded-lg text-text-primary focus:outline-none focus:border-accent-500 ${
                  validationErrors.confirmPassword ? 'border-red-500' : 'border-border-subtle'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-500 hover:text-accent-600 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
