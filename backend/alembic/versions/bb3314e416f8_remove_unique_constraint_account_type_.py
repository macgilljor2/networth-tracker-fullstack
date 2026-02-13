"""remove_unique_constraint_account_type_name

Revision ID: bb3314e416f8
Revises: 6e5cfc6c795e
Create Date: 2026-02-12 10:00:04.022019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb3314e416f8'
down_revision: Union[str, Sequence[str], None] = '6e5cfc6c795e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop unique constraint on name to allow duplicate names across users
    # Each user can now have their own custom types with the same name
    op.drop_constraint('account_type_definitions_name_key', 'account_type_definitions', type_='unique')


def downgrade() -> None:
    """Downgrade schema."""
    # Re-add unique constraint on name (revert to global uniqueness)
    op.create_unique_constraint(
        'account_type_definitions_name_key',
        'account_type_definitions',
        ['name']
    )
