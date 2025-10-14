class ContinuityBar extends HTMLElement {
  constructor() {
    super();
    this.isTimer = false;
    this.cbData = null;
  }

  async connectedCallback() {
    console.log('ContinuityBar connected');
    await this.init();
  }

  async init() {
    try {
      const response = await fetch(
        'https://www.nasm.org/docs/nasmlibraries/json/nasm-continuity-bar.json',
      );
      const data = await response.json();
      this.buildContinuityBar(data, 'continuity', data.timer);
      // For continuity bar
      showNasmTimers(null, null, data.continuity, true);
    } catch (error) {
      console.error('Error fetching continuity bar data:', error);
    }
  }

  async buildContinuityBar(data, key, isTimer) {
    if (document.querySelector('.continuity-bar-wrapper')) {
      document.querySelector('.continuity-bar-wrapper').remove();
    }

    if (this.querySelector('.continuity-bar-close-button')) {
      this.querySelector('.continuity-bar-close-button').remove();
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('continuity-bar-wrapper');
    if (isTimer) {
      wrapper.classList.add('tall-wrapper');
    }
    wrapper.innerHTML = `
        <div class="continuity-bar-close-button">X</div>
        <div class="swiper-container continuity-bar-nav ${
  isTimer ? 'tall-wrapper' : ''
}">
          <div class="swiper-wrapper"></div>
        </div>
        <div class="continuity-need-help"><h2><a href="tel:+18004606276">1.800.460.6276</a></h2></div>
      `;
    this.appendChild(wrapper);

    const data2 = data[key];
    const auth = this.getCookie('XSRF-TOKEN');
    const loginPanelCheck = document.getElementById(
      'header_cta_T690FF961056_ctl00_ctl00_loginPanel',
    );
    const actuallyLoggedIn = loginPanelCheck.style.visibility;
    const now = new Date();

    Object.keys(data2).forEach((slideKey) => {
      if (slideKey === 'background-color' && data2[slideKey]) {
        const carouselWrapper = document.querySelector(
          '.continuity-bar-wrapper',
        );
        const colorClass = `set${data2[slideKey].replace(' ', '')}`;
        if (colorClass.trim()) {
          carouselWrapper.classList.add(colorClass);
        }
      } else {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide', slideKey, 'cb-carousel-slide');
        slide.id = slideKey;
        slide.onclick = () => (window.location.href = auth && actuallyLoggedIn !== 'visible' && now > 0
          ? data2[slideKey]['auth-url']
          : data2[slideKey]['unauth-url']);

        const headline = auth && actuallyLoggedIn !== 'visible' && now > 0
          ? data2[slideKey]['auth-desktop-headline']
          : data2[slideKey]['unauth-desktop-headline'];
        const subhead = auth && actuallyLoggedIn !== 'visible' && now > 0
          ? data2[slideKey]['auth-desktop-subhead']
          : data2[slideKey]['unauth-desktop-subhead'];

        slide.innerHTML = `
            <div class="cb-desktop">
              <div class="cb-block-container">
                <div class="cb-flex">
                  <h2>${headline}</h2>
                  <p>${subhead}</p>
                </div>
              </div>
              <div class="continuity-countdown-container"><div class="${slideKey} continuity-countdown"></div></div>
            </div>
          `;
        this.querySelector('.swiper-wrapper').appendChild(slide);

        // Call showNasmTimers for each slide
        showNasmTimers(slideKey, null, data2, true);
      }
    });

    this.initSwiper();
  }

  initSwiper() {
    const swiperContainer = this.querySelector('.swiper-container');
    if (
      swiperContainer
      && swiperContainer.querySelector('.swiper-wrapper').children.length > 0
    ) {
      console.log('Initializing Swiper on:', swiperContainer);
      new Swiper(swiperContainer, {
        direction: 'vertical',
        loop: true,
        autoplay: {
          delay: 6000,
          disableOnInteraction: false,
        },
        slidesPerView: 1,
        spaceBetween: 10,
      });
    } else {
      console.error('Swiper container not found or has no slides.');
    }
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
}

// Define the custom element
customElements.define('continuity-bar', ContinuityBar);

// Append the component to the DOM
document.addEventListener('DOMContentLoaded', () => {
  const continuityBarElement = document.createElement('continuity-bar');
  const cbWrapper = document.querySelector('.cb-double-wrap');
  cbWrapper.appendChild(continuityBarElement);

  // document.body.insertBefore(continuityBarElement, document.body.firstChild);
});
