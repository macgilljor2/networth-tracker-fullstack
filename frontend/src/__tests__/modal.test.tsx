import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/modal'
import { ThemeProvider } from '@/hooks/use-theme'

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('Modal Component', () => {
  it('should not render when isOpen is false', () => {
    renderWithTheme(<Modal isOpen={false} onClose={vi.fn()}>Content</Modal>)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    renderWithTheme(<Modal isOpen={true} onClose={vi.fn()}>Content</Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should render with title', () => {
    renderWithTheme(
      <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
        Content
      </Modal>
    )
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
  })

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    renderWithTheme(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    expect(handleClose).toHaveBeenCalled()
  })

  it('should close when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    renderWithTheme(
      <Modal isOpen={true} onClose={handleClose}>
        Content
      </Modal>
    )

    // Click on the backdrop (the element with aria-hidden="true")
    const backdrop = screen.getByText('Content').closest('.fixed.inset-0.z-50')?.querySelector('[aria-hidden="true"]')
    if (backdrop) {
      await user.click(backdrop)
      expect(handleClose).toHaveBeenCalled()
    }
  })

  it('should not close when content is clicked', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    renderWithTheme(
      <Modal isOpen={true} onClose={handleClose}>
        <div data-testid="modal-content">Content</div>
      </Modal>
    )

    await user.click(screen.getByTestId('modal-content'))
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('should render with size medium by default', () => {
    renderWithTheme(
      <Modal isOpen={true} onClose={vi.fn()}>
        Content
      </Modal>
    )
    const modal = screen.getByText('Content').closest('.bg-white')
    expect(modal?.className).toContain('max-w-md')
  })

  it('should render with small size when specified', () => {
    renderWithTheme(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        Content
      </Modal>
    )
    const modal = screen.getByText('Content').closest('.bg-white')
    expect(modal?.className).toContain('max-w-sm')
  })

  it('should render with large size when specified', () => {
    renderWithTheme(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        Content
      </Modal>
    )
    const modal = screen.getByText('Content').closest('.bg-white')
    expect(modal?.className).toContain('max-w-lg')
  })

  it('should render footer', () => {
    renderWithTheme(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        footer={<button data-testid="footer-btn">Footer</button>}
      >
        Content
      </Modal>
    )
    expect(screen.getByTestId('footer-btn')).toBeInTheDocument()
  })
})
