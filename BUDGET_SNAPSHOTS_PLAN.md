# Budget Snapshots Implementation Plan

## Concept
Users can take snapshots of their budget at any point in time to:
- Save current budget state
- Compare different time periods
- Track progress over time
- Backup/restore budgets

## Data Model

### New Table: `budget_snapshots`
```sql
CREATE TABLE budget_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_name VARCHAR(255),
    notes TEXT,
    snapshot_data JSONB NOT NULL,  -- Complete budget state
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_snapshots_user_created ON budget_snapshots(user_id, created_at DESC);
```

### JSON Structure for `snapshot_data`
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Housing",
      "icon": "🏠",
      "color": "#2d5a27",
      "is_essential": true
    }
  ],
  "income": [
    {
      "description": "Salary",
      "amount": 5000,
      "frequency": "MONTHLY",
      "is_net": true
    }
  ],
  "expenses": [
    {
      "description": "Rent",
      "amount": 1800,
      "frequency": "MONTHLY",
      "category_name": "Housing",
      "category_id": "uuid"
    }
  ],
  "summary": {
    "monthly_income": 5850,
    "monthly_expenses": 4250,
    "surplus_deficit": 1600,
    "savings_rate": 27.4,
    "snapshot_date": "2025-02-16"
  }
}
```

## Backend Implementation

### Model: `BudgetSnapshotModel`
```python
# backend/nw_tracker/models/budget_snapshot_model.py
class BudgetSnapshotModel(Base):
    __tablename__ = "budget_snapshots"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    snapshot_name = Column(String(255))
    notes = Column(Text)
    snapshot_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserModel", back_populates="budget_snapshots")
```

### Request/Response Models
```python
# backend/nw_tracker/models/budget_snapshot_request_response.py

class CreateSnapshotRequest(BaseModel):
    snapshot_name: Optional[str] = None
    notes: Optional[str] = None

class SnapshotResponse(BaseModel):
    id: str
    user_id: str
    snapshot_name: Optional[str]
    notes: Optional[str]
    snapshot_data: dict
    created_at: datetime
```

### Repository
```python
# backend/nw_tracker/repositories/budget_snapshot_repository.py

class BudgetSnapshotRepository(GenericRepository[BudgetSnapshotModel]):
    def get_user_snapshots(self, user_id: str, limit: int = 20) -> List[BudgetSnapshotModel]:
        return (
            self.db.query(BudgetSnapshotModel)
            .filter(BudgetSnapshotModel.user_id == user_id)
            .order_by(BudgetSnapshotModel.created_at.desc())
            .limit(limit)
            .all()
        )
```

### Service
```python
# backend/nw_tracker/services/budget_snapshot_service.py

class BudgetSnapshotService:
    def create_snapshot(self, user_id: str, snapshot_data: CreateSnapshotRequest) -> SnapshotResponse:
        """Create a snapshot of current budget state"""

        # Get all current budget data
        categories = self.category_repo.get_all_for_user(user_id)
        income = self.income_repo.get_all_for_user(user_id)
        expenses = self.expense_repo.get_all_for_user(user_id)

        # Calculate summary
        summary = self._calculate_summary(income, expenses)

        # Build snapshot data
        snapshot_data = {
            "categories": [self._serialize_category(c) for c in categories],
            "income": [self._serialize_income(i) for i in income],
            "expenses": [self._serialize_expense(e) for e in expenses],
            "summary": summary
        }

        # Save snapshot
        snapshot = BudgetSnapshotModel(
            user_id=user_id,
            snapshot_name=snapshot_data.snapshot_name or f"Snapshot {datetime.now().strftime('%Y-%m-%d')}",
            notes=snapshot_data.notes,
            snapshot_data=snapshot_data
        )

        return self.snapshot_repo.create(snapshot)

    def get_snapshots(self, user_id: str) -> List[SnapshotResponse]:
        """Get all snapshots for user"""
        return self.snapshot_repo.get_user_snapshots(user_id)

    def compare_snapshots(self, user_id: str, snapshot1_id: str, snapshot2_id: str) -> dict:
        """Compare two snapshots and show differences"""
        snap1 = self.snapshot_repo.get_by_id_and_user(snapshot1_id, user_id)
        snap2 = self.snapshot_repo.get_by_id_and_user(snapshot2_id, user_id)

        return {
            "snapshot1": {
                "name": snap1.snapshot_name,
                "date": snap1.created_at,
                "summary": snap1.snapshot_data.get("summary", {})
            },
            "snapshot2": {
                "name": snap2.snapshot_name,
                "date": snap2.created_at,
                "summary": snap2.snapshot_data.get("summary", {})
            },
            "differences": {
                "income_change": snap2.snapshot_data["summary"]["monthly_income"] - snap1.snapshot_data["summary"]["monthly_income"],
                "expenses_change": snap2.snapshot_data["summary"]["monthly_expenses"] - snap1.snapshot_data["summary"]["monthly_expenses"],
                "savings_rate_change": snap2.snapshot_data["summary"]["savings_rate"] - snap1.snapshot_data["summary"]["savings_rate"]
            }
        }

    def delete_snapshot(self, user_id: str, snapshot_id: str) -> bool:
        """Delete a snapshot"""
        return self.snapshot_repo.delete(snapshot_id)
