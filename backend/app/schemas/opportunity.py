from pydantic import BaseModel, field_validator, ConfigDict
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


def _list_to_csv(v):
    """['2028','CSE'] -> '2028,CSE'. Empty list/None -> None (means 'everyone')."""
    if not v:
        return None
    return ",".join(str(x).strip() for x in v if str(x).strip())


def _csv_to_list(v):
    """'2028,CSE' -> ['2028','CSE']. None/'' -> []."""
    if not v:
        return []
    return [x.strip() for x in str(v).split(",") if x.strip()]


class OnCampusOpportunityCreate(BaseModel):
    company_name: str
    is_existing_company: bool = False
    registration_link: str
    last_date_to_apply: datetime
    eligibility_criteria: Optional[str] = None
    package_offered: Optional[Decimal] = None
    target_graduation_years: List[str] = []   # e.g. ["2028","2029"]; empty = everyone
    target_branches: List[str] = []            # e.g. ["CSE","IT"]; empty = everyone

    @field_validator("company_name")
    @classmethod
    def company_name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Company name must be at least 2 characters.")
        return v

    @field_validator("registration_link")
    @classmethod
    def registration_link_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Registration link is required.")
        return v

    def model_dump(self, **kwargs):
        """Convert the two list fields to comma-separated strings for the DB."""
        data = super().model_dump(**kwargs)
        data["target_graduation_years"] = _list_to_csv(self.target_graduation_years)
        data["target_branches"] = _list_to_csv(self.target_branches)
        return data


class OnCampusOpportunityOut(BaseModel):
    id: int
    company_name: str
    is_existing_company: bool
    registration_link: str
    last_date_to_apply: datetime
    eligibility_criteria: Optional[str] = None
    package_offered: Optional[Decimal] = None
    target_graduation_years: List[str] = []
    target_branches: List[str] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("target_graduation_years", "target_branches", mode="before")
    @classmethod
    def _split(cls, v):
        # DB gives a string; API returns a list.
        if isinstance(v, list):
            return v
        return _csv_to_list(v)


class OffCampusOpportunityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    link: str
    photo_url: Optional[str] = None
    last_date_to_apply: datetime
    target_graduation_years: List[str] = []
    target_branches: List[str] = []

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Title must be at least 2 characters.")
        return v

    @field_validator("link")
    @classmethod
    def link_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Link is required.")
        return v

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        data["target_graduation_years"] = _list_to_csv(self.target_graduation_years)
        data["target_branches"] = _list_to_csv(self.target_branches)
        return data


class OffCampusOpportunityOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    link: str
    photo_url: Optional[str] = None
    last_date_to_apply: datetime
    target_graduation_years: List[str] = []
    target_branches: List[str] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("target_graduation_years", "target_branches", mode="before")
    @classmethod
    def _split(cls, v):
        if isinstance(v, list):
            return v
        return _csv_to_list(v)


class StudentBrief(BaseModel):
    id: int
    full_name: str
    register_number: str
    model_config = ConfigDict(from_attributes=True)


class ApplicantsResponse(BaseModel):
    applied: List[StudentBrief]
    not_applied: List[StudentBrief]
    applied_count: int
    not_applied_count: int


class MyApplicationsResponse(BaseModel):
    on_campus_ids: List[int]
    off_campus_ids: List[int]