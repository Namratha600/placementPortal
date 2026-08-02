from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    # All optional = partial update
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CompanySearchItem(BaseModel):
    """Lightweight shape for the autocomplete dropdown."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str