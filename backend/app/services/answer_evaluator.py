from openai import OpenAI
import os
from typing import Dict, Tuple
from dotenv import load_dotenv
import json

load_dotenv()

class AnswerEvaluator:
    """Service for evaluating interview answers using AI"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=api_key)
    
    def evaluate_answer(
        self,
        question: str,
        answer: str,
        question_type: str = "behavioral",
        job_context: str = None
    ) -> Dict:
        """
        Evaluate an interview answer and provide detailed feedback
        
        Args:
            question: The interview question
            answer: The candidate's answer
            question_type: Type of question (behavioral, technical, situational)
            job_context: Additional context about the job (optional)
            
        Returns:
            Dictionary with scores and detailed feedback
        """
        
        context_text = f"\n\nJob Context: {job_context}" if job_context else ""
        
        prompt = f"""You are an expert interview coach evaluating a candidate's answer.

Question Type: {question_type}
Question: {question}

Candidate's Answer:
{answer}
{context_text}

Evaluate this answer on the following criteria (score 0-100 for each):
1. Relevance: How well does the answer address the question?
2. Structure: Is the answer well-organized? (For behavioral questions, check STAR method: Situation, Task, Action, Result)
3. Professionalism: Is the language professional and clear?

Also provide:
- Strengths: What the candidate did well
- Weaknesses: Areas for improvement
- Suggestions: Specific tips to improve the answer
- STAR Analysis: If applicable, analyze how well they used the STAR method
- Example Answer: A brief example of a stronger answer

Return your evaluation as a JSON object with this structure:
{{
  "relevance_score": 85,
  "structure_score": 75,
  "professionalism_score": 90,
  "overall_score": 83,
  "strengths": "Clear communication...",
  "weaknesses": "Could provide more specific metrics...",
  "suggestions": "Try to quantify your impact...",
  "star_analysis": "Situation and Task were clear, but Action and Result need more detail...",
  "example_answer": "A stronger answer would be..."
}}

Return ONLY valid JSON, no additional text.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interview coach providing constructive, detailed feedback. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON response
            evaluation = json.loads(content)
            
            # Ensure all required fields exist
            required_fields = [
                'relevance_score', 'structure_score', 'professionalism_score',
                'overall_score', 'strengths', 'weaknesses', 'suggestions',
                'star_analysis', 'example_answer'
            ]
            
            for field in required_fields:
                if field not in evaluation:
                    if 'score' in field:
                        evaluation[field] = 70.0
                    else:
                        evaluation[field] = "Not available"
            
            return evaluation
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            return self._generate_fallback_evaluation(answer)
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return self._generate_fallback_evaluation(answer)
    
    def _generate_fallback_evaluation(self, answer: str) -> Dict:
        """Generate a basic evaluation if API fails"""
        
        # Simple heuristic scoring
        word_count = len(answer.split())
        
        relevance_score = min(100, max(40, word_count * 2))
        structure_score = 70 if word_count > 50 else 50
        professionalism_score = 75
        overall_score = (relevance_score + structure_score + professionalism_score) / 3
        
        return {
            "relevance_score": relevance_score,
            "structure_score": structure_score,
            "professionalism_score": professionalism_score,
            "overall_score": overall_score,
            "strengths": "You provided a response to the question.",
            "weaknesses": "Unable to provide detailed analysis at this time.",
            "suggestions": "Try to structure your answer using the STAR method: Situation, Task, Action, Result.",
            "star_analysis": "Consider using the STAR framework to structure your behavioral answers.",
            "example_answer": "A strong answer would include specific examples with measurable outcomes."
        }
    
    def calculate_session_score(self, answer_scores: list) -> float:
        """
        Calculate overall session score from individual answer scores
        
        Args:
            answer_scores: List of overall scores for each answer
            
        Returns:
            Average score for the session
        """
        if not answer_scores:
            return 0.0
        
        return sum(answer_scores) / len(answer_scores)
