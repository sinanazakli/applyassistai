import React from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle } from 'lucide-react';

const FeedbackView = ({ answer, feedback }) => {
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-blue-400';
        if (score >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBadgeClass = (score) => {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-average';
        return 'score-poor';
    };

    const ScoreCircle = ({ score, label }) => {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                    <svg className="transform -rotate-90 w-28 h-28">
                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-dark-700"
                        />
                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={getScoreColor(score)}
                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                            {Math.round(score)}
                        </span>
                    </div>
                </div>
                <p className="text-sm text-dark-400 mt-2">{label}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Overall Score */}
            <div className="card bg-gradient-to-br from-primary-500/10 to-purple-500/10 border-primary-500/30">
                <div className="text-center">
                    <p className="text-dark-300 mb-4">Overall Score</p>
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(answer.overall_score)}`}>
                        {Math.round(answer.overall_score)}
                    </div>
                    <span className={`score-badge ${getScoreBadgeClass(answer.overall_score)}`}>
                        {answer.overall_score >= 80
                            ? 'Excellent!'
                            : answer.overall_score >= 60
                                ? 'Good Job!'
                                : answer.overall_score >= 40
                                    ? 'Keep Practicing'
                                    : 'Needs Improvement'}
                    </span>
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="card">
                <h3 className="text-lg font-semibold text-white mb-6">Score Breakdown</h3>
                <div className="grid grid-cols-3 gap-6">
                    <ScoreCircle score={answer.relevance_score} label="Relevance" />
                    <ScoreCircle score={answer.structure_score} label="Structure" />
                    <ScoreCircle score={answer.professionalism_score} label="Professional" />
                </div>
            </div>

            {/* Strengths */}
            {feedback.strengths && (
                <div className="card border-green-500/30">
                    <div className="flex items-start gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Strengths</h3>
                            <p className="text-dark-200 leading-relaxed">{feedback.strengths}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Weaknesses */}
            {feedback.weaknesses && (
                <div className="card border-yellow-500/30">
                    <div className="flex items-start gap-3 mb-3">
                        <XCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Areas for Improvement</h3>
                            <p className="text-dark-200 leading-relaxed">{feedback.weaknesses}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions && (
                <div className="card border-blue-500/30">
                    <div className="flex items-start gap-3 mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Suggestions</h3>
                            <p className="text-dark-200 leading-relaxed">{feedback.suggestions}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* STAR Analysis */}
            {feedback.star_analysis && (
                <div className="card border-purple-500/30">
                    <h3 className="text-lg font-semibold text-white mb-3">STAR Method Analysis</h3>
                    <p className="text-dark-200 leading-relaxed mb-4">{feedback.star_analysis}</p>
                    <div className="glass-light rounded-lg p-4">
                        <p className="text-sm text-dark-300 mb-2 font-medium">STAR Framework:</p>
                        <ul className="space-y-1 text-sm text-dark-400">
                            <li><strong className="text-primary-400">S</strong>ituation - Set the context</li>
                            <li><strong className="text-primary-400">T</strong>ask - Describe your responsibility</li>
                            <li><strong className="text-primary-400">A</strong>ction - Explain what you did</li>
                            <li><strong className="text-primary-400">R</strong>esult - Share the outcome</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Example Answer */}
            {feedback.example_answer && (
                <div className="card bg-dark-800/50">
                    <h3 className="text-lg font-semibold text-white mb-3">Example of a Stronger Answer</h3>
                    <div className="glass-light rounded-lg p-4">
                        <p className="text-dark-200 leading-relaxed italic">{feedback.example_answer}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackView;
