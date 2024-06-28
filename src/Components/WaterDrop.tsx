import './WaterDrop.less';

import * as React from 'react';
// import { gsap } from 'gsap';

const blockClass = `waterdrop`;

const width = 300;
const waterDepth = 100;
const amountOfBars = 100;
const totalFrames = 1000;
const duration = 5000; // in ms

type Point = { x: number; y: number };

function getRipple(totalFrames: number) {
  const intialAmplitude = 50;
  let amplitude = intialAmplitude;
  const frequency = 2;
  const damping = 0.02;

  const createRipple = (frameNumber: number, amp: number): Array<Point> => {
    return Array.from({ length: amountOfBars }, (_, i) => {
      const x = i * 3 - width / 2;
      const y =
        amp *
        Math.exp(-damping * Math.abs(x)) *
        Math.cos(frequency * x + frameNumber);
      return { x: x + width / 2, y: y + waterDepth };
    });
  };

  const points = Array.from({ length: amountOfBars }, (_, i) => {
    const ripples = createRipple(i, amplitude);

    amplitude = amplitude * (1 - i / totalFrames);

    return ripples;
  });
  return points;
}

export const WaterDrop = () => {
  const barRefs = React.useRef<Array<HTMLDivElement>>([]);
  const points = React.useMemo(() => {
    return getRipple(totalFrames);
  }, []);

  const keyframes = React.useMemo(() => {
    return Array.from({ length: amountOfBars }, (_, i) => {
      const frames = points.map((frame) => {
        return {
          left: `${frame[i]?.x}px`,
          height: `${frame[i]?.y}px`,
        };
      });

      return frames;
    });
  }, [points]);

  console.log(points);

  const triggerAnimaton = () => {
    barRefs.current.forEach((bar, idx) => {
      bar.animate(keyframes[idx], duration);
    });
  };

  return (
    <div className={blockClass}>
      <div className={blockClass + '__ripple'}>
        {points.map((_, idx) => {
          return (
            <div
              key={idx}
              ref={(el: HTMLDivElement) => {
                barRefs.current[idx] = el;
              }}
              className={blockClass + '__bar'}
              style={{ left: `${idx * 3}px`, height: `${waterDepth}px` }}
            />
          );
        })}
      </div>

      <button onClick={triggerAnimaton}>Throw rock into the water</button>
    </div>
  );
};
