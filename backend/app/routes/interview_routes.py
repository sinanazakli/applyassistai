from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db
from ..services.job_parser import JobParser
from ..services.question_generator import QuestionGenerator
from ..services.answer_evaluator import AnswerEvaluator

router = APIRouter(prefix="/interviews", tags=["Interviews"])

# Initialize services
job_parser = JobParser()
question_generator = QuestionGenerator()
answer_evaluator = AnswerEvaluator()

@router.post("/", response_model=schemas.InterviewSessionBase, status_code=status.HTTP_201_CREATED)
def create_interview_session(
    session_data: schemas.InterviewSessionCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new interview session"""
    
    job_description = session_data.job_description
    job_title = session_data.job_title
    company_name = session_data.company_name
    job_url = session_data.job_url
    
    # If URL is provided, parse it
    if job_url and not job_description:
        try:
            parsed_data = job_parser.parse_from_url(job_url)
            job_description = parsed_data.get("job_description", "")
            if not job_title or job_title == "Unknown":
                job_title = parsed_data.get("job_title", job_title)
            if not company_name:
                company_name = parsed_data.get("company_name")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse job URL: {str(e)}"
            )
    
    if not job_description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description is required (either directly or via URL)"
        )
    
    # Create interview session
    db_session = models.InterviewSession(
        user_id=current_user.id,
        job_title=job_title,
        company_name=company_name,
        job_description=job_description,
        job_url=job_url
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    return db_session

@router.get("/", response_model=List[schemas.InterviewSessionBase])
def get_user_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all interview sessions for current user"""
    
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(models.InterviewSession.created_at.desc()).all()
    
    return sessions

@router.get("/{session_id}", response_model=schemas.InterviewSessionDetail)
def get_session_detail(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific session"""
    
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session

@router.post("/{session_id}/questions", response_model=List[schemas.QuestionBase])
def generate_questions(
    session_id: int,
    question_params: schemas.QuestionGenerate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate interview questions for a session"""
    
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Check if questions already exist
    existing_questions = db.query(models.Question).filter(
        models.Question.session_id == session_id
    ).count()
    
    if existing_questions > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Questions already generated for this session"
        )
    
    # Generate questions using AI
    try:
        questions_data = question_generator.generate_questions(
            job_title=session.job_title,
            job_description=session.job_description,
            company_name=session.company_name,
            num_questions=question_params.num_questions,
            difficulty=question_params.difficulty or "medium"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )
    
    # Save questions to database
    db_questions = []
    for q_data in questions_data:
        db_question = models.Question(
            session_id=session_id,
            question_text=q_data["question_text"],
            question_type=q_data.get("question_type", "behavioral"),
            difficulty=q_data.get("difficulty", "medium"),
            order=q_data.get("order", 1)
        )
        db.add(db_question)
        db_questions.append(db_question)
    
    db.commit()
    
    # Refresh all questions
    for q in db_questions:
        db.refresh(q)
    
    return db_questions

@router.post("/{session_id}/answer", response_model=schemas.AnswerWithFeedback)
def submit_answer(
    session_id: int,
    answer_data: schemas.AnswerCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer and get AI feedback"""
    
    # Verify session belongs to user
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get the question
    question = db.query(models.Question).filter(
        models.Question.id == answer_data.question_id,
        models.Question.session_id == session_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if answer already exists
    existing_answer = db.query(models.Answer).filter(
        models.Answer.question_id == answer_data.question_id
    ).first()
    
    # Evaluate the answer using AI
    try:
        evaluation = answer_evaluator.evaluate_answer(
            question=question.question_text,
            answer=answer_data.answer_text,
            question_type=question.question_type,
            job_context=f"{session.job_title} at {session.company_name or 'the company'}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate answer: {str(e)}"
        )
    
    if existing_answer:
        # Update existing answer
        existing_answer.answer_text = answer_data.answer_text
        existing_answer.relevance_score = evaluation["relevance_score"]
        existing_answer.structure_score = evaluation["structure_score"]
        existing_answer.professionalism_score = evaluation["professionalism_score"]
        existing_answer.overall_score = evaluation["overall_score"]
        existing_answer.created_at = datetime.utcnow() # Update timestamp
        
        db_answer = existing_answer
        
        # Update existing feedback
        if existing_answer.feedback:
            existing_answer.feedback.strengths = evaluation["strengths"]
            existing_answer.feedback.weaknesses = evaluation["weaknesses"]
            existing_answer.feedback.suggestions = evaluation["suggestions"]
            existing_answer.feedback.star_analysis = evaluation["star_analysis"]
            existing_answer.feedback.example_answer = evaluation["example_answer"]
            existing_answer.feedback.created_at = datetime.utcnow()
            db_feedback = existing_answer.feedback
        else:
            # Create feedback if it somehow didn't exist
            db_feedback = models.Feedback(
                answer_id=db_answer.id,
                strengths=evaluation["strengths"],
                weaknesses=evaluation["weaknesses"],
                suggestions=evaluation["suggestions"],
                star_analysis=evaluation["star_analysis"],
                example_answer=evaluation["example_answer"]
            )
            db.add(db_feedback)
            
    else:
        # Create new answer
        db_answer = models.Answer(
            session_id=session_id,
            question_id=answer_data.question_id,
            answer_text=answer_data.answer_text,
            relevance_score=evaluation["relevance_score"],
            structure_score=evaluation["structure_score"],
            professionalism_score=evaluation["professionalism_score"],
            overall_score=evaluation["overall_score"]
        )
        
        db.add(db_answer)
        db.commit()
        db.refresh(db_answer)
        
        # Create new feedback
        db_feedback = models.Feedback(
            answer_id=db_answer.id,
            strengths=evaluation["strengths"],
            weaknesses=evaluation["weaknesses"],
            suggestions=evaluation["suggestions"],
            star_analysis=evaluation["star_analysis"],
            example_answer=evaluation["example_answer"]
        )
        
        db.add(db_feedback)

    db.commit()
    db.refresh(db_answer)
    if db_answer.feedback:
        db.refresh(db_answer.feedback)
    
    # Update session score if all questions answered
    total_questions = db.query(models.Question).filter(
        models.Question.session_id == session_id
    ).count()
    
    answered_questions = db.query(models.Answer).filter(
        models.Answer.session_id == session_id
    ).count()
    
    if total_questions == answered_questions:
        # Calculate overall session score
        all_scores = db.query(models.Answer.overall_score).filter(
            models.Answer.session_id == session_id
        ).all()
        
        avg_score = sum(score[0] for score in all_scores) / len(all_scores)
        session.overall_score = avg_score
        session.completed = True
        db.commit()
    
    # Return answer with feedback
    # Ensure feedback is loaded
    if not db_answer.feedback:
        db_answer.feedback = db_feedback
        
    return db_answer
