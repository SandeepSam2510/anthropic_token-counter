import { useMemo, useRef, useState } from 'react';
import ApiKeyInput from './components/ApiKeyInput.jsx';
import SampleCard from './components/SampleCard.jsx';
import { countTokens, validateApiKeyFormat, TokenCountError } from './api/anthropic.js';
import { SAMPLES, MODELS } from './data/samples.js';

const CONCURRENCY = 3; // a few requests at a time to stay friendly with rate limits
const MAX_CUSTOM_LENGTH = 5000;

export default function App() {
  const [apiKey, setApiKey] = useState(''); // memory only – never persisted
  const [keyError, setKeyError] = useState('');
  const [model, setModel] = useState(MODELS[0].id);
  const [samples, setSamples] = useState(SAMPLES);
  const [results, setResults] = useState({}); // { [sampleId]: {status, tokens, error} }
  const [isCounting, setIsCounting] = useState(false);
  const [banner, setBanner] = useState(null); // { kind: 'error' | 'success' | 'info', text }
  const [customText, setCustomText] = useState('');
  const abortRef = useRef(null);

  const total = useMemo(
    () =>
      samples.reduce(
        (sum, s) => (results[s.id]?.status === 'success' ? sum + results[s.id].tokens : sum),
        0,
      ),
    [samples, results],
  );
  const countedCount = samples.filter((s) => results[s.id]?.status === 'success').length;

  const setResult = (id, value) => setResults((prev) => ({ ...prev, [id]: value }));

  function handleKeyChange(value) {
    setApiKey(value);
    if (keyError) setKeyError('');
  }

  async function handleCount() {
    const formatError = validateApiKeyFormat(apiKey);
    if (formatError) {
      setKeyError(formatError);
      setBanner(null);
      return;
    }
    if (samples.length === 0) {
      setBanner({ kind: 'info', text: 'There are no text samples to count. Add one below.' });
      return;
    }

    setKeyError('');
    setBanner(null);
    setIsCounting(true);
    setResults(Object.fromEntries(samples.map((s) => [s.id, { status: 'loading' }])));

    const controller = new AbortController();
    abortRef.current = controller;
    let fatal = null; // stop everything on auth errors
    let failures = 0;

    const queue = [...samples];
    async function worker() {
      while (queue.length && !controller.signal.aborted) {
        const sample = queue.shift();
        try {
          const tokens = await countTokens({ apiKey, model, text: sample.text, signal: controller.signal });
          setResult(sample.id, { status: 'success', tokens });
        } catch (err) {
          const message = err instanceof TokenCountError ? err.message : 'Something went wrong.';
          failures += 1;
          setResult(sample.id, { status: 'error', error: message });
          if (err.status === 401 || err.status === 403) {
            fatal = err;
            controller.abort('auth');
          }
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, samples.length) }, worker));

    // Any sample still "loading" was skipped because we stopped early.
    setResults((prev) => {
      const next = { ...prev };
      for (const s of samples) {
        if (next[s.id]?.status === 'loading') {
          next[s.id] = { status: 'error', error: fatal ? 'Skipped because the API key was rejected.' : 'Cancelled.' };
        }
      }
      return next;
    });

    if (fatal) {
      setKeyError(fatal.message);
      setBanner({ kind: 'error', text: fatal.message });
    } else if (controller.signal.reason === 'user') {
      setBanner({ kind: 'info', text: 'Counting was cancelled.' });
    } else if (failures > 0) {
      setBanner({
        kind: 'error',
        text: `${failures} of ${samples.length} samples failed. See the message on each card.`,
      });
    } else {
      setBanner({ kind: 'success', text: `Counted tokens for all ${samples.length} samples.` });
    }

    abortRef.current = null;
    setIsCounting(false);
  }

  function handleCancel() {
    abortRef.current?.abort('user');
  }

  function handleAddCustom(e) {
    e.preventDefault();
    const text = customText.trim();
    if (!text) return;
    const id = `custom-${Date.now()}`;
    setSamples((prev) => [...prev, { id, label: 'Your text', text, custom: true }]);
    setCustomText('');
  }

  function handleRemove(id) {
    setSamples((prev) => prev.filter((s) => s.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleReset() {
    setResults({});
    setBanner(null);
  }

  return (
    <div className="page">
      <header className="header">
        <div className="logo" aria-hidden="true">
          #
        </div>
        <div>
          <h1>Anthropic Token Counter</h1>
          <p className="subtitle">
            Count tokens for text samples using Anthropic's official{' '}
            <a
              href="https://docs.anthropic.com/en/docs/build-with-claude/token-counting"
              target="_blank"
              rel="noreferrer noopener"
            >
              Token Counting API
            </a>
            .
          </p>
        </div>
      </header>

      <main className="main">
        <section className="panel" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="panel-title">
            1. Settings
          </h2>
          <ApiKeyInput value={apiKey} onChange={handleKeyChange} error={keyError} disabled={isCounting} />

          <div className="field">
            <label htmlFor="model" className="field-label">
              Model
            </label>
            <select
              id="model"
              className="input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isCounting}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.id})
                </option>
              ))}
            </select>
            <p className="field-hint">Different models can tokenize the same text differently.</p>
          </div>

          <div className="actions">
            {!isCounting ? (
              <button type="button" className="btn btn-primary" onClick={handleCount}>
                Count Tokens
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary" disabled>
                  <span className="spinner spinner-light" aria-hidden="true" /> Counting…
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            )}
            {!isCounting && Object.keys(results).length > 0 && (
              <button type="button" className="btn btn-ghost" onClick={handleReset}>
                Reset results
              </button>
            )}
          </div>

          {banner && (
            <div className={`banner banner-${banner.kind}`} role={banner.kind === 'error' ? 'alert' : 'status'}>
              {banner.text}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="samples-heading">
          <div className="samples-header">
            <h2 id="samples-heading" className="panel-title">
              2. Text samples
            </h2>
            <div className="total" aria-live="polite">
              Total: <strong>{total}</strong> tokens
              <span className="meta">
                {' '}
                ({countedCount}/{samples.length} counted)
              </span>
            </div>
          </div>

          {samples.length === 0 ? (
            <p className="empty">No samples yet. Add your own text below.</p>
          ) : (
            <ul className="grid">
              {samples.map((s) => (
                <SampleCard
                  key={s.id}
                  sample={s}
                  result={results[s.id]}
                  onRemove={!isCounting ? () => handleRemove(s.id) : undefined}
                />
              ))}
            </ul>
          )}

          <form className="custom" onSubmit={handleAddCustom}>
            <label htmlFor="custom-text" className="field-label">
              Add your own text (optional)
            </label>
            <textarea
              id="custom-text"
              className="input textarea"
              rows={3}
              maxLength={MAX_CUSTOM_LENGTH}
              placeholder="Type or paste any text…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              disabled={isCounting}
            />
            <div className="custom-foot">
              <span className="meta">
                {customText.length}/{MAX_CUSTOM_LENGTH}
              </span>
              <button type="submit" className="btn btn-ghost" disabled={isCounting || !customText.trim()}>
                Add sample
              </button>
            </div>
          </form>
        </section>
      </main>

      <footer className="footer">
        Built with React + Vite · Token counts come from <code>POST /v1/messages/count_tokens</code> and include a
        few tokens of message formatting overhead.
      </footer>
    </div>
  );
}
