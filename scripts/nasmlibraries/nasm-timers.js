let timerDataForRerun;
const timerIntervals = {}; // Object to store interval IDs

// Constants for time calculations
const timersecond = 1000;
const timerminute = timersecond * 60;
const timerhour = timerminute * 60;
const timerday = timerhour * 24;

function getTimerData(url) {
  return new Promise((resolve, reject) => {
    $.getJSON(url, (data) => {
      resolve(data);
    }).fail((jqXHR, textStatus, errorThrown) => {
      reject(new Error(`Failed to load JSON data: ${textStatus}`));
    });
  });
}

function showNasmTimers(key, timerContent, data) {
  if (timerIntervals[key]) {
    clearInterval(timerIntervals[key]);
  }

  const calloutText = `${data.timers[key].callout}`;
  const timerOrientation = `nasm-timer-${data.timers[key].orientation}`;

  const start = new Date(`${data.timers[key]['start-date']} 12:00 AM`);
  const end = new Date(`${data.timers[key]['end-date']} 12:00 AM`);
  const now = new Date();

  let timerState;
  const timerStyle = `${data.timers[key]['background-color']}`;

  // Determine the timer state based on the current date
  if (now < start) {
    timerState = 'comingSoon';
  } else if (now >= start && now <= end) {
    timerState = 'active';
  } else if (now > end) {
    timerState = 'expired';
  }

  let styleClass;
  switch (timerStyle) {
    case 'black':
      styleClass = 'setBlack';
      break;
    case 'dark blue':
      styleClass = 'setDarkBlue';
      break;
    case 'medium blue':
      styleClass = 'setMediumBlue';
      break;
    case 'light blue':
      styleClass = 'setLightBlue';
      break;
    case 'yellow':
      styleClass = 'setYellow';
      break;
    case 'white':
      styleClass = 'setWhite';
      break;
    case 'light aqua':
      styleClass = 'setLightAqua';
      break;
    case 'medium aqua':
      styleClass = 'setMediumAqua';
      break;
    case 'medium gray':
      styleClass = 'setMediumGray';
      break;
    default:
      styleClass = `${key}-timer`;
  }

  const distance = end - now;

  if ($(`[data-calendar="${key}"]`).length > 0) {
    if ($(`.nasm-special-calendar-content .${key}`).length == 0) {
      const calendarContents = $(`[data-calendar="${key}"]`);
      console.log('start? ', start, ' key? ', key);
      const calendarGoLiveDate = formatDate(data.timers[key]['start-date']);

      const calendarCallout = data.timers[key]['calendar-callout'] ?? '';
      const calendarPercentOff = data.timers[key]['calendar-percent-off'] ?? '';

      calendarContents.html(`
                <div class="nasm-special-calendar-content nasm-calendar-block ${key} ${timerState}">
                    <div class="nasm-calendar-header">
                        <p>${calendarGoLiveDate}</p>
                        <img src="/images/nasmlibraries/pages/12-days-of-fitness/long-arrow-right.png?sfvrsn=20b6eb19_2" alt="long-arrow-right" />
                    </div>
                    <div class="nasm-calendar-deal-container">
                        <p class="nasm-deal-yellowbanner">
                            <span>${calendarPercentOff}</span> off
                        </p>
                        <p class="deal-title">
                            ${calendarCallout}
                        </p>
                    </div>
                </div>
            `);
    }
  }

  if (distance < 0) {
    if (data.timers[key]['hide-when-expired'] == false) {
      timerContent.html(`<div class="timer-content ${key} ${styleClass} ${timerState} ${timerOrientation}"><p class="callout-text">${data.timers[key].expired}</p>
                <div class="timer-numbers">
                <span class="timer-countdown-numbers"><span>00</span><span>hrs</span></span>
                <span class="timer-colon">:</span>
                <span class="timer-countdown-numbers"><span>00</span><span>min</span></span> 
                <span class="timer-colon">:</span>
                <span class="timer-countdown-numbers"><span>00</span><span>sec</span></span></div><div>`);
    } else {
      timerContent.html('');
    }
    return;
  }

  const days = Math.floor(distance / timerday);
  const hours = Math.floor((distance % timerday) / timerhour);
  const totalhours = days > 0 ? Math.floor(days * 24 + hours) : hours;
  const minutes = Math.floor((distance % timerhour) / timerminute);
  const seconds = Math.floor((distance % timerminute) / timersecond);

  if (timerState == 'comingSoon') {
    timerContent.html(`<div class="timer-content ${key} ${styleClass} ${timerState} ${timerOrientation}"><p class="callout-text">${data.timers[key].comingSoon}  </p>
            <div class="timer-numbers">
                <span class="timer-countdown-numbers"><span>24</span><span>hrs</span></span>
                <span class="timer-colon">:</span>
                <span class="timer-countdown-numbers"><span>00</span><span>min</span></span> 
                <span class="timer-colon">:</span>
                <span class="timer-countdown-numbers"><span>00</span><span>sec</span></span></div>`);
  } else if (timerState == 'active') {
    timerContent.html(`<div class="timer-content ${key} ${styleClass} ${timerState} ${timerOrientation}"><p class="callout-text">${calloutText}</p>
            <div class="timer-numbers">
            <span class="timer-countdown-numbers"><span>${totalhours}</span><span>hrs</span></span>
            <span class="timer-colon">:</span>
            <span class="timer-countdown-numbers"><span>${minutes}</span><span>min</span></span> 
            <span class="timer-colon">:</span>
            <span class="timer-countdown-numbers"><span>${seconds}</span><span>sec</span></span></div>`);
  }

  const timerData = data;
  console.log('key before setTimeout', key);

  timerIntervals[key] = setInterval(() => {
    showNasmTimers(key, timerContent, timerData);
  }, 1000);
}

