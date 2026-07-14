export default function Checkbox({ label, on, onToggle, children }) {
  return (
    <label
      className="ml-check"
      role="checkbox"
      aria-checked={on}
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
    >
      <span className={"ml-box ml-box--hand" + (on ? " ml-box--on" : "")}>
        {on && (
          <svg
            width={10}
            height={10}
            viewBox="0 0 16 14"
            aria-hidden="true"
          >
            <path
              d="M3 7.5 L6 11 L13 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="ml-label" style={{ fontSize: 9 }}>
        {label}
      </span>
      {children}
    </label>
  );
}
