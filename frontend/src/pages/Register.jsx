import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Zap, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { registerSchema } from '../utils/validations';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

// Password strength calculator
const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
};

const getPasswordStrengthLabel = (strength) => {
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return labels[strength - 1] || 'Weak';
};

const getPasswordStrengthColor = (strength) => {
    const colors = {
        1: 'bg-red-500',
        2: 'bg-orange-500',
        3: 'bg-yellow-500',
        4: 'bg-lime-500',
        5: 'bg-green-500'
    };
    return colors[strength] || 'bg-gray-300';
};

const PasswordStrengthIndicator = ({ password }) => {
    const strength = calculatePasswordStrength(password);
    const label = getPasswordStrengthLabel(strength);
    const color = getPasswordStrengthColor(strength);

    const requirements = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Lowercase & uppercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
        { label: 'Contains a number', met: /\d/.test(password) },
        { label: 'Contains a symbol', met: /[^A-Za-z0-9]/.test(password) },
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${color} transition-all duration-300`}
                        style={{ width: `${(strength / 5) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                    {label}
                </span>
            </div>

            <div className="space-y-1">
                {requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center text-xs text-gray-600">
                        {req.met ? (
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        ) : (
                            <X className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                        )}
                        <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Register = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const passwordValue = watch('password') || '';

    const onSubmit = async (data) => {
        if (!agreedToTerms) {
            toast.error('Please agree to the terms and conditions');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    password: data.password,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Registration successful! Logging in...');
                // Auto-login after registration
                const loginResult = await login(data.email, data.password);
                if (loginResult.success) {
                    navigate('/dashboard');
                }
            } else {
                toast.error(result.message || 'Registration failed');
            }
        } catch (error) {
            toast.error('Registration error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <Zap className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">EnergyFlow</h1>
                    <p className="text-gray-600 mt-2">Smart Energy Management System</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="First Name"
                                type="text"
                                icon={User}
                                placeholder="John"
                                error={errors.firstName?.message}
                                autoComplete="given-name"
                                {...register('firstName')}
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                placeholder="Smith"
                                error={errors.lastName?.message}
                                autoComplete="family-name"
                                {...register('lastName')}
                            />
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            icon={Mail}
                            placeholder="your@email.com"
                            error={errors.email?.message}
                            autoComplete="email"
                            {...register('email')}
                        />

                        <div>
                            <Input
                                label="Password"
                                type="password"
                                icon={Lock}
                                placeholder="At least 8 characters"
                                error={errors.password?.message}
                                autoComplete="new-password"
                                {...register('password')}
                            />
                            {passwordValue && (
                                <div className="mt-3">
                                    <PasswordStrengthIndicator password={passwordValue} />
                                </div>
                            )}
                        </div>

                        <Input
                            label="Confirm Password"
                            type="password"
                            icon={Lock}
                            placeholder="Confirm your password"
                            error={errors.confirmPassword?.message}
                            autoComplete="new-password"
                            {...register('confirmPassword')}
                        />

                        <div className="flex items-start space-x-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="terms" className="text-xs text-gray-600">
                                I agree to the{' '}
                                <Link to="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Terms & Conditions
                                </Link>
                                {' '}and{' '}
                                <Link to="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
