import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { SectionHeader } from '@/components/dashboard/SectionHeader';

describe('SectionHeader', () => {
  it('renders the title text', () => {
    render(<SectionHeader title="My Tasks" />);
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
  });

  it('renders count when provided and > 0', () => {
    render(<SectionHeader title="Tasks" count={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('does not render count when count is 0', () => {
    render(<SectionHeader title="Empty" count={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('does not render count when not provided', () => {
    render(<SectionHeader title="No Count" />);
    // Only the title text should be in the button
    expect(screen.getByRole('button').textContent?.trim()).toBe('No Count');
  });

  it('renders icon SVG when icon prop is provided', () => {
    render(<SectionHeader title="Starred" icon={Star} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render extra SVG when no icon', () => {
    render(<SectionHeader title="No Icon" />);
    // No icon SVG; ChevronDown is absent too (non-collapsible)
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  it('calls onToggle when collapsible and clicked', async () => {
    const onToggle = vi.fn();
    render(<SectionHeader title="Toggle Me" collapsible open={true} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /Toggle Me/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('does NOT call onToggle when not collapsible', async () => {
    const onToggle = vi.fn();
    render(<SectionHeader title="Static" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('button is disabled when not collapsible', () => {
    render(<SectionHeader title="Non-toggle" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders action slot', () => {
    render(
      <SectionHeader
        title="With Action"
        action={<button data-testid="action-btn">Add</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });
});
