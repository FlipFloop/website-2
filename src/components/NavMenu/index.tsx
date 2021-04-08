import React from 'react';
import { Button } from '..';
import { classes } from '../../utils';

import './stylesheet.scss';

export type NavMenuProps = {
  items: string[];
  currentItem: number;
  onChangeItem: (next: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Renders a vertical nav menu with a single active item
 */
const NavMenu = ({
  items,
  currentItem,
  onChangeItem,
  className,
  style
}: NavMenuProps) => {
  return (
    <div className={classes('nav-menu', className)} style={style}>
      {items.map((item, idx) => (
        <Button
          key={idx}
          className={classes('nav-button', currentItem === idx && 'active')}
          onClick={() => onChangeItem(idx)}
        >
          {item}
        </Button>
      ))}
    </div>
  );
};

export default NavMenu;
