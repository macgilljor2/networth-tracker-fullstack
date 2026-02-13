from datetime import datetime
from enum import Enum as pyEnum
from typing import List, Optional
import uuid


from sqlalchemy import Column, String, Float, DateTime, Table, func, ForeignKey, Enum, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

from nw_tracker.utils.repository_utils import get_random_uuid

Base = declarative_base()


class BaseEnum(pyEnum):

    @classmethod
    def list(cls):
        return [item.value for item in cls]

    @classmethod
    def from_string(cls, value: str):
        # string to enum case insensitive
        value = value.lower()
        if value in cls.__members__ or value in cls._value2member_map_:
            return cls[value.upper()]
        else:
            raise ValueError(f"{value} is not a valid enum value")


class AccountType(BaseEnum):
    SAVINGS = "savings"
    CURRENT = "current"
    LOAN = "loan"
    CREDIT = "credit"
    INVESTMENT = "investment"

    def __str__( self):
        return self.value.capitalize()


class Currency(BaseEnum):
    GBP = "GBP"
    USD = "USD"
    EUR = "EUR"


class Theme(BaseEnum):
    LIGHT = "light"
    DARK = "dark"


account_group_association = Table(
    'account_group_association',
    Base.metadata,
    Column('account_id', UUID(as_uuid=True), ForeignKey('accounts.id', ondelete='CASCADE'), primary_key=True),
    Column('group_id', UUID(as_uuid=True), ForeignKey('account_groups.id', ondelete='CASCADE'), primary_key=True)
)

class BaseModelClass(Base):
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=get_random_uuid)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):

        attributes = vars(self)

        repr_str = f"{self.__class__.__name__}("
        repr_str += ", ".join(f"{key}={value!r}" for key, value in attributes.items())
        repr_str += ")"
        return repr_str



class Balance(BaseModelClass):
    __tablename__ = 'balances'
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    account_uuid = Column(UUID(as_uuid=True), ForeignKey('accounts.id'), nullable=False)

    ############# Relationships #############
    account = relationship("Account", back_populates="balances", uselist=False, passive_deletes=True)


class Account(BaseModelClass):
    __tablename__ = 'accounts'
    account_name = Column(String(50), nullable=False)
    currency = Column(Enum(Currency), nullable=False, default=Currency.GBP)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    account_type = Column(String(50), nullable=False, default='savings')
    is_excluded_from_totals = Column(Boolean, default=False, nullable=False)

    ############# Relationships #############
    balances = relationship("Balance", back_populates="account", cascade="all, delete-orphan", order_by="desc(Balance.date), desc(Balance.created_at)")
    groups = relationship("AccountGroup", secondary=account_group_association, back_populates="accounts")
    owner = relationship("User", back_populates="accounts", uselist=False, passive_deletes=True)


class User(BaseModelClass):
    __tablename__ = 'users'
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String(255), nullable=True)  # Nullable for existing users
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)

    ############# Relationships #############
    accounts = relationship("Account", back_populates="owner", cascade="all, delete-orphan")
    account_groups = relationship("AccountGroup", back_populates="owner", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates=None, uselist=False, cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class AccountGroup(BaseModelClass):
    __tablename__ = 'account_groups'
    name = Column(String(50), nullable=False)
    description = Column(String(250), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    ############# Relationships #############
    accounts = relationship("Account", secondary=account_group_association, back_populates="groups", passive_deletes=True)
    owner = relationship("User", back_populates="account_groups", uselist=False, passive_deletes=True)

class UserSettings(BaseModelClass):
    __tablename__ = 'user_settings'
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)  # Link to the user
    theme = Column(Enum(Theme), default=Theme.LIGHT)  # Example user setting: theme (light/dark)
    language = Column(String, default="en")


class ExchangeRate(BaseModelClass):
    __tablename__ = 'exchange_rates'
    base_currency = Column(String(3), nullable=False)  # GBP
    target_currency = Column(String(3), nullable=False, unique=True)  # USD, EUR
    rate = Column(Float, nullable=False)  # 1 GBP = X target_currency
    fetched_at = Column(DateTime, nullable=False)


class AccountTypeDefinition(BaseModelClass):
    __tablename__ = 'account_type_definitions'
    name = Column(String(50), nullable=False)  # e.g., "savings", "crypto"
    label = Column(String(50), nullable=False)  # e.g., "Savings", "Crypto Wallet"
    icon = Column(String(50), nullable=True)  # Optional: icon identifier
    is_default = Column(Boolean, default=False, nullable=False)  # System default types
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)  # NULL = system-wide


