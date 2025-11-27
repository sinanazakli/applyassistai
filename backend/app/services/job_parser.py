import requests
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader
from typing import Optional, Dict
import io
import re

class JobParser:
    """Service for parsing job descriptions from various sources"""
    
    @staticmethod
    def parse_from_url(url: str) -> Dict[str, str]:
        """
        Parse job description from a URL
        
        Args:
            url: URL of the job posting
            
        Returns:
            Dictionary with parsed job information
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Try to extract job title
            job_title = JobParser._extract_job_title(soup, text)
            
            # Try to extract company name
            company_name = JobParser._extract_company_name(soup, text)
            
            return {
                "job_title": job_title,
                "company_name": company_name,
                "job_description": text[:5000],  # Limit to 5000 chars
                "source_url": url
            }
            
        except Exception as e:
            raise ValueError(f"Failed to parse URL: {str(e)}")
    
    @staticmethod
    def parse_from_pdf(pdf_content: bytes) -> str:
        """
        Parse job description from PDF content
        
        Args:
            pdf_content: PDF file content as bytes
            
        Returns:
            Extracted text from PDF
        """
        try:
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PdfReader(pdf_file)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    
    @staticmethod
    def _extract_job_title(soup: BeautifulSoup, text: str) -> str:
        """Extract job title from HTML"""
        # Try common job title tags
        title_tags = soup.find_all(['h1', 'h2'], class_=re.compile(r'job.*title|title.*job', re.I))
        if title_tags:
            return title_tags[0].get_text().strip()
        
        # Try meta tags
        meta_title = soup.find('meta', property='og:title')
        if meta_title and meta_title.get('content'):
            return meta_title['content'].strip()
        
        # Try page title
        if soup.title:
            title = soup.title.string
            if title:
                # Remove common suffixes
                title = re.sub(r'\s*[-|]\s*(Jobs?|Careers?|Indeed|LinkedIn).*$', '', title, flags=re.I)
                return title.strip()
        
        return "Unknown Position"
    
    @staticmethod
    def _extract_company_name(soup: BeautifulSoup, text: str) -> Optional[str]:
        """Extract company name from HTML"""
        # Try common company name tags
        company_tags = soup.find_all(class_=re.compile(r'company.*name|employer', re.I))
        if company_tags:
            return company_tags[0].get_text().strip()
        
        # Try meta tags
        meta_company = soup.find('meta', property='og:site_name')
        if meta_company and meta_company.get('content'):
            return meta_company['content'].strip()
        
        return None
    
    @staticmethod
    def extract_key_skills(job_description: str) -> list:
        """
        Extract key skills from job description
        
        Args:
            job_description: Job description text
            
        Returns:
            List of extracted skills
        """
        # Common skill keywords
        skill_patterns = [
            r'\b(Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.js|Django|Flask|FastAPI)\b',
            r'\b(SQL|PostgreSQL|MySQL|MongoDB|Redis|Docker|Kubernetes|AWS|Azure|GCP)\b',
            r'\b(Git|CI/CD|Agile|Scrum|REST|API|GraphQL|Microservices)\b',
            r'\b(Machine Learning|AI|Data Science|Analytics|TensorFlow|PyTorch)\b',
        ]
        
        skills = set()
        for pattern in skill_patterns:
            matches = re.findall(pattern, job_description, re.IGNORECASE)
            skills.update(match.lower() for match in matches)
        
        return list(skills)
