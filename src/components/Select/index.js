import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCaretDown,
  faEdit,
  faPlus,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import { classes } from '../../utils';
import { Button } from '..';
import './stylesheet.scss';

export default function Select({ className, value, options }) {
  const [opened, setOpened] = useState(false);
  const [inputIndex, setInputIndex] = useState('');
  const [inputting, setInputting] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const optionsObtained = options;
  const selectedOption = optionsObtained.find(
    (option) => option.innerValue === currentValue
  );
  const label = selectedOption ? selectedOption.innerLabel : '-';
  const handleChangeVersionName = (e) => {
    const input = e.target.value.trim();
    setVersionName(`${input}`);
  };

  return (
    <div
      className={classes('Button', 'Select', className)}
      onClick={() => (!inputting ? setOpened(!opened) : setOpened(true))}
    >
      <div className="text">{label}</div>
      <FontAwesomeIcon fixedWidth icon={faCaretDown} />
      {opened && (
        <div
          className="intercept"
          onClick={() => (!inputting ? setOpened(false) : null)}
        />
      )}
      {opened && (
        <div className="option-container">
          {optionsObtained.map(
            (
              {
                innerValue,
                innerLabel,
                onClick,
                iconsAndFunctions = { icons: [], functions: {} }
              },
              index
            ) => (
              <div className="option" key={innerValue + innerLabel}>
                {inputting && inputIndex === innerValue ? (
                  <input
                    type="text"
                    key={`input${innerValue}`}
                    value={versionName}
                    onChange={handleChangeVersionName}
                    placeholder={innerValue}
                  />
                ) : (
                  <Button key={innerValue} onClick={() => onClick(innerValue)}>
                    {iconsAndFunctions.icons.includes('add') ? (
                      <FontAwesomeIcon fixedWidth icon={faPlus} />
                    ) : null}
                    {innerLabel}
                  </Button>
                )}
                {iconsAndFunctions.icons.includes('edit') ? (
                  <Button
                    key={`${innerValue}edit`}
                    onClick={() => {
                      if (innerValue === inputIndex) {
                        if (versionName === '') {
                          setVersionName('Blank');
                        }
                        iconsAndFunctions.functions.edit(versionName);
                        setCurrentValue(
                          innerValue === currentValue
                            ? versionName
                            : currentValue
                        );
                        optionsObtained[index].innerValue = versionName;
                        optionsObtained[index].innerLabel = versionName;
                        setInputting(false);
                        setInputIndex('');
                      } else {
                        setVersionName('');
                        setInputting(true);
                        setInputIndex(innerValue);
                      }
                    }}
                  >
                    <FontAwesomeIcon fixedWidth icon={faEdit} />
                  </Button>
                ) : null}
                {iconsAndFunctions.icons.includes('delete') ? (
                  <Button key={`${innerValue}delete`} onClick={() => null}>
                    <FontAwesomeIcon fixedWidth icon={faTrashAlt} />
                  </Button>
                ) : null}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
