import { h } from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';

const html = htm.bind(h);

/**
 * ProgressBar component using SVG
 * @param {Object} props
 * @param {number} props.current - Current step (1-based)
 * @param {number} props.total - Total steps
 * @param {number} [props.size=48] - Diameter of the progress circle in px
 * @param {string} [props.color='#14395A'] - Progress arc color
 * @param {string} [props.bgColor='#F5F5F0'] - Background circle color
 */
export default function ProgressBar({
  current,
  total,
  size = 44,
  color = '#14395A',
  bgColor = '#F5F5F0',
}) {
  const strokeWidth = 4; // Thinner stroke width
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (current / total) * circumference;

  // Container style for centering content
  const containerStyle = {
    display: 'inline-block',
    position: 'relative',
    width: size,
    height: size,
  };

  // Style for the centered text
  const textStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: 14, // Larger text
    color: '#5B5B54',
    fontWeight: 500,
    userSelect: 'none',
    fontFamily: 'peridot-pe-variable, sans-serif',
  };

  const ariaValue = Math.round((current / total) * 100);

  return html`
    <div
      style=${containerStyle}
      aria-label="Step ${current} of ${total}"
      role="progressbar"
      aria-valuenow=${ariaValue}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <svg 
        width=${size} 
        height=${size}
        viewBox="0 0 ${size} ${size}"
        style="transform: rotate(-90deg)"
      >
        <!-- Background circle -->
        <circle
          cx=${size / 2}
          cy=${size / 2}
          r=${radius}
          stroke=${bgColor}
          stroke-width=${strokeWidth}
          fill="none"
        />
        
        <!-- Progress circle -->
        ${current > 0 && html`
          <circle
            cx=${size / 2}
            cy=${size / 2}
            r=${radius}
            stroke=${color}
            stroke-width=${strokeWidth}
            fill="none"
            stroke-dasharray=${circumference}
            stroke-dashoffset=${offset}
            style="transition: stroke-dashoffset 0.3s ease"
          />
        `}
      </svg>
      <div style=${textStyle}>${current}/${total}</div>
    </div>
  `;
}
