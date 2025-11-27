from openai import OpenAI
import os
from typing import List, Dict
from dotenv import load_dotenv
import json

load_dotenv()

class QuestionGenerator:
    """Service for generating interview questions using OpenAI"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=api_key)
    
    def generate_questions(
        self,
        job_title: str,
        job_description: str,
        company_name: str = None,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict[str, str]]:
        """
        Generate interview questions based on job description
        
        Args:
            job_title: Title of the position
            job_description: Full job description
            company_name: Name of the company (optional)
            num_questions: Number of questions to generate
            difficulty: Difficulty level (easy, medium, hard)
            
        Returns:
            List of question dictionaries with text, type, and difficulty
        """
        
        company_context = f" at {company_name}" if company_name else ""
        
        prompt = f"""You are an expert interview coach. Generate {num_questions} interview questions for a {job_title} position{company_context}.

Job Description:
{job_description[:2000]}

Requirements:
1. Generate a mix of behavioral, technical, and situational questions
2. Difficulty level: {difficulty}
3. Questions should be specific to the role and requirements mentioned
4. Include questions that assess both technical skills and soft skills
5. Format each question as a JSON object with: question_text, question_type (behavioral/technical/situational), difficulty

Return ONLY a JSON array of questions, no additional text.

Example format:
[
  {{
    "question_text": "Tell me about a time when you had to debug a complex issue in production.",
    "question_type": "behavioral",
    "difficulty": "medium"
  }}
]
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interview coach who generates relevant, insightful interview questions. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON response
            questions = json.loads(content)
            
            # Validate and ensure we have the right number of questions
            if not isinstance(questions, list):
                raise ValueError("Response is not a list")
            
            # Add order to questions
            for i, q in enumerate(questions[:num_questions]):
                q['order'] = i + 1
            
            return questions[:num_questions]
            
        except json.JSONDecodeError as e:
            # Fallback: create default questions
            print(f"JSON decode error: {e}")
            return self._generate_fallback_questions(job_title, num_questions, difficulty)
        except Exception as e:
            print(f"Error generating questions: {e}")
            return self._generate_fallback_questions(job_title, num_questions, difficulty)
    
    def _generate_fallback_questions(
        self,
        job_title: str,
        num_questions: int,
        difficulty: str
    ) -> List[Dict[str, str]]:
        """Generate fallback questions if API fails"""
        
        fallback_questions = [
            {
                "question_text": f"Tell me about your experience relevant to this {job_title} role.",
                "question_type": "behavioral",
                "difficulty": difficulty,
                "order": 1
            },
            {
                "question_text": "Describe a challenging project you worked on and how you overcame obstacles.",
                "question_type": "behavioral",
                "difficulty": difficulty,
                "order": 2
            },
            {
                "question_text": "How do you stay updated with the latest technologies and industry trends?",
                "question_type": "behavioral",
                "difficulty": difficulty,
                "order": 3
            },
            {
                "question_text": "Tell me about a time when you had to work with a difficult team member.",
                "question_type": "situational",
                "difficulty": difficulty,
                "order": 4
            },
            {
                "question_text": "Where do you see yourself in 5 years, and how does this role fit into your career goals?",
                "question_type": "behavioral",
                "difficulty": difficulty,
                "order": 5
            }
        ]
        
        return fallback_questions[:num_questions]
