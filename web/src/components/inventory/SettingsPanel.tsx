import React from 'react';
import {
  ACCENT_PRESETS,
  NEUTRAL_PRESETS,
  resetSettings,
  setSettings,
  useSettings,
} from '../../store/settings';
import Fade from '../utils/transitions/Fade';
import { Locale } from '../../store/locale';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const RowIcon = {
  scale: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <rect {...stroke} x="2" y="3" width="14" height="10" rx="1.5" />
      <path {...stroke} d="M6.5 16h5M9 13.5V16" />
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <path {...stroke} d="M3 7v4h3l4 3.5v-11L6 7zM12.5 6.5a4 4 0 0 1 0 5M14.5 4.5a7 7 0 0 1 0 9" />
    </svg>
  ),
  background: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <path {...stroke} d="m9 2 7 4-7 4-7-4zM2 10l7 4 7-4M2 13l7 4 7-4" />
    </svg>
  ),
  theme: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <path {...stroke} d="M9 2a7 7 0 1 0 0 14c1.2 0 1.8-.8 1.5-1.7-.4-1.1.3-2.3 1.6-2.3H14a3 3 0 0 0 3-3c0-4-3.6-7-8-7z" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <circle cx="10" cy="5.5" r="1" fill="currentColor" />
    </svg>
  ),
  neutral: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <path {...stroke} d="M15 11.5A6.5 6.5 0 0 1 6.5 3 6.5 6.5 0 1 0 15 11.5z" />
    </svg>
  ),
  contrast: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <circle {...stroke} cx="9" cy="9" r="7" />
      <path {...stroke} d="M9 2v14" />
      <path d="M9 2a7 7 0 0 1 0 14z" fill="currentColor" stroke="none" />
    </svg>
  ),
  layout: (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <rect {...stroke} x="2" y="3" width="6" height="12" rx="1" />
      <rect {...stroke} x="10" y="3" width="6" height="5.5" rx="1" />
      <rect {...stroke} x="10" y="10.5" width="6" height="4.5" rx="1" />
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 18 18" width="13" height="13">
      <path {...stroke} d="M3.5 7.5a6 6 0 1 1-.5 4M3.5 7.5V3.5m0 4h4" />
    </svg>
  ),
};

const SCALE_PRESETS: Array<{ label: string; value: number }> = [
  { label: 'Small', value: 90 },
  { label: 'Medium', value: 100 },
  { label: 'Large', value: 112 },
];

const nearestScale = (scale: number) =>
  SCALE_PRESETS.reduce((best, preset) =>
    Math.abs(preset.value - scale) < Math.abs(best.value - scale) ? preset : best
  ).value;

interface RowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  stacked?: boolean;
}

// One settings entry: icon tile + title/subtitle on the left, control on the
// right (or below when stacked).
const SettingsRow: React.FC<RowProps> = ({ icon, title, subtitle, children, stacked }) => (
  <div className={`settings-row ${stacked ? 'stacked' : ''}`}>
    <div className="row-head">
      <span className="row-icon">{icon}</span>
      <span className="row-text">
        <span className="row-title">{title}</span>
        <span className="row-sub">{subtitle}</span>
      </span>
    </div>
    <div className="row-control">{children}</div>
  </div>
);

