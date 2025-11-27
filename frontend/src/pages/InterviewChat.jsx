import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FeedbackView from '../components/FeedbackView';
import {
    ArrowLeft,
    Send,
    Sparkles,
    Loader,
    CheckCircle,
    MessageSquare,
    Trophy,
} from 'lucide-react';

const InterviewChat = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [generatingQuestions, setGeneratingQuestions] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSessionData();
    }, [sessionId]);

    const fetchSessionData = async () => {
        try {
            const response = await api.get(`/interviews/${sessionId}`);
            setSession(response.data);
            setQuestions(response.data.questions || []);

            // Find the first unanswered question
            const unansweredIndex = response.data.questions?.findIndex(q => !q.answer) ?? 0;
            setCurrentQuestionIndex(unansweredIndex);

            setLoading(false);
        } catch (err) {
            setError('Failed to load interview session');
            setLoading(false);
        }
    };

    const generateQuestions = async () => {
        setGeneratingQuestions(true);
        setError(null);

        try {
            const response = await api.post(`/interviews/${sessionId}/questions`, {
                num_questions: 5,
                difficulty: 'medium',
            });

            setQuestions(response.data);
            setCurrentQuestionIndex(0);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate questions');
        } finally {
            setGeneratingQuestions(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) {
            setError('Please provide an answer');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await api.post(`/interviews/${sessionId}/answer`, {
                question_id: questions[currentQuestionIndex].id,
                answer_text: answer,
            });

            setCurrentAnswer(response.data);
            setShowFeedback(true);
            setAnswer('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    const nextQuestion = () => {
        setShowFeedback(false);
        setCurrentAnswer(null);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // All questions answered
            navigate('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
            {/* Navigation */}
            <nav className="glass border-b border-dark-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-ghost flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>

                        {questions.length > 0 && (
                            <div className="flex items-center gap-4">
                                <span className="text-dark-300 text-sm">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </span>
                                <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Session Info */}
                <div className="card mb-6 animate-fade-in">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{session.job_title}</h2>
                            {session.company_name && (
                                <p className="text-dark-400">{session.company_name}</p>
                            )}
                        </div>
                        {session.completed && session.overall_score && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                                <Trophy className="w-5 h-5" />
                                <span className="font-bold">{Math.round(session.overall_score)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* No Questions Yet */}
                {questions.length === 0 && (
                    <div className="card text-center py-12 animate-slide-up">
                        <MessageSquare className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Ready to Start?</h3>
                        <p className="text-dark-400 mb-6">
                            Generate AI-powered interview questions based on this job description
                        </p>
                        <button
                            onClick={generateQuestions}
                            disabled={generatingQuestions}
                            className="btn-primary flex items-center gap-2 mx-auto"
                        >
                            {generatingQuestions ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Generating Questions...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Questions
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Question and Answer */}
                {questions.length > 0 && currentQuestion && !showFeedback && (
                    <div className="space-y-6 animate-slide-up">
                        {/* Question */}
                        <div className="chat-bubble chat-bubble-question">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-primary-100 mb-2">
                                        {currentQuestion.question_type?.toUpperCase()} • {currentQuestion.difficulty?.toUpperCase()}
                                    </p>
                                    <p className="text-lg leading-relaxed">{currentQuestion.question_text}</p>
                                </div>
                            </div>
                        </div>

                        {/* Answer Input */}
                        <div className="card">
                            <label className="block text-sm font-medium text-dark-200 mb-3">
                                Your Answer
                            </label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="input min-h-[200px] resize-y mb-4"
                                placeholder="Type your answer here... Try to use the STAR method (Situation, Task, Action, Result) for behavioral questions."
                            />

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={submitAnswer}
                                    disabled={submitting || !answer.trim()}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Submit Answer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="glass-light rounded-lg p-4">
                            <p className="text-sm text-dark-300 font-medium mb-2">💡 Tips for a great answer:</p>
                            <ul className="space-y-1 text-sm text-dark-400">
                                <li>• Be specific and provide concrete examples</li>
                                <li>• Use the STAR method for behavioral questions</li>
                                <li>• Quantify your achievements when possible</li>
                                <li>• Keep your answer focused and relevant</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {showFeedback && currentAnswer && (
                    <div>
                        <FeedbackView answer={currentAnswer} feedback={currentAnswer.feedback} />

                        <div className="mt-6 flex gap-4">
                            {currentQuestionIndex < questions.length - 1 ? (
                                <button
                                    onClick={nextQuestion}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    Next Question
                                    <ArrowLeft className="w-5 h-5 rotate-180" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Complete Session
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewChat;
