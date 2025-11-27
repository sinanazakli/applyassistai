from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Interview Session Schemas
class InterviewSessionCreate(BaseModel):
    job_title: str
    company_name: Optional[str] = None
    job_description: Optional[str] = None
    job_url: Optional[str] = None

class InterviewSessionBase(BaseModel):
    id: int
    job_title: str
    company_name: Optional[str]
    job_description: str
    job_url: Optional[str]
    created_at: datetime
    completed: bool
    overall_score: Optional[float]
    
    class Config:
        from_attributes = True

# Question Schemas
class QuestionBase(BaseModel):
    id: int
    question_text: str
    question_type: Optional[str]
    difficulty: Optional[str]
    order: int
    
    class Config:
        from_attributes = True

class QuestionGenerate(BaseModel):
    num_questions: int = 5
    difficulty: Optional[str] = "medium"

# Answer Schemas
class AnswerCreate(BaseModel):
    question_id: int
    answer_text: str

class AnswerBase(BaseModel):
    id: int
    question_id: int
    answer_text: str
    relevance_score: Optional[float]
    structure_score: Optional[float]
    professionalism_score: Optional[float]
    overall_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Feedback Schemas
class FeedbackBase(BaseModel):
    id: int
    strengths: Optional[str]
    weaknesses: Optional[str]
    suggestions: Optional[str]
    star_analysis: Optional[str]
    example_answer: Optional[str]
    
    class Config:
        from_attributes = True

class AnswerWithFeedback(AnswerBase):
    feedback: Optional[FeedbackBase] = None

class QuestionWithAnswer(QuestionBase):
    answer: Optional[AnswerWithFeedback] = None

class InterviewSessionDetail(InterviewSessionBase):
    questions: List[QuestionWithAnswer] = []

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_sessions: int
    completed_sessions: int
    average_score: Optional[float]
    total_questions_answered: int
    improvement_rate: Optional[float]

class SessionHistory(BaseModel):
    sessions: List[InterviewSessionBase]
