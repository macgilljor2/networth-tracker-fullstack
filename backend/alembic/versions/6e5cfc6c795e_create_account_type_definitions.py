"""create_account_type_definitions

Revision ID: 6e5cfc6c795e
Revises: c986042317f3
Create Date: 2026-02-11 22:48:23.111855

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e5cfc6c795e'
down_revision: Union[str, Sequence[str], None] = 'c986042317f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Step 1: Create account_type_definitions table
    op.create_table('account_type_definitions',
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('label', sa.String(length=50), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('name')
    )

    # Step 2: Insert default account types (system-wide, user_id = NULL)
    from sqlalchemy import table, column
    from sqlalchemy.dialects import postgresql
    import uuid

    account_types_table = table('account_type_definitions',
        column('id', sa.UUID),
        column('name', sa.String),
        column('label', sa.String),
        column('icon', sa.String),
        column('is_default', sa.Boolean),
        column('user_id', sa.UUID),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )

    from datetime import datetime
    now = datetime.utcnow()

    default_types = [
        ('savings', 'Savings', None, True),
        ('current', 'Current Account', None, True),
        ('loan', 'Loan', None, True),
        ('credit', 'Credit Card', None, True),
        ('investment', 'Investment', None, True),
    ]

    for name, label, icon, is_default in default_types:
        op.execute(
            account_types_table.insert().values(
                id=uuid.uuid4(),
                name=name,
                label=label,
                icon=icon,
                is_default=is_default,
                user_id=None,
                created_at=now,
                updated_at=now
            )
        )

    # Step 3: Convert accounts.account_type from ENUM to VARCHAR(50)
    # First, create a new temporary column
    op.add_column('accounts', sa.Column('account_type_new', sa.String(length=50), nullable=True))

    # Migrate data from ENUM to string (convert to lowercase)
    op.execute('UPDATE accounts SET account_type_new = LOWER(account_type::text)')

    # Make the new column non-nullable
    op.alter_column('accounts', 'account_type_new', nullable=False)

    # Drop the old ENUM column
    op.drop_column('accounts', 'account_type')

    # Rename the new column to account_type
    op.alter_column('accounts', 'account_type_new', new_column_name='account_type')

    # Step 4: Drop the old ENUM type (if it exists)
    op.execute('DROP TYPE IF EXISTS accounttype')


def downgrade() -> None:
    """Downgrade schema."""
    # Step 1: Recreate the ENUM type
    accounttype_enum = sa.Enum('SAVINGS', 'CURRENT', 'LOAN', 'CREDIT', 'INVESTMENT', name='accounttype')
    accounttype_enum.create(op.get_bind(), checkfirst=True)

    # Step 2: Convert accounts.account_type back to ENUM
    # Create a new temporary column with ENUM type
    op.add_column('accounts', sa.Column('account_type_new', accounttype_enum, nullable=True))

    # Migrate data from string to ENUM (convert to uppercase)
    op.execute("UPDATE accounts SET account_type_new = UPPER(account_type)::accounttype")

    # Make the new column non-nullable
    op.alter_column('accounts', 'account_type_new', nullable=False)

    # Drop the old VARCHAR column
    op.drop_column('accounts', 'account_type')

    # Rename the new column to account_type
    op.alter_column('accounts', 'account_type_new', new_column_name='account_type')

    # Step 3: Drop account_type_definitions table
    op.drop_table('account_type_definitions')