const SettingsPanel: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const settings = useSettings();
  const activeScale = nearestScale(settings.scale);

  return (
    <Fade in={visible}>
      <div className="settings-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <div className="settings-panel">
          <div className="settings-title">
            <span className="title-icon">
              <svg viewBox="0 0 18 18" width="16" height="16">
                <path
                  {...stroke}
                  d="M9 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM14.6 11a1.1 1.1 0 0 0 .2 1.2l.1.1a1.4 1.4 0 1 1-2 2l-.1-.1a1.1 1.1 0 0 0-1.2-.2 1.1 1.1 0 0 0-.7 1v.2a1.4 1.4 0 1 1-2.8 0V15a1.1 1.1 0 0 0-.7-1 1.1 1.1 0 0 0-1.2.2l-.1.1a1.4 1.4 0 1 1-2-2l.1-.1a1.1 1.1 0 0 0 .2-1.2 1.1 1.1 0 0 0-1-.7h-.2a1.4 1.4 0 1 1 0-2.8H3a1.1 1.1 0 0 0 1-.7 1.1 1.1 0 0 0-.2-1.2l-.1-.1a1.4 1.4 0 1 1 2-2l.1.1a1.1 1.1 0 0 0 1.2.2h.1a1.1 1.1 0 0 0 .6-1v-.2a1.4 1.4 0 1 1 2.8 0V3a1.1 1.1 0 0 0 .7 1 1.1 1.1 0 0 0 1.2-.2l.1-.1a1.4 1.4 0 1 1 2 2l-.1.1a1.1 1.1 0 0 0-.2 1.2v.1a1.1 1.1 0 0 0 1 .6h.2a1.4 1.4 0 1 1 0 2.8H15a1.1 1.1 0 0 0-1 .7z"
                />
              </svg>
            </span>
            <span>{Locale.ui_settings || 'Settings'}</span>
            <button className="control-close" type="button" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="settings-body">
            <SettingsRow
              icon={RowIcon.scale}
              title={Locale.ui_scale || 'UI Scale'}
              subtitle={Locale.ui_scale_sub || 'Adjust interface size'}
            >
              <div className="segmented">
                {SCALE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={activeScale === preset.value ? 'active' : ''}
                    onClick={() => setSettings({ scale: preset.value })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </SettingsRow>

            <SettingsRow
              icon={RowIcon.volume}
              title={Locale.ui_volume || 'Volume'}
              subtitle={Locale.ui_volume_sub || 'Sound effects volume'}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={settings.volume}
                onChange={(event) => setSettings({ volume: Number(event.target.value) })}
              />
              <span className="settings-value">{settings.volume}%</span>
            </SettingsRow>

            <SettingsRow
              icon={RowIcon.background}
              title={Locale.ui_transparency || 'Background'}
              subtitle={Locale.ui_transparency_sub || 'Game visibility behind inventory'}
            >
              <input
                type="range"
                min={0}
                max={90}
                value={settings.transparency}
                onChange={(event) => setSettings({ transparency: Number(event.target.value) })}
              />
              <span className="settings-value">{settings.transparency}%</span>
            </SettingsRow>

            <SettingsRow
              icon={RowIcon.theme}
              title={Locale.ui_theme_color || 'Theme Color'}
              subtitle={Locale.ui_theme_color_sub || 'Customize accent color'}
            >
              <div className="swatch-row">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch ${settings.accent === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSettings({ accent: color })}
                  />
                ))}
              </div>
              <button
                className="row-reset"
                type="button"
                title="Reset"
                onClick={() => setSettings({ accent: ACCENT_PRESETS[0] })}
              >
                {RowIcon.reset}
              </button>
            </SettingsRow>

            <SettingsRow
              icon={RowIcon.neutral}
              title={Locale.ui_neutral_color || 'Background Color'}
              subtitle={Locale.ui_neutral_color_sub || 'Customize background tint'}
            >
              <div className="swatch-row">
                {NEUTRAL_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch ${settings.neutral === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSettings({ neutral: color })}
                  />
                ))}
              </div>
              <button
                className="row-reset"
                type="button"
                title="Reset"
                onClick={() => setSettings({ neutral: NEUTRAL_PRESETS[0] })}
              >
                {RowIcon.reset}
              </button>
            </SettingsRow>

            <SettingsRow
              icon={RowIcon.contrast}
              title={Locale.ui_high_contrast || 'High Contrast Popups'}
              subtitle={Locale.ui_high_contrast_sub || 'Light tooltips and menus'}
            >
              <button
                type="button"
                className={`toggle ${settings.highContrast ? 'on' : ''}`}
                onClick={() => setSettings({ highContrast: !settings.highContrast })}
                aria-pressed={settings.highContrast}
              >
                <i />
              </button>
            </SettingsRow>

            <SettingsRow
              icon={RowIcon.layout}
              title={Locale.ui_layout || 'Layout'}
              subtitle={Locale.ui_layout_sub || 'Rearrange inventory panels'}
            >
              <div className="segmented">
                {(['default', 'mirrored'] as const).map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    className={settings.layout === layout ? 'active' : ''}
                    onClick={() => setSettings({ layout })}
                  >
                    {layout === 'default' ? 'Default' : 'Mirrored'}
                  </button>
                ))}
              </div>
            </SettingsRow>
          </div>

          <div className="settings-footer">
            <button className="settings-reset-all" type="button" onClick={resetSettings}>
              {RowIcon.reset}
              {Locale.ui_reset || 'Reset all'}
            </button>
            <span>{Locale.ui_autosave || 'Settings are saved automatically'}</span>
          </div>
        </div>
      </div>
    </Fade>
  );
};

export default SettingsPanel;
