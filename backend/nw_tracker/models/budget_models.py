from sqlalchemy import Column, String, Float, Boolean, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from nw_tracker.models.models import BaseModelClass
from nw_tracker.enums.budget_enums import FrequencyEnum


class BudgetCategoryModel(BaseModelClass):
    __tablename__ = 'budget_categories'

    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)
    is_essential = Column(Boolean, nullable=False, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Relationships
    expenses = relationship("ExpenseModel", back_populates="category", cascade="all, delete-orphan")


class IncomeModel(BaseModelClass):
    __tablename__ = 'income'

    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(SQLEnum(FrequencyEnum), nullable=False)
    is_net = Column(Boolean, nullable=False, default=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    effective_month = Column(Integer, nullable=True)
    effective_year = Column(Integer, nullable=True)


class ExpenseModel(BaseModelClass):
    __tablename__ = 'expenses'

    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(SQLEnum(FrequencyEnum), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey('budget_categories.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    effective_month = Column(Integer, nullable=True)
    effective_year = Column(Integer, nullable=True)

    # Relationships
    category = relationship("BudgetCategoryModel", back_populates="expenses")
