from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    interview_sessions = relationship("InterviewSession", back_populates="user")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Job Information
    job_title = Column(String, nullable=False)
    company_name = Column(String)
    job_description = Column(Text, nullable=False)
    job_url = Column(String)
    
    # Session metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    completed = Column(Boolean, default=False)
    overall_score = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    questions = relationship("Question", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    
    question_text = Column(Text, nullable=False)
    question_type = Column(String)  # behavioral, technical, situational
    difficulty = Column(String)  # easy, medium, hard
    order = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False)

class Answer(Base):
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    answer_text = Column(Text, nullable=False)
    
    # Scoring
    relevance_score = Column(Float)  # 0-100
    structure_score = Column(Float)  # 0-100
    professionalism_score = Column(Float)  # 0-100
    overall_score = Column(Float)  # 0-100
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question", back_populates="answer")
    feedback = relationship("Feedback", back_populates="answer", uselist=False)

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("answers.id"), nullable=False)
    
    # Detailed feedback
    strengths = Column(Text)
    weaknesses = Column(Text)
    suggestions = Column(Text)
    star_analysis = Column(Text)  # Analysis based on STAR method
    example_answer = Column(Text)  # Example of a better answer
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    answer = relationship("Answer", back_populates="feedback")
