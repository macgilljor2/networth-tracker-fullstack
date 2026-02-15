from typing import Optional
from pydantic import BaseModel, Field
from pydantic import UUID4
from datetime import datetime


# Budget Category Models
class BudgetCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)
    is_essential: bool = False


class BudgetCategoryCreateRequest(BudgetCategoryBase):
    pass


class BudgetCategoryUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)
    is_essential: Optional[bool] = None


class BudgetCategoryResponse(BudgetCategoryBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Income Models
class IncomeBase(BaseModel):
    description: str = Field(..., max_length=255)
    amount: float = Field(..., gt=0)
    frequency: str = Field(..., pattern="^(MONTHLY|YEARLY|ONE_TIME)$")
    is_net: bool = True
    effective_month: Optional[int] = Field(None, ge=1, le=12)
    effective_year: Optional[int] = Field(None, ge=2000, le=2100)


class IncomeCreateRequest(IncomeBase):
    pass


class IncomeUpdateRequest(BaseModel):
    description: Optional[str] = Field(None, max_length=255)
    amount: Optional[float] = Field(None, gt=0)
    frequency: Optional[str] = Field(None, pattern="^(MONTHLY|YEARLY|ONE_TIME)$")
    is_net: Optional[bool] = None
    effective_month: Optional[int] = Field(None, ge=1, le=12)
    effective_year: Optional[int] = Field(None, ge=2000, le=2100)


class IncomeResponse(IncomeBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Expense Models
class ExpenseBase(BaseModel):
    description: str = Field(..., max_length=255)
    amount: float = Field(..., gt=0)
    frequency: str = Field(..., pattern="^(MONTHLY|YEARLY|ONE_TIME)$")
    category_id: UUID4
    effective_month: Optional[int] = Field(None, ge=1, le=12)
    effective_year: Optional[int] = Field(None, ge=2000, le=2100)


class ExpenseCreateRequest(ExpenseBase):
    pass


class ExpenseUpdateRequest(BaseModel):
    description: Optional[str] = Field(None, max_length=255)
    amount: Optional[float] = Field(None, gt=0)
    frequency: Optional[str] = Field(None, pattern="^(MONTHLY|YEARLY|ONE_TIME)$")
    category_id: Optional[UUID4] = None
    effective_month: Optional[int] = Field(None, ge=1, le=12)
    effective_year: Optional[int] = Field(None, ge=2000, le=2100)


class ExpenseResponse(ExpenseBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime
    category: Optional[BudgetCategoryResponse] = None

    model_config = {"from_attributes": True}


# Dashboard Models
class ExpenseBreakdownItem(BaseModel):
    category_name: str
    amount: float
    percentage: float


class BudgetSummaryResponse(BaseModel):
    month: int
    year: int
    total_income: float
    total_expenses: float
    surplus_deficit: float
    savings_rate: float
    expense_breakdown: list[ExpenseBreakdownItem]


class BudgetTrendMonth(BaseModel):
    month: int
    year: int
    income: float
    expenses: float
    surplus_deficit: float


class BudgetTrendsResponse(BaseModel):
    months: list[BudgetTrendMonth]