function formatDate(dateString) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const suffixes = ['th', 'st', 'nd', 'rd'];

  const parts = dateString.split('/');
  const date = new Date(parts[2], parts[0] - 1, parts[1]);

  const month = months[date.getMonth()];
  const day = date.getDate();

  let suffix = suffixes[(day % 10) - 1];
  if (!suffix || day % 100 >= 11 && day % 100 <= 13) {
    suffix = suffixes[0];
  }

  return `${month} ${day}${suffix}`;
}

function rerunTimers(key) {
  console.log('logging... ', showNasmTimers);
  console.log('key ', key);

  const newtimerContent = $(`[data-timer='${key}']`);
  const jsonUrl = 'https://www.nasm.org/docs/nasmlibraries/json/nasm-continuity-bar.json';

  getTimerData(jsonUrl).then((timerData) => {
    console.log('ran getTimer 1');
    console.log('timer data:', timerData);
    timerDataForRerun = timerData;
    showNasmTimers(key, newtimerContent, timerDataForRerun);
  });
}

function clearTimerIntervals() {
  for (const key in timerIntervals) {
    clearInterval(timerIntervals[key]);
  }
}

function clearSingleTimerInterval(key) {
  if (timerIntervals[key]) {
    clearInterval(timerIntervals[key]);
    delete timerIntervals[key];
  }
}

$(document).ready(() => {
  console.log('initial run of timer script');

  if ($('[data-timer]').length > 0) {
    console.log('making JSON call for timers');
    const jsonUrl = 'https://www.nasm.org/docs/nasmlibraries/json/nasm-continuity-bar.json';

    getTimerData(jsonUrl).then((timerData) => {
      console.log('timer data:', timerData);
      console.log('ran getTimer 2');
      timerDataForRerun = timerData;

      const timerContents = $('[data-timer]');

      timerContents.each(function () {
        const timerKey = $(this).attr('data-timer');
        const timerContent = $(this);

        console.log('timerKey: ', timerKey);
        console.log('timerContent: ', $(this));
        console.log('timerData: ', timerData);

        showNasmTimers(timerKey, timerContent, timerData);
      });
    }).catch((error) => {
      console.error(error.message);
    });
  } else {

  }
});
