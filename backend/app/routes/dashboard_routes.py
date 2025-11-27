from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for current user"""
    
    # Total sessions
    total_sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).count()
    
    # Completed sessions
    completed_sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.completed == True
    ).count()
    
    # Average score
    avg_score_result = db.query(func.avg(models.InterviewSession.overall_score)).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.overall_score.isnot(None)
    ).scalar()
    
    average_score = float(avg_score_result) if avg_score_result else None
    
    # Total questions answered
    total_questions_answered = db.query(models.Answer).join(
        models.InterviewSession
    ).filter(
        models.InterviewSession.user_id == current_user.id
    ).count()
    
    # Calculate improvement rate (compare first half vs second half of sessions)
    if completed_sessions >= 4:
        sessions_ordered = db.query(models.InterviewSession).filter(
            models.InterviewSession.user_id == current_user.id,
            models.InterviewSession.completed == True,
            models.InterviewSession.overall_score.isnot(None)
        ).order_by(models.InterviewSession.created_at).all()
        
        mid_point = len(sessions_ordered) // 2
        first_half_avg = sum(s.overall_score for s in sessions_ordered[:mid_point]) / mid_point
        second_half_avg = sum(s.overall_score for s in sessions_ordered[mid_point:]) / (len(sessions_ordered) - mid_point)
        
        improvement_rate = ((second_half_avg - first_half_avg) / first_half_avg) * 100 if first_half_avg > 0 else 0
    else:
        improvement_rate = None
    
    return {
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "average_score": average_score,
        "total_questions_answered": total_questions_answered,
        "improvement_rate": improvement_rate
    }

@router.get("/history", response_model=schemas.SessionHistory)
def get_session_history(
    limit: int = 10,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent session history"""
    
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(
        models.InterviewSession.created_at.desc()
    ).limit(limit).all()
    
    return {"sessions": sessions}
