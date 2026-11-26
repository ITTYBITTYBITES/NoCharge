import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { primaryNavigation } from '../siteNavigation';
import { useTheme } from '../theme/ThemeProvider';
import { useSeasonalTheme } from '../theme/SeasonalThemeProvider';
import type { SeasonalPreference } from '../theme/holidayCalendar';
import { Brand } from './Brand';
import { CloseIcon, DarkThemeIcon, LightThemeIcon, MenuIcon, SearchIcon, SystemThemeIcon } from './Icons';

const SearchDialog = lazy(() => import('./SearchDialog').then(({ SearchDialog: Dialog }) => ({ default: Dialog })));

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <>
    {primaryNavigation.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
        onClick={onNavigate}
      >
        {item.label}
      </NavLink>
    ))}
  </>;
}

function ThemeControl() {
  const { preference, setPreference } = useTheme();
  const label = preference === 'system' ? 'System' : preference === 'light' ? 'Light' : 'Dark';
  const Icon = preference === 'system' ? SystemThemeIcon : preference === 'light' ? LightThemeIcon : DarkThemeIcon;

  return (
    <div className="theme-control" title={`Color theme: ${label}`}>
      <Icon className="theme-control__icon" />
      <span className="theme-control__value" aria-hidden="true">{label}</span>
      <select
        aria-label="Color theme preference"
        aria-describedby="theme-control-help"
        value={preference}
        onChange={(event) => setPreference(event.target.value as 'system' | 'light' | 'dark')}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <span className="sr-only" id="theme-control-help">Choose the system appearance, light theme, or dark theme.</span>
    </div>
  );
}

function SeasonalControl() {
  const { preference, activeEvent, isPreview, setPreference } = useSeasonalTheme();
  const label = activeEvent?.label ?? (preference === 'auto' ? 'Auto' : 'Standard');
  const title = activeEvent
    ? `Seasonal theme: ${activeEvent.name}${isPreview ? ' (preview)' : ''}`
    : preference === 'auto' ? 'Seasonal themes: automatic' : 'Seasonal themes: standard';
  const description = activeEvent
    ? `${activeEvent.name} is active. Choose Standard to disable seasonal themes, or Seasonal Auto to resume date-based themes.`
    : preference === 'auto'
      ? 'Seasonal Auto applies a subtle theme during registered event windows. Choose Standard to turn seasonal themes off.'
      : 'Standard keeps the normal appearance. Choose Seasonal Auto to apply registered event themes by local date.';

  return (
    <div className="seasonal-control" title={title} data-active={activeEvent ? 'true' : 'false'}>
      <span className="seasonal-control__mark" aria-hidden="true" />
      <span className="seasonal-control__value" aria-hidden="true">{label}</span>
      <select
        aria-label="Seasonal theme preference"
        aria-describedby="seasonal-control-help seasonal-control-status"
        value={preference}
        onChange={(event) => setPreference(event.target.value as SeasonalPreference)}
      >
        <option value="auto">Seasonal Auto</option>
        <option value="standard">Standard</option>
      </select>
      <span className="sr-only" id="seasonal-control-help">Choose Seasonal Auto or Standard. Seasonal settings are independent of the Light and Dark color mode.</span>
      <span className="sr-only" id="seasonal-control-status" aria-live="polite">{description}</span>
    </div>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="site-header__inner">
          <Brand />
          <nav className="primary-nav" aria-label="Primary navigation">
            <NavigationLinks />
          </nav>
          <div className="site-header__actions">
            <button type="button" className="search-trigger" onClick={() => setSearchOpen(true)} aria-haspopup="dialog" aria-label="Open site search">
              <SearchIcon /> <span>Search</span>
            </button>
            <SeasonalControl />
            <ThemeControl />
            <button
              ref={menuButtonRef}
              type="button"
              className="mobile-menu-toggle"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}>
          <div className="mobile-nav__inner">
            <NavigationLinks onNavigate={closeMenu} />
            <p className="mobile-nav__note">A new home for play, useful ideas and discovery.</p>
          </div>
        </nav>
      </header>
      {searchOpen && (
        <Suspense fallback={null}>
          <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
