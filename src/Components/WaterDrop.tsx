import './WaterDrop.less';

import * as React from 'react';
// import { gsap } from 'gsap';

const blockClass = `waterdrop`;

const width = 300;
const waterDepth = 100;
const mediumWaterDepth = 98;
const smallWaterDepth = 96;
const amountOfBars = 100;
const amplitudeDamp = 500;
const totalFrames = 60;
const duration = 5000; // in ms

type Point = { x: number; y: number };

function getRipple(
  damp: number,
  intialAmplitude: number,
  frequency: number,
  waveDamping: number,
  verticalOffset: number,
  phaseShift?: number,
) {
  let amplitude = intialAmplitude;

  const createRipple = (frameNumber: number, amp: number): Array<Point> => {
    return Array.from({ length: amountOfBars }, (_, i) => {
      const x = i * 3 - width / 2;
      const y =
        amp *
        Math.exp(-waveDamping * Math.abs(x)) *
        Math.cos(frequency * x + frameNumber - (phaseShift ?? 0));
      return { x: x + width / 2, y: y + verticalOffset };
    });
  };

  const points = Array.from({ length: totalFrames }, (_, i) => {
    const ripples = createRipple(i, amplitude);

    amplitude = amplitude * (1 - i / damp);

    return ripples;
  });
  return points;
}

export const WaterDrop = () => {
  const barRefs = React.useRef<Array<HTMLDivElement>>([]);
  const mediumBarRefs = React.useRef<Array<HTMLDivElement>>([]);
  const smallBarRefs = React.useRef<Array<HTMLDivElement>>([]);

  const bigFrames = React.useMemo(() => {
    return getRipple(amplitudeDamp, 50, 2, 0.02, waterDepth);
  }, []);

  const bigKeyframes = React.useMemo(() => {
    return Array.from({ length: amountOfBars }, (_, i) => {
      return bigFrames.map((frame) => {
        return {
          left: `${frame[i].x}px`,
          height: `${frame[i].y}px`,
        };
      });
    });
  }, [bigFrames]);

  const mediumFrames = React.useMemo(() => {
    return getRipple(amplitudeDamp, 45, 2, 0.02, mediumWaterDepth, 10);
  }, []);

  const mediumKeyframes = React.useMemo(() => {
    return Array.from({ length: amountOfBars }, (_, i) => {
      return mediumFrames.map((frame) => {
        return {
          left: `${frame[i].x}px`,
          height: `${frame[i].y}px`,
        };
      });
    });
  }, [mediumFrames]);

  const smallFrames = React.useMemo(() => {
    return getRipple(amplitudeDamp, 40, 2.3, 0.05, smallWaterDepth, 12);
  }, []);

  const smallKeyframes = React.useMemo(() => {
    return Array.from({ length: amountOfBars }, (_, i) => {
      return mediumFrames.map((frame) => {
        return {
          left: `${frame[i].x}px`,
          height: `${frame[i].y}px`,
        };
      });
    });
  }, [mediumFrames]);

  console.log(frames, bigKeyframes);

  const triggerAnimaton = () => {
    barRefs.current.forEach((bar, idx) => {
      bar.animate(bigKeyframes[idx], duration);
    });

    mediumBarRefs.current.forEach((bar, idx) => {
      bar.animate(mediumKeyframes[idx], duration);
    });

    smallBarRefs.current.forEach((bar, idx) => {
      bar.animate(smallKeyframes[idx], duration);
    });
  };

  return (
    <div className={blockClass}>
      <div className={blockClass + '__ripple'}>
        {bigFrames[0].map((_, idx) => {
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

        {mediumFrames[0].map((_, idx) => {
          return (
            <div
              key={idx}
              ref={(el: HTMLDivElement) => {
                mediumBarRefs.current[idx] = el;
              }}
              className={blockClass + '__bar ' + blockClass + '__bar--medium'}
              style={{ left: `${idx * 3}px`, height: `${mediumWaterDepth}px` }}
            />
          );
        })}

        {smallFrames[0].map((_, idx) => {
          return (
            <div
              key={idx}
              ref={(el: HTMLDivElement) => {
                smallBarRefs.current[idx] = el;
              }}
              className={blockClass + '__bar ' + blockClass + '__bar--small'}
              style={{ left: `${idx * 3}px`, height: `${smallWaterDepth}px` }}
            />
          );
        })}
      </div>

      <button onClick={triggerAnimaton}>Throw rock into the water</button>
    </div>
  );
};