```

### API Routes
```python
# backend/nw_tracker/router/v1/budget_snapshots.py

@router.post("", response_model=SnapshotResponse)
def create_snapshot(
    snapshot_data: CreateSnapshotRequest,
    current_user: UserModel = Depends(get_current_user),
    service: BudgetSnapshotService = Depends()
):
    """Create a budget snapshot"""
    return service.create_snapshot(current_user.id, snapshot_data)

@router.get("", response_model=List[SnapshotResponse])
def get_snapshots(
    current_user: UserModel = Depends(get_current_user),
    service: BudgetSnapshotService = Depends()
):
    """Get all budget snapshots"""
    return service.get_snapshots(current_user.id)

@router.get("/{snapshot_id}/compare/{other_snapshot_id}")
def compare_snapshots(
    snapshot_id: str,
    other_snapshot_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: BudgetSnapshotService = Depends()
):
    """Compare two snapshots"""
    return service.compare_snapshots(current_user.id, snapshot_id, other_snapshot_id)

@router.delete("/{snapshot_id}")
def delete_snapshot(
    snapshot_id: str,
    current_user: UserModel = Depends(get_current_user),
    service: BudgetSnapshotService = Depends()
):
    """Delete a snapshot"""
    service.delete_snapshot(current_user.id, snapshot_id)
    return {"message": "Snapshot deleted"}
```

## Frontend Implementation

### Components to Create

1. **`BudgetSnapshotModal.tsx`** - Create snapshot modal
2. **`SnapshotList.tsx`** - List all snapshots
3. **`SnapshotComparison.tsx`** - Compare two snapshots
4. **`CategoryDetailModal.tsx`** - Category details modal (second feature)

### Page Updates

**Add to Budgets Page:**
- "Take Snapshot" button
- "View Snapshots" section
- Snapshot comparison view

## UI Flow

```
Budgets Page
├─ [Take Snapshot] button → Opens modal
│   ├─ Enter name (optional)
│   ├─ Add notes (optional)
│   └─ [Save] → Creates snapshot
│
├─ [View Snapshots] section
│   ├─ List of snapshots (newest first)
│   ├─ Each shows: name, date, summary
│   ├─ [Compare] button → Select 2 snapshots to compare
│   └─ [Delete] button
│
└─ Category Cards
    ├─ Click category → Opens CategoryDetailModal
    │   ├─ Category details
    │   ├─ List of expenses
    │   ├─ [Delete] button
    │   └─ [Configure] button → Opens edit modal
```

## Database Migration

```python
# alembic/versions/XXXX_add_budget_snapshots.py

def upgrade():
    op.create_table(
        'budget_snapshots',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('snapshot_name', sa.String(255)),
        sa.Column('notes', sa.Text()),
        sa.Column('snapshot_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index('idx_budget_snapshots_user_created', 'budget_snapshots',
                    ['user_id', sa.text('created_at DESC')])

def downgrade():
    op.drop_index('idx_budget_snapshots_user_created')
    op.drop_table('budget_snapshots')
```

## Benefits

1. **Track Progress** - See how budget evolved over months
2. **Compare Periods** - "How did my budget change from January to June?"
3. **Backup** - Never lose budget data
4. **Export/Import** - Share budgets between accounts
5. **Analysis** - Identify spending trends over time
