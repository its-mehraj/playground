import './Slider.less';

import * as React from 'react';

import { Scroll } from './Scroll';

const blockClass = 'tt-slider';

interface SliderProps {
  // eslint-disable-next-line no-unused-vars
  onChange: (_delta: number) => void;
  referenceIndex?: number;
  index?: number;
  barConfig?: { height: number; gap: number };
  overscan?: number;
}

const Slider = ({
  onChange,
  referenceIndex = 0,
  index,
  barConfig = { height: 1, gap: 4 },
  overscan = 10,
}: SliderProps) => {
  return (
    <div className={blockClass}>
      <Scroll
        onChange={onChange}
        barConfig={barConfig}
        overscan={overscan}
        referenceIndex={referenceIndex}
        index={index}
      />
    </div>
  );
};

export const SliderContainer = () => {
  const referenceValue = 100;
  const [limitPrice, setLimitPrice] = React.useState(referenceValue);
  const limitPriceRef = React.useRef(limitPrice);
  limitPriceRef.current = limitPrice;
  const getStep = React.useCallback(() => {
    if (limitPriceRef.current <= 75) {
      return 0.2;
    } else if (limitPriceRef.current <= 10) {
      return 0.1;
    } else if (limitPriceRef.current <= 1) {
      return 0.05;
    } else {
      return 0.5;
    }
  }, []);

  const getNTickDistanceToValue = React.useCallback(
    (delta: number) => {
      const step = getStep();
      const newValue = limitPriceRef.current + step * delta;
      return newValue;
    },
    [getStep],
  );

  const onChange = React.useCallback(
    (delta: number) => {
      const newValue = getNTickDistanceToValue(delta);
      setLimitPrice(newValue);
    },
    [getNTickDistanceToValue],
  );

  const getDistanceInTicks = React.useCallback((ref: number, val: number) => {
    // Recursive program
    // checks pricePrecision/step size
    // gets how many steps are in this range left
    // get all further steps required in each priceprecision to ref value

    return ref - val;
  }, []);

  return (
    <div className={`${blockClass}__container`}>
      <div className={`${blockClass}__controls`}>
        <div className={`${blockClass}__refernce`}>
          Reference: {referenceValue}
        </div>
        <div className={`${blockClass}__limit`}>Value: {limitPrice}</div>
      </div>

      <Slider
        onChange={onChange}
        referenceIndex={0}
        index={getDistanceInTicks(referenceValue, limitPrice)}
      />
    </div>
  );
};
