import { useEffect } from 'react';
import { setSplitPressed } from '../../store/inventory';
import useKeyPress from '../../hooks/useKeyPress';
import { useAppDispatch } from '../../store';

const KeyPress: React.FC = () => {
  const dispatch = useAppDispatch();
  // Alt+drag splits a stack in half (NextGen binding)
  const altPressed = useKeyPress('Alt');

  useEffect(() => {
    dispatch(setSplitPressed(altPressed));
  }, [altPressed, dispatch]);

  return <></>;
};

export default KeyPress;
