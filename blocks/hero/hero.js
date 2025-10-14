export default async function decorate(block) {
  const [img, heroContent] = block.children;

  img.className = 'hero-image';
  heroContent.className = 'hero-content';

  // ✅ Add overlay div dynamically
  const overlay = document.createElement('div');
  overlay.className = 'hero-overlay-div';
  block.prepend(overlay);

  // Get all content elements
  const contentElements = Array.from(heroContent.children[0].children);
  if (contentElements.length === 4) {
    const [supHeading, mainHeading, subHeading, cta] = heroContent.children[0].children;
    supHeading.className = 'hero-sup-heading';
    mainHeading.className = 'hero-main-heading';
    subHeading.className = 'hero-sub-heading';
    cta.className = 'hero-cta';
  } else {
    // Flexible class assignment based on content analysis
    contentElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const isHeading = /^h[1-6]$/.test(tagName);

      const hasLink = element.tagName.toLowerCase() === 'a' || element.querySelector('a') !== null;
      if (isHeading) {
        element.className = 'hero-main-heading';
      } else if (index === 0) {
        // First element that's not a heading is likely a sup-heading
        element.className = 'hero-sup-heading';
      } else {
        element.className = hasLink ? 'hero-cta' : 'hero-sub-heading';
      }
    });
  }
}
