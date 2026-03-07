export default function Cell({ value, isVanishing, isOpponentVanishing, isWinning, isHinted, onClick, disabled }) {
  const isEmpty = !value;

  let cellStyle = {
    backgroundColor: 'var(--color-cell)',
    borderColor: 'var(--color-border)',
    cursor: disabled || !isEmpty ? 'default' : 'pointer',
  };

  let textStyle = {};

  if (isWinning) {
    cellStyle.backgroundColor = 'var(--color-win-bg)';
    cellStyle.borderColor = 'var(--color-win-border)';
    textStyle.color = 'var(--color-win-text)';
  } else if (isVanishing) {
    cellStyle.backgroundColor = 'var(--color-warn-bg)';
    cellStyle.borderColor = 'var(--color-warn-border)';
    textStyle.color = value === 'X' ? 'var(--color-x)' : 'var(--color-o)';
    textStyle.opacity = 0.45;
  } else if (isOpponentVanishing) {
    cellStyle.borderColor = 'var(--color-border-strong)';
    cellStyle.borderStyle = 'dashed';
    textStyle.color = value === 'X' ? 'var(--color-x)' : 'var(--color-o)';
    textStyle.opacity = 0.55;
  } else if (isHinted && isEmpty) {
    cellStyle.backgroundColor = 'var(--color-hint-bg)';
    cellStyle.borderColor = 'var(--color-hint-border)';
    cellStyle.animation = 'hint-pulse 1.5s ease-in-out infinite';
  } else if (value === 'X') {
    cellStyle.borderColor = 'var(--color-border-strong)';
    textStyle.color = 'var(--color-x)';
    textStyle.animation = 'mark-pop 0.2s ease-out forwards';
  } else if (value === 'O') {
    cellStyle.borderColor = 'var(--color-border-strong)';
    textStyle.color = 'var(--color-o)';
    textStyle.animation = 'mark-pop 0.2s ease-out forwards';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isEmpty}
      aria-label={value ? `Cell occupied by ${value}` : 'Empty cell'}
      className="relative aspect-square flex items-center justify-center border rounded-lg transition-colors duration-100 focus:outline-none"
      style={cellStyle}
      onMouseEnter={e => {
        if (isEmpty && !disabled) e.currentTarget.style.backgroundColor = 'var(--color-cell-hover)';
      }}
      onMouseLeave={e => {
        if (isEmpty && !disabled) e.currentTarget.style.backgroundColor = 'var(--color-cell)';
      }}
    >
      {value && (
        <span
          className="font-extrabold select-none leading-none"
          style={{
            fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
            fontFamily: 'var(--font-sans)',
            ...textStyle,
          }}
        >
          {value}
        </span>
      )}

      {isVanishing && (
        <span
          className="absolute bottom-1 right-1.5 text-[8px] font-semibold tracking-wide uppercase"
          style={{ color: 'var(--color-warn)', fontFamily: 'var(--font-sans)' }}
        >
          next
        </span>
      )}

      {isOpponentVanishing && !isVanishing && (
        <span
          className="absolute bottom-1 right-1.5 text-[7px] font-medium tracking-wide uppercase"
          style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-sans)' }}
        >
          soon
        </span>
      )}

      {isHinted && isEmpty && (
        <span
          className="absolute text-[7px] font-bold tracking-wider uppercase"
          style={{
            color: 'var(--color-hint-text)',
            fontFamily: 'var(--font-sans)',
            bottom: 3,
            right: 5,
            animation: 'fade-in 0.3s ease-out',
          }}
        >
          hint
        </span>
      )}
    </button>
  );
}
