from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID

class HomeSectionResponse(BaseModel):
    id: int
    title: Optional[str] = None
    section_type: str
    order: int
    is_active: bool
    product_ids: List[UUID]
    
    model_config = ConfigDict(from_attributes=True)