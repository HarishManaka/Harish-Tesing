// Helper function to create time unit elements
function createTimeUnit(value, label) {
  const unit = document.createElement('div');
  unit.className = 'time-unit';

  const valueEl = document.createElement('span');
  valueEl.className = 'time-value';
  valueEl.textContent = value;

  const labelEl = document.createElement('span');
  labelEl.className = 'time-label';
  labelEl.textContent = label;

  unit.appendChild(valueEl);
  unit.appendChild(labelEl);

  return unit;
}

// Helper function to start and manage countdown
function startCountdown(endDate, daysEl, hoursEl, minutesEl, secondsEl) {
  const targetDate = new Date(endDate).getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      // Countdown finished
      daysEl.querySelector('.time-value').textContent = '00';
      hoursEl.querySelector('.time-value').textContent = '00';
      minutesEl.querySelector('.time-value').textContent = '00';
      secondsEl.querySelector('.time-value').textContent = '00';
      return;
    }

    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update display with leading zeros
    daysEl.querySelector('.time-value').textContent = String(days).padStart(2, '0');
    hoursEl.querySelector('.time-value').textContent = String(hours).padStart(2, '0');
    minutesEl.querySelector('.time-value').textContent = String(minutes).padStart(2, '0');
    secondsEl.querySelector('.time-value').textContent = String(seconds).padStart(2, '0');
  }

  // Update immediately and then every second
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

export default function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Extract the content
  const promoLabel = data.find((row) => row[0] === 'promoLabel')?.[1] || '';
  const textColor = data.find((row) => row[0] === 'textColor')?.[1] || 'dark-blue';
  const backgroundColor = data.find((row) => row[0] === 'backgroundColor')?.[1] || 'teal';
  const countdownEndDate = data.find((row) => row[0] === 'countdownEndDate')?.[1] || '';
  const showCountdown = data.find((row) => row[0] === 'showCountdown')?.[1] !== 'false';

  // Create the countdown banner structure
  const banner = document.createElement('div');
  let bannerClasses = 'countdown-promo-container';
  if (backgroundColor && backgroundColor !== 'white') {
    bannerClasses += ` bg-${backgroundColor}`;
  }
  banner.className = bannerClasses;

  const content = document.createElement('div');
  content.className = 'countdown-promo-content';

  // Create left section with text content
  const textSection = document.createElement('div');
  textSection.className = 'countdown-promo-text';

  if (promoLabel) {
    const textElement = document.createElement('p');
    textElement.className = `countdown-promo-title text-${textColor}`;
    textElement.textContent = promoLabel;
    textSection.appendChild(textElement);
  }

  content.appendChild(textSection);

  // Create right section with countdown timer
  if (showCountdown && countdownEndDate) {
    const countdownSection = document.createElement('div');
    countdownSection.className = 'countdown-timer';

    // Create countdown elements
    const daysEl = createTimeUnit('00', 'Days');
    const hoursEl = createTimeUnit('00', 'Hours');
    const minutesEl = createTimeUnit('00', 'Min');
    const secondsEl = createTimeUnit('00', 'Sec');

    countdownSection.appendChild(daysEl);
    countdownSection.appendChild(hoursEl);
    countdownSection.appendChild(minutesEl);
    countdownSection.appendChild(secondsEl);

    content.appendChild(countdownSection);

    // Start countdown
    startCountdown(countdownEndDate, daysEl, hoursEl, minutesEl, secondsEl);
  }

  banner.appendChild(content);

  // Replace block content
  block.textContent = '';
  block.appendChild(banner);
}
