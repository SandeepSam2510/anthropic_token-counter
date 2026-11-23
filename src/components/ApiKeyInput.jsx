import { useId, useState } from 'react';

/**
 * Password-style input for the user's Anthropic API key.
 * The key lives only in React state (memory) – it is never written to
 * localStorage, sessionStorage, cookies, the URL or the console.
 */
export default function ApiKeyInput({ value, onChange, error, disabled }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        Anthropic API key
      </label>
      <div className="key-row">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`input ${error ? 'input-error' : ''}`}
          placeholder="sk-ant-..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          aria-invalid={Boolean(error)}
          aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            onChange('');
            setVisible(false);
          }}
          disabled={disabled || !value}
        >
          Clear
        </button>
      </div>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
      <p id={hintId} className="field-hint">
        🔒 Your key stays in this browser tab's memory only. It is sent directly to
        api.anthropic.com over HTTPS and is never saved, logged or sent anywhere else.
        Refreshing the page clears it. Get a key at{' '}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer noopener">
          console.anthropic.com
        </a>
        .
      </p>
    </div>
  );
}
