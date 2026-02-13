from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from nw_tracker.models.models import BaseModelClass


class RefreshToken(BaseModelClass):
    """Refresh token model for storing refresh tokens in database."""
    __tablename__ = 'refresh_tokens'

    token = Column(String(500), nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    ############# Relationships #############
    user = relationship("User", back_populates="refresh_tokens")
