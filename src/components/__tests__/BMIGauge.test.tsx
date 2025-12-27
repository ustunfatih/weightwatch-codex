import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { BMIGauge } from '../BMIGauge';

describe('BMIGauge', () => {
  it('should render BMI value correctly', () => {
    render(<BMIGauge weight={70} height={170} />);

    // BMI for 70kg at 170cm is 24.22
    expect(screen.getByText(/24\.2/)).toBeInTheDocument();
  });

  it('should display correct BMI category for underweight', () => {
    render(<BMIGauge weight={50} height={170} />);

    expect(screen.getAllByText('Underweight').length).toBeGreaterThan(0);
  });

  it('should display correct BMI category for normal weight', () => {
    render(<BMIGauge weight={70} height={170} />);

    expect(screen.getAllByText('Normal').length).toBeGreaterThan(0);
  });

  it('should display correct BMI category for overweight', () => {
    render(<BMIGauge weight={85} height={170} />);

    expect(screen.getAllByText('Overweight').length).toBeGreaterThan(0);
  });

  it('should display correct BMI category for obese', () => {
    render(<BMIGauge weight={100} height={170} />);

    expect(screen.getAllByText('Obese').length).toBeGreaterThan(0);
  });

  it('should render with correct aria labels', () => {
    const { container } = render(<BMIGauge weight={70} height={170} />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-label');
  });
});
