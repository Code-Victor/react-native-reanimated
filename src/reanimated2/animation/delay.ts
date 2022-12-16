import { defineAnimation } from './util';
import {
  Animation,
  Timestamp,
  AnimatableValue,
  AnimationObject,
} from '../commonTypes';
import { DelayAnimation } from './commonTypes';

export function withDelay<T extends AnimationObject>(
  delayMs: number,
  _nextAnimation: T | (() => T)
): Animation<DelayAnimation> {
  'worklet';
  return defineAnimation<DelayAnimation, T>(
    _nextAnimation,
    (): DelayAnimation => {
      'worklet';
      const nextAnimation =
        typeof _nextAnimation === 'function'
          ? _nextAnimation()
          : _nextAnimation;

      function delay(animation: DelayAnimation, now: Timestamp): boolean {
        const { startTime, started, previousAnimation } = animation;
        const current: AnimatableValue = animation.current;

        if (now - startTime > delayMs) {
          if (!started) {
            nextAnimation.onStart(
              nextAnimation,
              current,
              now,
              previousAnimation!
            );
            animation.previousAnimation = null;
            animation.started = true;
          }
          const finished = nextAnimation.onFrame(nextAnimation, now);
          animation.current = nextAnimation.current!;
          return finished;
        } else if (previousAnimation) {
          const finished =
            previousAnimation.finished ||
            previousAnimation.onFrame(previousAnimation, now);
          animation.current = previousAnimation.current;
          if (finished) {
            animation.previousAnimation = null;
          }
        }
        return false;
      }

      function onStart(
        animation: Animation<any>,
        value: AnimatableValue,
        now: Timestamp,
        previousAnimation: Animation<any> | null
      ): void {
        animation.startTime = now;
        animation.started = false;
        animation.current = value;
        if (previousAnimation === animation) {
          animation.previousAnimation = previousAnimation.previousAnimation;
        } else {
          animation.previousAnimation = previousAnimation;
        }
      }

      const callback = (finished?: boolean): void => {
        if (nextAnimation.callback) {
          nextAnimation.callback(finished);
        }
      };

      return {
        isHigherOrder: true,
        onFrame: delay,
        onStart,
        current: nextAnimation.current!,
        callback,
        previousAnimation: null,
        startTime: 0,
        started: false,
      };
    }
  );
}
