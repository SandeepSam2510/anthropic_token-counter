/**
 * One text sample with its token-count result.
 * result: { status: 'idle' | 'loading' | 'success' | 'error', tokens?, error? }
 */
export default function SampleCard({ sample, result, onRemove }) {
  const { status = 'idle', tokens, error } = result || {};
  const chars = sample.text.length;
  const words = sample.text.trim() ? sample.text.trim().split(/\s+/).length : 0;

  return (
    <li className={`card card-${status}`}>
      <div className="card-head">
        <span className="card-label">{sample.label}</span>
        {onRemove && (
          <button type="button" className="link-btn" onClick={onRemove} aria-label={`Remove ${sample.label}`}>
            Remove
          </button>
        )}
      </div>

      <p className="card-text">{sample.text}</p>

      <div className="card-foot">
        <span className="meta">
          {words} {words === 1 ? 'word' : 'words'} · {chars} chars
        </span>

        <div className="result" aria-live="polite">
          {status === 'idle' && <span className="badge badge-idle">— tokens</span>}
          {status === 'loading' && (
            <span className="badge badge-loading">
              <span className="spinner" aria-hidden="true" /> Counting…
            </span>
          )}
          {status === 'success' && (
            <span className="badge badge-success">
              <strong>{tokens}</strong> {tokens === 1 ? 'token' : 'tokens'}
            </span>
          )}
          {status === 'error' && <span className="badge badge-error">Failed</span>}
        </div>
      </div>

      {status === 'error' && error && <p className="card-error">{error}</p>}
    </li>
  );
}
