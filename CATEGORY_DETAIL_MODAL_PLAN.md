# Category Detail Modal Implementation Plan

## Concept
When user clicks on a budget category card, open a detail modal showing:
- Category info (name, icon, color, essential flag)
- Statistics (monthly/yearly totals)
- List of all expenses in this category
- Action buttons: Delete, Configure (Edit)

## Frontend Components

### 1. CategoryDetailModal.tsx

```typescript
// frontend/src/components/budgets/category-detail-modal.tsx

export interface CategoryDetailModalProps {
  isOpen: boolean
  onClose: () => void
  category: BudgetCategory
  expenses: Expense[]  // All expenses, will filter by category
  onEdit: () => void
  onDelete: () => void
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  expenses,
  onEdit,
  onDelete
}) => {
  // Filter expenses for this category
  const categoryExpenses = expenses.filter(e => e.category_id === category.id)

  // Calculate totals
  const monthlyTotal = categoryExpenses
    .filter(e => e.frequency === Frequency.MONTHLY)
    .reduce((sum, e) => sum + e.amount, 0)

  const yearlyTotal = categoryExpenses
    .filter(e => e.frequency === Frequency.YEARLY)
    .reduce((sum, e) => sum + e.amount, 0)

  const annualizedMonthly = monthlyTotal * 12
  const totalYearlyCost = annualizedMonthly + yearlyTotal

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header with category info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-2xl">{category.icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">{category.name}</h2>
            {category.is_essential && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Essential
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Monthly</p>
          <p className="text-2xl font-mono font-bold text-accent">
            £{monthlyTotal.toLocaleString()}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Yearly Total</p>
          <p className="text-2xl font-mono font-bold text-primary">
            £{totalYearlyCost.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-3">Expenses</h3>
        {categoryExpenses.length === 0 ? (
          <p className="text-center text-muted py-6">
            No expenses in this category yet
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categoryExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    expense.frequency === Frequency.MONTHLY
                      ? 'bg-blue-100/50 text-blue-600'
                      : 'bg-purple-100/50 text-purple-600'
                  }`}>
                    {expense.frequency === Frequency.MONTHLY ? 'M' : 'Y'}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {expense.description}
                  </span>
                </div>
                <span className="text-sm font-mono text-muted">
                  £{expense.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onEdit}
          className="px-6 py-3 rounded-xl font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-all"
        >
          Configure
        </button>
        <button
          onClick={onDelete}
          className="px-6 py-3 rounded-xl font-semibold bg-accent hover:bg-accent/80 text-white transition-all"
        >
          Delete Category
        </button>
      </div>
    </Modal>
  )
}
```

### 2. Update Budgets Page

```typescript
// frontend/src/app/(dashboard)/budgets/page.tsx

// Add state for category detail modal
const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null)
const [categoryDetailModalOpen, setCategoryDetailModalOpen] = useState(false)

// Handle category click
const handleCategoryClick = (category: BudgetCategory) => {
  setSelectedCategory(category)
  setCategoryDetailModalOpen(true)
}

// Update category card to be clickable
<div
  key={cat.id}
  className="p-4 rounded-xl bg-card border border-primary/10 cursor-pointer hover:border-primary/50 transition-all"
  onClick={() => handleCategoryClick(cat)}
  // ... rest of props
>

// Add the modal to the page
{selectedCategory && (
  <CategoryDetailModal
    isOpen={categoryDetailModalOpen}
    onClose={() => {
      setCategoryDetailModalOpen(false)
      setSelectedCategory(null)
    }}
    category={selectedCategory}
    expenses={expenses}
    onEdit={() => {
      setCategoryDetailModalOpen(false)
      setCategoryToEdit(selectedCategory)
      setCategoryModalOpen(true)
    }}
    onDelete={() => {
      setCategoryDetailModalOpen(false)
      setItemToDelete({ type: 'category', id: selectedCategory.id })
    }}
  />
)}
```

## Alternative: Inline Actions

If you prefer simpler approach without modal, add actions to existing category cards:

```typescript
// In the category card, add hover actions
<div
  className="p-4 rounded-xl bg-card border border-primary/10 group relative"
>
  {/* Actions - show on hover */}
  <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={(e) => {
        e.stopPropagation()
        handleEditCategory(cat)
      }}
      className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center"
      title="Configure"
    >
      <svg className="w-4 h-4 text-primary">...settings icon...</svg>
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation()
        handleDeleteCategory(cat)
      }}
      className="w-8 h-8 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center"
      title="Delete"
    >
      <svg className="w-4 h-4 text-accent">...trash icon...</svg>
    </button>
  </div>

  {/* Rest of category card content */}
</div>
```

## User Flow Options

### Option 1: Modal on Click (Recommended)
- Click category card → Opens detail modal
- Modal shows info, stats, expenses, actions
- Clean, focused UX

### Option 2: Hover Actions (Simpler)
- Hover over category → Show edit/delete buttons
- Click to expand/collapse expenses
- Less modal fatigue

### Option 3: Hybrid
- Click category → Opens detail modal (read-only view)
- Hover → Quick actions (edit/delete)
- Best of both worlds

## Recommendation

I recommend **Option 1 (Modal)** because:
1. Clearer intent - click means "tell me more"
2. Shows full context - all expenses in one place
3. Actions are prominent - delete/configure are clear
4. Mobile-friendly - modals work well on mobile
5. Consistent with existing patterns - you already use modals

## Implementation Steps

1. Create `CategoryDetailModal.tsx` component
2. Add state to budgets page for selected category
3. Make category cards clickable
4. Wire up delete and configure actions
5. Add animations for smooth UX

## Quick Win: Start Simple

If you want to start simpler:
1. First add hover actions (edit/delete buttons) to category cards
2. Then add detail modal later when you want more context

This gives you immediate functionality without full modal implementation.
