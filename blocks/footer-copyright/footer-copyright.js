// Deployment trigger comment
// Deployment trigger comment
export default function decorate(block) {
  const aPolicy = block.querySelector('a[title="Your Privacy Choices"]');
  if (aPolicy) {
    aPolicy.href = '#';
    aPolicy.addEventListener('click', (e) => {
      e.preventDefault();
      console.info('click');
      try {
        window.Bootstrapper.gateway.openModal();
      } catch (error) {
        console.error('error opening modal - Bootstrapper:', error);
      }
    });
  } else {
    console.error('aPolicy: not found');
  }
}
