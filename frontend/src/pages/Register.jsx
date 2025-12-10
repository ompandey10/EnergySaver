import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { registerSchema } from '../utils/validations';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Register = () => {
    const [isLoading, setIsLoading] = useState(false);
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

    const onSubmit = async (data) => {
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
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

                        <Input
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="At least 8 characters"
                            error={errors.password?.message}
                            autoComplete="new-password"
                            {...register('password')}
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            icon={Lock}
                            placeholder="Confirm your password"
                            error={errors.confirmPassword?.message}
                            autoComplete="new-password"
                            {...register('confirmPassword')}
                        />

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
