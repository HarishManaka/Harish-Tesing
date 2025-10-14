// Deployment trigger comment
export default function decorate(block) {
  const [logoDiv, socialDiv, addressDiv] = [...block.children];

  // Process social links
  const socialList = socialDiv.querySelector('ul');
  if (socialList) {
    socialList.classList.add('footer-social-links');

    const socialLinks = socialList.querySelectorAll('a');
    socialLinks.forEach((link) => {
      const { href } = link;
      let platform = '';
      let iconUrl = '';

      // Determine platform and icon
      if (href.includes('instagram.com')) {
        platform = 'Instagram';
        iconUrl = '/icons/instagram.svg';
      } else if (href.includes('youtube.com')) {
        platform = 'YouTube';
        iconUrl = '/icons/youtube.svg';
      } else if (href.includes('facebook.com')) {
        platform = 'Facebook';
        iconUrl = '/icons/facebook.svg';
      } else if (href.includes('twitter.com') || href.includes('x.com')) {
        platform = 'X';
        iconUrl = '/icons/x.svg';
      } else if (href.includes('tiktok.com')) {
        platform = 'TikTok';
        iconUrl = '/icons/tiktok.svg';
      } else if (href.includes('linkedin.com')) {
        platform = 'LinkedIn';
        iconUrl = '/icons/linkedin.svg';
      }

      // Replace text with icon
      if (iconUrl) {
        link.innerHTML = `<img src="${iconUrl}" alt="${platform}" width="24" height="24" />`;
        link.setAttribute('aria-label', platform);
        link.classList.add('social-icon-link');
      }
    });
  }

  logoDiv.classList.add('footer-logo');
  socialDiv.classList.add('footer-social-container');
  addressDiv.classList.add('footer-address');
}
