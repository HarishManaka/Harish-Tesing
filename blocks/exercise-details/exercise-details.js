// Deployment trigger comment
export default async function decorate(block) {
  // Extract slug from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const exerciseSlug = urlParams.get('slug');

  // Skip if we're on the default page
  if (!exerciseSlug || exerciseSlug === 'default') {
    block.textContent = 'No exercise selected';
    return;
  }

  try {
    // Fetch exercises data
    const response = await fetch('/workout-exercise-guidance/exercises.json');
    if (!response.ok) {
      throw new Error('Failed to fetch exercises data');
    }

    const exercisesData = await response.json();

    // Find exercise by matching slug
    const exercise = exercisesData.data.find((ex) => {
      // Clean up title: trim whitespace and convert to slug (same logic as filter)
      const titleSlug = ex.Title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return titleSlug === exerciseSlug;
    });

    if (!exercise) {
      block.innerHTML = `
        <div class="exercise-details__error">
          <h2>Exercise not found</h2>
          <p>The exercise "${exerciseSlug}" could not be found.</p>
        </div>
      `;
      return;
    }

    // Render exercise details
    renderExerciseDetails(block, exercise);

    // Update page title and meta tags
    document.title = `${exercise.Title} - NASM`;
    setMetaTags(exercise);
  } catch (error) {
    console.warn('Error loading exercise details:', error);
    block.innerHTML = `
      <div class="exercise-details__error">
        <h2>Error loading exercise</h2>
        <p>There was an error loading the exercise details. Please try again later.</p>
      </div>
    `;
  }
}

function renderVideoThumbnail(exercise, youtubeId) {
  if (!exercise['Video Thumbnail']) return '';

  if (youtubeId) {
    return `
      <div class="exercise-details__video-wrapper" data-youtube-id="${youtubeId}">
        <img src="${exercise['Video Thumbnail']}" alt="${exercise.Title}" class="exercise-details__thumbnail" />
        <div class="exercise-details__play-button">
          <svg width="68" height="48" viewBox="0 0 68 48" fill="none">
            <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24 S67.94,13.05,66.52,7.74z" fill="#FF0000"></path>
            <path d="M 45,24 27,14 27,34" fill="#FFFFFF"></path>
          </svg>
        </div>
      </div>
    `;
  }

  return `<img src="${exercise['Video Thumbnail']}" alt="${exercise.Title}" class="exercise-details__thumbnail" />`;
}

function renderExerciseDetails(block, exercise) {
  // Format exercise description with proper step separation
  let descriptionHtml = '';

  if (exercise.Description) {
    // Check if description contains steps
    if (exercise.Description.includes('Step 1:')) {
      // First try to split by existing newlines
      let steps = exercise.Description.split('\n').filter((line) => line.trim());

      // If no newlines or only one line, split by "Step X:" pattern
      if (steps.length <= 1) {
        const stepPattern = /(Step \d+:)/;
        const parts = exercise.Description.split(stepPattern).filter((part) => part.trim());

        steps = [];
        for (let i = 0; i < parts.length; i += 2) {
          if (i + 1 < parts.length) {
            steps.push(parts[i] + parts[i + 1]);
          }
        }
      }

      // Format each step with bold labels
      descriptionHtml = steps
        .map((step) => {
          // Make "Step X:" bold
          const formattedStep = step.trim().replace(/^(Step\s+\d+:)/, '<strong>$1</strong>');
          return `<p>${formattedStep}</p>`;
        })
        .join('');
    } else {
      // If not an exercise with steps, just split by paragraphs
      descriptionHtml = exercise.Description
        .split('\n\n')
        .map((para) => `<p>${para.trim()}</p>`)
        .join('');
    }
  }

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url || url === '#') return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(exercise['Video URL']);

  const html = `
    <div class="exercise-details__container">
      <div class="exercise-details__back-button-wrapper">
        <a href="/workout-exercise-guidance" class="exercise-details__back-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to Full Exercise Library
        </a>
      </div>
      <div class="exercise-details__wrapper">
        <div class="exercise-details__left-column">
          <div class="exercise-details__media">
            ${renderVideoThumbnail(exercise, youtubeId)}
          </div>
        </div>
        <div class="exercise-details__right-column">
          <div class="exercise-details__header">
            <h1 class="exercise-details__title">${exercise.Title}</h1>
          </div>
          
          <div class="exercise-details__info">

            <div class="exercise-details__info-item">
              <h3>Body Part</h3>
              <p>${exercise['Body Part']}</p>
            </div>
            
            <div class="exercise-details__info-item">
              <h3>Equipment</h3>
              <p>${exercise.Equipment || 'None'}</p>
            </div>

            <div class="exercise-details__info-item">
              <h3>Difficulty</h3>
              <p>${exercise.Difficulty}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="exercise-details__description">
        <h2>Description</h2>
        ${descriptionHtml}
      </div>
    </div>
  `;

  block.innerHTML = html;

  // Add click handler for video
  if (youtubeId) {
    const videoWrapper = block.querySelector('.exercise-details__video-wrapper');
    if (videoWrapper) {
      videoWrapper.addEventListener('click', () => {
        openYouTubeModal(youtubeId, exercise.Title);
      });
    }
  }
}

function setMetaTags(exercise) {
  // Helper function to create/update meta tags
  function createMetaTag(property, content, type) {
    if (!property || !type || !content) return;

    let meta = document.head.querySelector(`meta[${type}="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(type, property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  // Set meta tags
  createMetaTag('description', `Learn how to perform ${exercise.Title}. Target muscles: ${exercise['Body Part']}. Equipment: ${exercise.Equipment}.`, 'name');
  createMetaTag('og:title', exercise.Title, 'property');
  createMetaTag('og:description', `${exercise.Description.substring(0, 200)}...`, 'property');
  createMetaTag('og:type', 'article', 'property');
  createMetaTag('og:url', window.location.href, 'property');

  if (exercise['Video Thumbnail']) {
    createMetaTag('og:image', exercise['Video Thumbnail'], 'property');
  }
}

function openYouTubeModal(videoId, title) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'exercise-details__modal';
  modal.innerHTML = `
    <div class="exercise-details__modal-content">
      <button class="exercise-details__modal-close" aria-label="Close video">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" fill="currentColor"/>
        </svg>
      </button>
      <div class="exercise-details__modal-video">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
          title="${title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `;

  // Add to body
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Close modal on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on close button click
  const closeButton = modal.querySelector('.exercise-details__modal-close');
  closeButton.addEventListener('click', closeModal);

  // Close modal on ESC key
  function handleEscape(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }
  document.addEventListener('keydown', handleEscape);

  function closeModal() {
    modal.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscape);
  }
}
