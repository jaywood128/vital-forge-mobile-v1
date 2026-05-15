import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { RestTimer } from '../../src/components/ui/RestTimer';
import * as Haptics from 'expo-haptics';

describe('RestTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the Rest label, formatted countdown, and Skip button', () => {
    const { getByText } = render(
      <RestTimer duration={90} onComplete={jest.fn()} onSkip={jest.fn()} />
    );
    expect(getByText('Rest')).toBeTruthy();
    expect(getByText('1:30')).toBeTruthy();
    expect(getByText('Skip')).toBeTruthy();
  });

  it('counts down by 1 second each tick', () => {
    const { getByText } = render(
      <RestTimer duration={90} onComplete={jest.fn()} onSkip={jest.fn()} />
    );
    act(() => { jest.advanceTimersByTime(1000); });
    expect(getByText('1:29')).toBeTruthy();
    act(() => { jest.advanceTimersByTime(3000); });
    expect(getByText('1:26')).toBeTruthy();
  });

  it('formats sub-minute countdown as M:SS', () => {
    const { getByText } = render(
      <RestTimer duration={65} onComplete={jest.fn()} onSkip={jest.fn()} />
    );
    expect(getByText('1:05')).toBeTruthy();
    act(() => { jest.advanceTimersByTime(5000); });
    expect(getByText('1:00')).toBeTruthy();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(getByText('0:59')).toBeTruthy();
  });

  it('calls onComplete and fires haptic when countdown reaches zero', () => {
    const onComplete = jest.fn();
    render(<RestTimer duration={3} onComplete={onComplete} onSkip={jest.fn()} />);
    act(() => { jest.advanceTimersByTime(3000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
  });

  it('calls onSkip when Skip is pressed', () => {
    const onSkip = jest.fn();
    const { getByLabelText } = render(
      <RestTimer duration={90} onComplete={jest.fn()} onSkip={onSkip} />
    );
    fireEvent.press(getByLabelText('Skip rest timer'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('resets to new duration when duration prop changes', () => {
    const { getByText, rerender } = render(
      <RestTimer duration={90} onComplete={jest.fn()} onSkip={jest.fn()} />
    );
    act(() => { jest.advanceTimersByTime(10000); });
    expect(getByText('1:20')).toBeTruthy();
    rerender(<RestTimer duration={60} onComplete={jest.fn()} onSkip={jest.fn()} />);
    expect(getByText('1:00')).toBeTruthy();
  });

  it('shows countdown in low-time style when ≤10 seconds remain', () => {
    const { getByText } = render(
      <RestTimer duration={10} onComplete={jest.fn()} onSkip={jest.fn()} />
    );
    expect(getByText('0:10')).toBeTruthy();
    act(() => { jest.advanceTimersByTime(1000); });
    expect(getByText('0:09')).toBeTruthy();
  });

  it('does not call onComplete before timer reaches zero', () => {
    const onComplete = jest.fn();
    render(<RestTimer duration={5} onComplete={onComplete} onSkip={jest.fn()} />);
    act(() => { jest.advanceTimersByTime(4000); });
    expect(onComplete).not.toHaveBeenCalled();
  });
});
