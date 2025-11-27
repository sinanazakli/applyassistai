import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Link as LinkIcon, FileText, Sparkles, Loader } from 'lucide-react';

const NewInterview = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        job_title: '',
        company_name: '',
        job_url: '',
        job_description: '',
    });
    const [inputMode, setInputMode] = useState('url'); // 'url' or 'text'

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                job_title: formData.job_title || 'Unknown Position',
                company_name: formData.company_name || null,
                job_url: inputMode === 'url' ? formData.job_url : null,
                job_description: inputMode === 'text' ? formData.job_description : null,
            };

            const response = await api.post('/interviews/', payload);

            // Navigate to the interview session
            navigate(`/interview/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create interview session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
            {/* Navigation */}
            <nav className="glass border-b border-dark-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-ghost flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">New Interview Session</h2>
                            <p className="text-dark-400">Provide job details to start your practice</p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="card animate-slide-up">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Job Title */}
                        <div>
                            <label htmlFor="job_title" className="block text-sm font-medium text-dark-200 mb-2">
                                Job Title <span className="text-dark-500">(optional if using URL)</span>
                            </label>
                            <input
                                type="text"
                                id="job_title"
                                name="job_title"
                                value={formData.job_title}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., Senior Software Engineer"
                            />
                        </div>

                        {/* Company Name */}
                        <div>
                            <label htmlFor="company_name" className="block text-sm font-medium text-dark-200 mb-2">
                                Company Name <span className="text-dark-500">(optional)</span>
                            </label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                className="input"
                                placeholder="e.g., Google"
                            />
                        </div>

                        {/* Input Mode Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-dark-200 mb-3">
                                Job Description Source
                            </label>
                            <div className="flex gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setInputMode('url')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${inputMode === 'url'
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                            : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                                        }`}
                                >
                                    <LinkIcon className="w-5 h-5" />
                                    From URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode('text')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${inputMode === 'text'
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                            : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                                        }`}
                                >
                                    <FileText className="w-5 h-5" />
                                    Paste Text
                                </button>
                            </div>

                            {inputMode === 'url' ? (
                                <div>
                                    <input
                                        type="url"
                                        id="job_url"
                                        name="job_url"
                                        value={formData.job_url}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="https://example.com/jobs/senior-engineer"
                                        required={inputMode === 'url'}
                                    />
                                    <p className="mt-2 text-xs text-dark-500">
                                        We'll automatically extract the job details from the URL
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <textarea
                                        id="job_description"
                                        name="job_description"
                                        value={formData.job_description}
                                        onChange={handleChange}
                                        className="input min-h-[200px] resize-y"
                                        placeholder="Paste the job description here..."
                                        required={inputMode === 'text'}
                                    />
                                    <p className="mt-2 text-xs text-dark-500">
                                        Include responsibilities, requirements, and any other relevant details
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Creating Session...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Start Interview Practice
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 glass-light rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">What happens next?</h3>
                    <ul className="space-y-2 text-dark-300 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>Our AI will analyze the job description and generate relevant interview questions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>You'll practice answering questions in a realistic interview simulation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>Get instant AI-powered feedback on your answers with improvement suggestions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary-400 mt-1">•</span>
                            <span>Track your progress and see how you improve over time</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default NewInterview;
