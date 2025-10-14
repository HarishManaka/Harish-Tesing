class NavSupportFooter extends HTMLElement {
  constructor() {
    super();
    this.handleSupportClick = this.handleSupportClick.bind(this);
  }

  connectedCallback() {
    this.render();
  }

  handleSupportClick(type, url) {
    // Dispatch support click event
    this.dispatchEvent(
      new CustomEvent('nav-support-click', {
        bubbles: true,
        detail: { type, url },
      }),
    );
  }

  render() {
    this.innerHTML = `
      <div class="nav-support-footer">
        <div class="nav-support-footer__container">
          <h3 class="nav-support-footer__title">HAVE QUESTIONS?</h3>
          <div class="nav-support-footer__options">
            <button class="nav-support-footer__option" data-type="help-center" data-url="/help">
              <svg class="nav-support-footer__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span class="nav-support-footer__text">Help Center</span>
            </button>
            
            <button class="nav-support-footer__option" data-type="call-us" data-url="tel:1-800-656-2739">
              <svg class="nav-support-footer__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span class="nav-support-footer__text">Call Us</span>
            </button>
            
            <button class="nav-support-footer__option" data-type="talk-to-expert" data-url="/contact/expert">
              <svg class="nav-support-footer__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span class="nav-support-footer__text">Talk to a program expert</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add event listeners to support options
    this.querySelectorAll('.nav-support-footer__option').forEach((option) => {
      option.addEventListener('click', () => {
        const type = option.getAttribute('data-type');
        const url = option.getAttribute('data-url');
        this.handleSupportClick(type, url);

        // Navigate to URL for actual functionality
        if (url.startsWith('tel:')) {
          window.location.href = url;
        }
      });
    });
  }
}

customElements.define('nav-support-footer', NavSupportFooter);
