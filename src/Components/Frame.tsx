import * as React from 'react';

interface FrameProps {
  children: React.ReactNode;
}

export const Frame = ({ children }: FrameProps) => {
  return <div>{children}</div>;
};
