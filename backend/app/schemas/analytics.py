from typing import List, Optional
from pydantic import BaseModel


class CompanyBrief(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


class YearCount(BaseModel):
    year: Optional[int] = None   # None groups records with no graduation_year
    count: int


class BranchCount(BaseModel):
    branch: Optional[str] = None
    count: int


class RoleCount(BaseModel):
    role: Optional[str] = None
    count: int


class CompanyAnalyticsOut(BaseModel):
    """
    Summarized, aggregate-only view for a single company.
    Contains NO individual placement records — safe to expose to students.
    """
    company: CompanyBrief

    total_hires: int
    highest_package: Optional[float] = None
    average_package: Optional[float] = None

    year_wise: List[YearCount] = []     # -> bar chart
    branch_wise: List[BranchCount] = [] # -> pie chart
    roles: List[RoleCount] = []         # -> list