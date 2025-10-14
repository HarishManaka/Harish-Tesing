export default function decorate(block) {
  // Get the data from the block
  const data = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Extract the content
  const backgroundImage = block.querySelector('img');
  const title = data.find((row) => row[0] === 'title')?.[1] || '';
  const stat1Percentage = data.find((row) => row[0] === 'stat1Percentage')?.[1] || '';
  const stat1Description = data.find((row) => row[0] === 'stat1Description')?.[1] || '';
  const stat2Percentage = data.find((row) => row[0] === 'stat2Percentage')?.[1] || '';
  const stat2Description = data.find((row) => row[0] === 'stat2Description')?.[1] || '';
  const stat3Percentage = data.find((row) => row[0] === 'stat3Percentage')?.[1] || '';
  const stat3Description = data.find((row) => row[0] === 'stat3Description')?.[1] || '';

  // Create the hero structure
  const heroContainer = document.createElement('div');
  heroContainer.className = 'hero-stats-container';

  // Add background image if available
  if (backgroundImage) {
    heroContainer.style.backgroundImage = `url('${backgroundImage.src}')`;
    heroContainer.classList.add('has-background');
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'hero-stats-overlay';

  // Create content wrapper
  const content = document.createElement('div');
  content.className = 'hero-stats-content';

  // Create title
  if (title) {
    const titleElement = document.createElement('h2');
    titleElement.className = 'hero-stats-title';
    titleElement.textContent = title;
    content.appendChild(titleElement);
  }

  // Create stats container
  const statsContainer = document.createElement('div');
  statsContainer.className = 'hero-stats-list';

  // Create stat items
  const stats = [
    { percentage: stat1Percentage, description: stat1Description },
    { percentage: stat2Percentage, description: stat2Description },
    { percentage: stat3Percentage, description: stat3Description },
  ];

  stats.forEach((stat) => {
    if (stat.percentage && stat.description) {
      const statItem = document.createElement('div');
      statItem.className = 'hero-stat-item';

      const percentageElement = document.createElement('div');
      percentageElement.className = 'hero-stat-percentage';
      percentageElement.textContent = stat.percentage;

      const descriptionElement = document.createElement('div');
      descriptionElement.className = 'hero-stat-description';
      descriptionElement.textContent = stat.description;

      statItem.appendChild(percentageElement);
      statItem.appendChild(descriptionElement);
      statsContainer.appendChild(statItem);
    }
  });

  content.appendChild(statsContainer);
  overlay.appendChild(content);
  heroContainer.appendChild(overlay);

  // Replace block content
  block.textContent = '';
  block.appendChild(heroContainer);

  // Set up intersection observer for scroll animation
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.8,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Add animation class when component is in view
        const statsItems = entry.target.querySelectorAll('.hero-stat-item');
        statsItems.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('animate-in');
          }, index * 200); // Stagger animation by 200ms
        });

        // Stop observing once animation is triggered
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Start observing the hero container
  observer.observe(heroContainer);
}
