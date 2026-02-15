"""update_budget_frequency_and_dates

Revision ID: 20250214_update_budget
Revises: c461c9878089
Create Date: 2025-02-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20250214_update_budget'
down_revision: Union[str, Sequence[str], None] = 'c461c9878089'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ENUM type for frequency
    frequencyenum = postgresql.ENUM('MONTHLY', 'YEARLY', 'ONE_TIME', name='frequencyenum')
    frequencyenum.create(op.get_bind())

    # Alter income.frequency column to use ENUM
    op.execute("ALTER TABLE income ALTER COLUMN frequency TYPE frequencyenum USING frequency::frequencyenum")

    # Alter expenses.frequency column to use ENUM
    op.execute("ALTER TABLE expenses ALTER COLUMN frequency TYPE frequencyenum USING frequency::frequencyenum")

    # Add effective_month and effective_year to income table
    op.add_column('income', sa.Column('effective_month', sa.Integer(), nullable=True))
    op.add_column('income', sa.Column('effective_year', sa.Integer(), nullable=True))

    # Add effective_month and effective_year to expenses table
    op.add_column('expenses', sa.Column('effective_month', sa.Integer(), nullable=True))
    op.add_column('expenses', sa.Column('effective_year', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove effective_month and effective_year from expenses
    op.drop_column('expenses', 'effective_year')
    op.drop_column('expenses', 'effective_month')

    # Remove effective_month and effective_year from income
    op.drop_column('income', 'effective_year')
    op.drop_column('income', 'effective_month')

    # Alter frequency columns back to String(20)
    op.execute("ALTER TABLE expenses ALTER COLUMN frequency TYPE VARCHAR(20) USING frequency::text")
    op.execute("ALTER TABLE income ALTER COLUMN frequency TYPE VARCHAR(20) USING frequency::text")

    # Drop ENUM type
    op.execute('DROP TYPE frequencyenum')
