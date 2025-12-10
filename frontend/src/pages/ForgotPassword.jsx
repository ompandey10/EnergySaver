import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setSubmittedEmail(data.email);
                setSubmitted(true);
                toast.success('Password recovery email sent!');
            } else {
                toast.error(result.message || 'Failed to send recovery email');
            }
        } catch (error) {
            toast.error('Error: ' + error.message);
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
                    {!submitted ? (
                        <>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <Input
                                    label="Email"
                                    type="email"
                                    icon={Mail}
                                    placeholder="Enter your email"
                                    error={errors.email?.message}
                                    autoComplete="email"
                                    {...register('email')}
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    isLoading={isLoading}
                                >
                                    Send Recovery Email
                                </Button>
                            </form>

                            <div className="mt-6">
                                <Link
                                    to="/login"
                                    className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    We've sent a password recovery link to <strong>{submittedEmail}</strong>
                                </p>
                                <p className="text-xs text-gray-500 mb-6">
                                    Please check your email and follow the link to reset your password. The link will expire in 24 hours.
                                </p>

                                <div className="space-y-3">
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => navigate('/login')}
                                    >
                                        Back to Sign In
                                    </Button>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Try Another Email
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
