"""add_is_excluded_from_totals_to_accounts

Revision ID: c986042317f3
Revises: 20250205_add_exchange_rates
Create Date: 2026-02-10 14:12:08.613548

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c986042317f3'
down_revision: Union[str, Sequence[str], None] = '20250205_add_exchange_rates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('accounts', sa.Column('is_excluded_from_totals', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('accounts', 'is_excluded_from_totals')
