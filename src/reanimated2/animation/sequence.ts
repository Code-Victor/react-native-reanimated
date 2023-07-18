import { defineAnimation, shouldReduceMotion } from './util';
import type {
  NextAnimation,
  ReducedMotionConfig,
  SequenceAnimation,
} from './commonTypes';
import type {
  Animation,
  AnimatableValue,
  AnimationObject,
  Timestamp,
} from '../commonTypes';

export function withSequence<T extends AnimatableValue>(
  _reduceMotion: ReducedMotionConfig,
  ...animations: T[]
): T;

export function withSequence<T extends AnimatableValue>(...animations: T[]): T;

export function withSequence(
  _reduceMotion: ReducedMotionConfig | NextAnimation<AnimationObject>,
  ..._animations: NextAnimation<AnimationObject>[]
): Animation<SequenceAnimation> {
  'worklet';
  return defineAnimation<SequenceAnimation>(
    _animations[0] as SequenceAnimation,
    () => {
      'worklet';
      let reduceMotion: ReducedMotionConfig | undefined;

      if (typeof _reduceMotion === 'string') {
        reduceMotion = _reduceMotion as ReducedMotionConfig;
      } else {
        _animations.unshift(_reduceMotion as NextAnimation<AnimationObject>);
      }

      const animations = _animations.map((a) => {
        const result = typeof a === 'function' ? a() : a;
        result.finished = false;
        return result;
      });

      function nextIndex(index: number) {
        while (
          index < animations.length - 1 &&
          animations[index].reduceMotion
        ) {
          index += 1;
        }

        return index;
      }

      const callback = (finished: boolean): void => {
        if (finished) {
          // we want to call the callback after every single animation
          // not after all of them
          return;
        }
        // this is going to be called only if sequence has been cancelled
        animations.forEach((animation) => {
          if (typeof animation.callback === 'function' && !animation.finished) {
            animation.callback(finished);
          }
        });
      };

      function sequence(animation: SequenceAnimation, now: Timestamp): boolean {
        const currentAnim = animations[animation.animationIndex];
        const finished = currentAnim.onFrame(currentAnim, now);
        animation.current = currentAnim.current;
        if (finished) {
          // we want to call the callback after every single animation
          if (currentAnim.callback) {
            currentAnim.callback(true /* finished */);
          }
          currentAnim.finished = true;
          animation.animationIndex = nextIndex(animation.animationIndex + 1);
          if (animation.animationIndex < animations.length) {
            const nextAnim = animations[animation.animationIndex];
            nextAnim.onStart(nextAnim, currentAnim.current, now, currentAnim);
            return false;
          }
          return true;
        }
        return false;
      }

      function onStart(
        animation: SequenceAnimation,
        value: AnimatableValue,
        now: Timestamp,
        previousAnimation: SequenceAnimation
      ): void {
        animations.forEach((anim) => {
          if (anim.reduceMotion === undefined) {
            anim.reduceMotion = animation.reduceMotion;
          }
        });
        animation.animationIndex = nextIndex(0);

        if (previousAnimation === undefined) {
          previousAnimation = animations[
            animations.length - 1
          ] as SequenceAnimation;
        }

        const currentAnim = animations[animation.animationIndex];
        currentAnim.onStart(currentAnim, value, now, previousAnimation);
      }

      return {
        isHigherOrder: true,
        onFrame: sequence,
        onStart,
        animationIndex: 0,
        current: animations[0].current,
        callback,
        reduceMotion: shouldReduceMotion(reduceMotion),
      } as SequenceAnimation;
    }
  );
}
