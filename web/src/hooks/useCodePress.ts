import { useEffect, useState } from 'react';

// Tracks whether a physical key (by event.code, e.g. 'KeyZ') is held.
// Unlike useKeyPress this is layout-independent and ignores Shift casing.
export const useCodePress = (targetCode: string) => {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => event.code === targetCode && setPressed(true);
    const up = (event: KeyboardEvent) => event.code === targetCode && setPressed(false);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      setPressed(false);
    };
  }, [targetCode]);

  return pressed;
};

export default useCodePress;
