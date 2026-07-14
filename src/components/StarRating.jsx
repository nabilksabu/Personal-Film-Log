import { useRef } from "react";
import { MUSTARD, MUSTARD_DEEP, INK_SOFT } from "../lib/constants.js";

const HAND_STAR_PATH =
  "M12 2.5c.4-.2.7.1.9.4l2.4 4.8 5.3.8c.4.1.5.5.3.8l-3.8 3.7.9 5.3c.1.4-.2.7-.5.8L12 16.3l-4.5 2.3c-.4.2-.7 0-.8-.3l.9-5.3L3.8 9.3c-.2-.3-.1-.7.3-.8l5.3-.8L12 2.5z";

export default function StarRating({ value = 0, onChange, size = 18, readOnly = false }) {
  return (
    <span
      className="ml-star-wrap"
      role="slider"
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuemax={5}
      aria-label={`${value} out of 5 stars`}
      title={readOnly ? `${value} / 5` : "Click to rate"}
      style={{ cursor: readOnly ? "default" : "pointer" }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <SingleStar
          key={i}
          index={i}
          value={value}
          size={size}
          readOnly={readOnly}
          onChange={onChange}
        />
      ))}
    </span>
  );
}

function SingleStar({ index, value, size, readOnly, onChange }) {
  const ref = useRef(null);
  const fill = value >= index + 1 ? "full" : value >= index + 0.5 ? "half" : "empty";

  const handleClick = (e) => {
    if (readOnly || !onChange) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    onChange(isLeftHalf ? index + 0.5 : index + 1);
  };

  const gradientId = `half-${index}`;

  return (
    <span
      ref={ref}
      className="ml-star"
      onClick={handleClick}
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-flex",
        width: size + 2,
        height: size,
        marginRight: 1,
        cursor: readOnly ? "default" : "pointer",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 20"
        style={{ overflow: "visible" }}
      >
        {fill === "half" && (
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="42%" stopColor={MUSTARD} />
              <stop offset="58%" stopColor="transparent" />
            </linearGradient>
          </defs>
        )}
        <path
          d={HAND_STAR_PATH}
          fill={
            fill === "full"
              ? MUSTARD
              : fill === "half"
                ? `url(#${gradientId})`
                : "none"
          }
          stroke={fill === "empty" ? INK_SOFT : MUSTARD_DEEP}
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
