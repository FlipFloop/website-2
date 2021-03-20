import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAdjust,
  faBars,
  faCalendarAlt,
  faDownload,
  faPaste
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import Cookies from 'js-cookie';
import domtoimage from 'dom-to-image';
import { saveAs } from 'file-saver';
import ReactTooltip from 'react-tooltip';
import copy from 'copy-to-clipboard';
import { getSemesterName } from '../../utils';
import { PNG_SCALE_FACTOR } from '../../constants';
import ics from '../../libs/ics';
import { Button, Calendar, Select, Tab } from '..';
import { useMobile } from '../../hooks';
import {
  ScheduleContext,
  TermsContext,
  ThemeContext,
  VersionsContext
} from '../../contexts';
import { ICS } from '../../types';

export type HeaderProps = {
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
};

/**
 * Renders the top header component,
 * and includes controls for top-level tab-based navigation
 */
const Header = ({
  currentTab,
  onChangeTab,
  onToggleMenu,
  tabs
}: HeaderProps) => {
  const [{ term, oscar, pinnedCrns }, { setTerm, setVersionName }] = useContext(
    ScheduleContext
  );
  const [terms] = useContext(TermsContext);
  const [versions, setVersions] = useContext(VersionsContext);
  const [theme, setTheme] = useContext(ThemeContext);
  const [versionIndex, setVersionIndex] = useState(1);
  const possibleVersions = [
    'Primary',
    'Secondary',
    'Tertiary',
    'Quaternary',
    'Quinary',
    'Senary',
    'Septenary',
    'Octonary',
    'Nonary',
    'Denary'
  ];
  const captureRef = useRef<HTMLDivElement>(null);

  const addVersion = () => {
    versions.splice(
      versions.length - 1,
      0,
      possibleVersions[versions.length - 1]
    );
    setVersions(versions);
    setVersionIndex(versions.length - 1);
    setVersionName(versions[versionIndex - 1]);
    if (versionIndex === 9) {
      versions.pop();
      setVersions(versions);
    }
  };

  const setVersionIndexBasedOnText = (text: string) => {
    setVersionIndex(versions.indexOf(text) + 1);
    setVersionName(versions[versionIndex - 1]);
  };

  const handleThemeChange = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    Cookies.set('theme', newTheme, { expires: 1460 });
    setTheme(newTheme);
  }, [theme, setTheme]);

  const totalCredits = useMemo(() => {
    return pinnedCrns.reduce((credits, crn) => {
      return credits + oscar.findSection(crn).credits;
    }, 0);
  }, [pinnedCrns, oscar]);

  const handleExport = useCallback(() => {
    const cal = ics() as ICS | undefined;
    if (cal == null) {
      window.alert('This browser does not support calendar export');
      return;
    }

    pinnedCrns.forEach((crn) => {
      const section = oscar.findSection(crn);
      // TODO supply better types
      section.meetings.forEach((meeting: any) => {
        if (!meeting.period || !meeting.days.length) return;
        const { from, to } = meeting.dateRange;
        const subject = section.course.id;
        const description = section.course.title;
        const location = meeting.where;
        const begin = new Date(from.getTime());
        while (
          !meeting.days.includes(
            ['-', 'M', 'T', 'W', 'R', 'F', '-'][begin.getDay()]
          )
        ) {
          begin.setDate(begin.getDate() + 1);
        }
        begin.setHours(meeting.period.start / 60, meeting.period.start % 60);
        const end = new Date(begin.getTime());
        end.setHours(meeting.period.end / 60, meeting.period.end % 60);
        const rrule = {
          freq: 'WEEKLY',
          until: to,
          byday: meeting.days.map(
            (day: 'M' | 'T' | 'W' | 'R' | 'F') =>
              ({ M: 'MO', T: 'TU', W: 'WE', R: 'TH', F: 'FR' }[day])
          )
        };
        cal.addEvent(subject, description, location, begin, end, rrule);
      });
    });
    cal.download('gt-scheduler');
  }, [oscar, pinnedCrns]);

  const handleDownload = useCallback(() => {
    const captureElement = captureRef.current;
    if (captureElement == null) return;

    const computed = window
      .getComputedStyle(captureElement)
      .getPropertyValue('left');

    domtoimage
      .toBlob(captureElement, {
        width: captureElement.offsetWidth * PNG_SCALE_FACTOR,
        height: captureElement.offsetHeight * PNG_SCALE_FACTOR,
        style: {
          transform: `scale(${PNG_SCALE_FACTOR})`,
          'transform-origin': `${computed} 0px`,
          'background-color': theme === 'light' ? '#FFFFFF' : '#333333'
        }
      })
      .then((blob) => saveAs(blob, 'schedule.png'));
  }, [captureRef, theme]);

  // Obtain a ref to the copy button to only close its tooltip
  const crnButton = useRef<HTMLDivElement>(null);

  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = useMobile();
  return (
    <div className="Header">
      {/* Menu button, only displayed on mobile */}
      {mobile && (
        <Button className="nav-menu-button" onClick={onToggleMenu}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faBars} />
        </Button>
      )}

      {/* Left-aligned logo */}
      <Button className="logo">
        <span className="gt">GT </span>
        <span className="scheduler">Scheduler</span>
      </Button>

      {/* Term selector */}
      <Select
        value={term}
        options={terms.map((currentTerm) => ({
          innerValue: currentTerm,
          innerLabel: getSemesterName(currentTerm),
          onClick: setTerm
        }))}
        className="semester"
      />

      {/* Version selector */}
      <Select
        value={versions[versionIndex - 1]}
        options={versions.map((currentVersion, index) => ({
          innerValue: currentVersion,
          innerLabel: currentVersion,
          onClick:
            currentVersion === 'New' ? addVersion : setVersionIndexBasedOnText,
          iconsAndFunctions:
            currentVersion === 'New'
              ? { icons: ['add'], functions: [null] }
              : {
                  icons: ['edit', 'delete'],
                  functions: {
                    edit: (name: string) => {
                      setVersions(
                        versions.map((item, i) => {
                          if (i === index) {
                            return name;
                          }
                          return item;
                        })
                      );
                    },
                    delete: () => {
                      setVersionIndex(versionIndex - 1);
                      setVersionName(versions[versionIndex - 1]);
                      setVersions(
                        versions.filter((item, i) => {
                          return i !== index;
                        })
                      );
                    }
                  }
                }
        }))}
        className="version"
      />

      <span className="credits">{totalCredits} Credits</span>

      {/* Include middle-aligned tabs on desktop */}
      {!mobile && (
        <div className="tabs">
          {tabs.map((tabLabel, tabIdx) => (
            <Tab
              key={tabIdx}
              active={tabIdx === currentTab}
              onClick={() => onChangeTab(tabIdx)}
              label={tabLabel}
            />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="menu">
        <Button onClick={handleDownload} disabled={pinnedCrns.length === 0}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faDownload} />
          <div className="text">Download</div>
        </Button>
        <Button onClick={handleExport} disabled={pinnedCrns.length === 0}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faCalendarAlt} />
          <div className="text">Export</div>
        </Button>

        {/* Include separate button and tooltip component
            with manually controlled closing logic */}
        <div
          className="menu"
          data-tip
          data-for="copy-crn"
          delay-hide="1000"
          ref={crnButton}
        >
          <Button disabled={pinnedCrns.length === 0}>
            <FontAwesomeIcon className="icon" fixedWidth icon={faPaste} />
            <div className="text">CRNs</div>
          </Button>
        </div>
        {/* Only enable the tooltip logic if there are CRNS to copy */}
        {pinnedCrns.length > 0 && (
          <ReactTooltip
            id="copy-crn"
            type="dark"
            place="bottom"
            effect="solid"
            event="click"
            delayHide={1000}
            afterShow={() => {
              copy(pinnedCrns.join(', '));
              setTimeout(
                () => ReactTooltip.hide(crnButton.current ?? undefined),
                1000
              );
            }}
          >
            Copied to clipboard!
          </ReactTooltip>
        )}

        <Button onClick={handleThemeChange}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faAdjust} />
          <div className="text">Theme</div>
        </Button>
        <Button href="https://github.com/gt-scheduler/website">
          <FontAwesomeIcon className="icon" fixedWidth icon={faGithub} />
          <div className="text">GitHub</div>
        </Button>
      </div>

      {/* Fake calendar used to capture screenshots */}
      <div className="capture-container" ref={captureRef}>
        {/* TODO remove once Calendar gets typing */}
        {/*
          // @ts-ignore */}
        <Calendar className="fake-calendar" capture />
      </div>
    </div>
  );
};

export default Header;
