import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import {
    LayoutDashboard,
    Plus,
    TrendingUp,
    Award,
    MessageSquare,
    LogOut,
    Calendar,
    Target,
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, sessionsRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/interviews'),
            ]);

            setStats(statsRes.data);
            setSessions(sessionsRes.data.slice(0, 5)); // Latest 5 sessions
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-average';
        return 'score-poor';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
            {/* Navigation */}
            <nav className="glass border-b border-dark-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-6 h-6 text-primary-400" />
                            <h1 className="text-xl font-bold text-white">ApplyAssistAI</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-dark-300">Welcome, {user?.username}!</span>
                            <button
                                onClick={handleLogout}
                                className="btn-ghost flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
                    <p className="text-dark-400">Track your interview training progress</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
                    <div className="card hover:border-primary-500/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm mb-1">Total Sessions</p>
                                <p className="text-3xl font-bold text-white">{stats?.total_sessions || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-primary-400" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:border-green-500/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm mb-1">Completed</p>
                                <p className="text-3xl font-bold text-white">{stats?.completed_sessions || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Award className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:border-blue-500/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm mb-1">Average Score</p>
                                <p className="text-3xl font-bold text-white">
                                    {stats?.average_score ? Math.round(stats.average_score) : '-'}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="card hover:border-purple-500/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-dark-400 text-sm mb-1">Questions Answered</p>
                                <p className="text-3xl font-bold text-white">{stats?.total_questions_answered || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Improvement Rate */}
                {stats?.improvement_rate !== null && stats?.improvement_rate !== undefined && (
                    <div className="card mb-8 bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-primary-500/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary-500/30 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-primary-400" />
                            </div>
                            <div>
                                <p className="text-dark-300 text-sm">Improvement Rate</p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.improvement_rate > 0 ? '+' : ''}
                                    {stats.improvement_rate.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/interview/new')}
                        className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
                    >
                        <Plus className="w-6 h-6" />
                        Start New Interview Practice
                    </button>
                </div>

                {/* Recent Sessions */}
                <div className="card">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Sessions</h3>

                    {sessions.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                            <p className="text-dark-400 mb-4">No interview sessions yet</p>
                            <button
                                onClick={() => navigate('/interview/new')}
                                className="btn-primary"
                            >
                                Start Your First Session
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => navigate(`/interview/${session.id}`)}
                                    className="glass-light rounded-lg p-4 hover:bg-dark-700/50 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white mb-1">{session.job_title}</h4>
                                            {session.company_name && (
                                                <p className="text-sm text-dark-400 mb-2">{session.company_name}</p>
                                            )}
                                            <p className="text-xs text-dark-500">
                                                {new Date(session.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {session.completed && session.overall_score !== null && (
                                                <span className={`score-badge ${getScoreColor(session.overall_score)}`}>
                                                    {Math.round(session.overall_score)}
                                                </span>
                                            )}
                                            {!session.completed && (
                                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                                                    In Progress
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
