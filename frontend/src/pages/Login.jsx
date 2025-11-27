import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogIn, UserPlus, Sparkles } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { login, register, isLoading, error, clearError } = useAuthStore();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        let success;
        if (isLoginMode) {
            success = await login(formData.email, formData.password);
        } else {
            success = await register(formData.email, formData.username, formData.password);
        }

        if (success) {
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        clearError();
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">ApplyAssistAI</h1>
                    <p className="text-dark-400">AI-powered interview training platform</p>
                </div>

                {/* Login/Register Card */}
                <div className="card animate-slide-up">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLoginMode ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-dark-400">
                            {isLoginMode
                                ? 'Sign in to continue your interview training'
                                : 'Start your journey to interview success'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {!isLoginMode && (
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-dark-200 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="spinner w-5 h-5 border-2"></div>
                            ) : (
                                <>
                                    {isLoginMode ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                    {isLoginMode ? 'Sign In' : 'Create Account'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={toggleMode}
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                        >
                            {isLoginMode
                                ? "Don't have an account? Sign up"
                                : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div className="glass-light rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-400">AI</div>
                        <div className="text-xs text-dark-400 mt-1">Powered</div>
                    </div>
                    <div className="glass-light rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-400">24/7</div>
                        <div className="text-xs text-dark-400 mt-1">Available</div>
                    </div>
                    <div className="glass-light rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary-400">∞</div>
                        <div className="text-xs text-dark-400 mt-1">Practice</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
