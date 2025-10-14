import decorator from './mansory.js';

// Add CSS to the page
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = '/blocks/mansory/mansory.css';
if (!document.head.querySelector(`link[href="${style.href}"]`)) {
  document.head.appendChild(style);
}

export default {
  title: 'Blocks/Masonry',
  parameters: {
    docs: {
      description: {
        component: 'Masonry grid layout for displaying images and Vimeo videos in a visually appealing pattern, perfect for showcasing fitness activities and training moments. Each item follows a 4-div structure: image (with alt), video URL, video poster (with alt), and video title.',
      },
    },
  },
  argTypes: {
    // Item 1 controls
    item1_type: {
      control: { type: 'radio' },
      options: ['image', 'video'],
      description: 'Item 1: Media type',
      table: { category: 'Item 1' },
    },
    item1_image: {
      control: 'text',
      description: 'Item 1: Image URL',
      table: { category: 'Item 1' },
      if: { arg: 'item1_type', eq: 'image' },
    },
    item1_imageAlt: {
      control: 'text',
      description: 'Item 1: Image Alt Text',
      table: { category: 'Item 1' },
      if: { arg: 'item1_type', eq: 'image' },
    },
    item1_videoUrl: {
      control: 'text',
      description: 'Item 1: Vimeo Video URL',
      table: { category: 'Item 1' },
      if: { arg: 'item1_type', eq: 'video' },
    },
    item1_videoPoster: {
      control: 'text',
      description: 'Item 1: Video Poster Image URL',
      table: { category: 'Item 1' },
      if: { arg: 'item1_type', eq: 'video' },
    },
    item1_videoPosterAlt: {
      control: 'text',
      description: 'Item 1: Video Poster Alt Text',
      table: { category: 'Item 1' },
      if: { arg: 'item1_type', eq: 'video' },
    },
    item1_videoTitle: {
      control: 'text',
      description: 'Item 1: Video Title',
      table: { category: 'Item 1' },
      if: { arg: 'item1_type', eq: 'video' },
    },

    // Item 2 controls
    item2_type: {
      control: { type: 'radio' },
      options: ['image', 'video'],
      description: 'Item 2: Media type',
      table: { category: 'Item 2' },
    },
    item2_image: {
      control: 'text',
      description: 'Item 2: Image URL',
      table: { category: 'Item 2' },
      if: { arg: 'item2_type', eq: 'image' },
    },
    item2_imageAlt: {
      control: 'text',
      description: 'Item 2: Image Alt Text',
      table: { category: 'Item 2' },
      if: { arg: 'item2_type', eq: 'image' },
    },
    item2_videoUrl: {
      control: 'text',
      description: 'Item 2: Vimeo Video URL',
      table: { category: 'Item 2' },
      if: { arg: 'item2_type', eq: 'video' },
    },
    item2_videoPoster: {
      control: 'text',
      description: 'Item 2: Video Poster Image URL',
      table: { category: 'Item 2' },
      if: { arg: 'item2_type', eq: 'video' },
    },
    item2_videoPosterAlt: {
      control: 'text',
      description: 'Item 2: Video Poster Alt Text',
      table: { category: 'Item 2' },
      if: { arg: 'item2_type', eq: 'video' },
    },
    item2_videoTitle: {
      control: 'text',
      description: 'Item 2: Video Title',
      table: { category: 'Item 2' },
      if: { arg: 'item2_type', eq: 'video' },
    },

    // Item 3 controls
    item3_type: {
      control: { type: 'radio' },
      options: ['image', 'video'],
      description: 'Item 3: Media type',
      table: { category: 'Item 3' },
    },
    item3_image: {
      control: 'text',
      description: 'Item 3: Image URL',
      table: { category: 'Item 3' },
      if: { arg: 'item3_type', eq: 'image' },
    },
    item3_imageAlt: {
      control: 'text',
      description: 'Item 3: Image Alt Text',
      table: { category: 'Item 3' },
      if: { arg: 'item3_type', eq: 'image' },
    },
    item3_videoUrl: {
      control: 'text',
      description: 'Item 3: Vimeo Video URL',
      table: { category: 'Item 3' },
      if: { arg: 'item3_type', eq: 'video' },
    },
    item3_videoPoster: {
      control: 'text',
      description: 'Item 3: Video Poster Image URL',
      table: { category: 'Item 3' },
      if: { arg: 'item3_type', eq: 'video' },
    },
    item3_videoPosterAlt: {
      control: 'text',
      description: 'Item 3: Video Poster Alt Text',
      table: { category: 'Item 3' },
      if: { arg: 'item3_type', eq: 'video' },
    },
    item3_videoTitle: {
      control: 'text',
      description: 'Item 3: Video Title',
      table: { category: 'Item 3' },
      if: { arg: 'item3_type', eq: 'video' },
    },

    // Item 4 controls
    item4_type: {
      control: { type: 'radio' },
      options: ['image', 'video'],
      description: 'Item 4: Media type',
      table: { category: 'Item 4' },
    },
    item4_image: {
      control: 'text',
      description: 'Item 4: Image URL',
      table: { category: 'Item 4' },
      if: { arg: 'item4_type', eq: 'image' },
    },
    item4_imageAlt: {
      control: 'text',
      description: 'Item 4: Image Alt Text',
      table: { category: 'Item 4' },
      if: { arg: 'item4_type', eq: 'image' },
    },
    item4_videoUrl: {
      control: 'text',
      description: 'Item 4: Vimeo Video URL',
      table: { category: 'Item 4' },
      if: { arg: 'item4_type', eq: 'video' },
    },
    item4_videoPoster: {
      control: 'text',
      description: 'Item 4: Video Poster Image URL',
      table: { category: 'Item 4' },
      if: { arg: 'item4_type', eq: 'video' },
    },
    item4_videoPosterAlt: {
      control: 'text',
      description: 'Item 4: Video Poster Alt Text',
      table: { category: 'Item 4' },
      if: { arg: 'item4_type', eq: 'video' },
    },
    item4_videoTitle: {
      control: 'text',
      description: 'Item 4: Video Title',
      table: { category: 'Item 4' },
      if: { arg: 'item4_type', eq: 'video' },
    },

    // Item 5 controls
    item5_type: {
      control: { type: 'radio' },
      options: ['image', 'video'],
      description: 'Item 5: Media type',
      table: { category: 'Item 5' },
    },
    item5_image: {
      control: 'text',
      description: 'Item 5: Image URL',
      table: { category: 'Item 5' },
      if: { arg: 'item5_type', eq: 'image' },
    },
    item5_imageAlt: {
      control: 'text',
      description: 'Item 5: Image Alt Text',
      table: { category: 'Item 5' },
      if: { arg: 'item5_type', eq: 'image' },
    },
    item5_videoUrl: {
      control: 'text',
      description: 'Item 5: Vimeo Video URL',
      table: { category: 'Item 5' },
      if: { arg: 'item5_type', eq: 'video' },
    },
    item5_videoPoster: {
      control: 'text',
      description: 'Item 5: Video Poster Image URL',
      table: { category: 'Item 5' },
      if: { arg: 'item5_type', eq: 'video' },
    },
    item5_videoPosterAlt: {
      control: 'text',
      description: 'Item 5: Video Poster Alt Text',
      table: { category: 'Item 5' },
      if: { arg: 'item5_type', eq: 'video' },
    },
    item5_videoTitle: {
      control: 'text',
      description: 'Item 5: Video Title',
      table: { category: 'Item 5' },
      if: { arg: 'item5_type', eq: 'video' },
    },

    // Item 6 controls
    item6_type: {
      control: { type: 'radio' },
      options: ['image', 'video'],
      description: 'Item 6: Media type',
      table: { category: 'Item 6' },
    },
    item6_image: {
      control: 'text',
      description: 'Item 6: Image URL',
      table: { category: 'Item 6' },
      if: { arg: 'item6_type', eq: 'image' },
    },
    item6_imageAlt: {
      control: 'text',
      description: 'Item 6: Image Alt Text',
      table: { category: 'Item 6' },
      if: { arg: 'item6_type', eq: 'image' },
    },
    item6_videoUrl: {
      control: 'text',
      description: 'Item 6: Vimeo Video URL',
      table: { category: 'Item 6' },
      if: { arg: 'item6_type', eq: 'video' },
    },
    item6_videoPoster: {
      control: 'text',
      description: 'Item 6: Video Poster Image URL',
      table: { category: 'Item 6' },
      if: { arg: 'item6_type', eq: 'video' },
    },
    item6_videoPosterAlt: {
      control: 'text',
      description: 'Item 6: Video Poster Alt Text',
      table: { category: 'Item 6' },
      if: { arg: 'item6_type', eq: 'video' },
    },
    item6_videoTitle: {
      control: 'text',
      description: 'Item 6: Video Title',
      table: { category: 'Item 6' },
      if: { arg: 'item6_type', eq: 'video' },
    },
  },
};

// Helper function to create the 4-div structure for each item
const createItemHTML = (
  type,
  image,
  imageAlt,
  videoUrl,
  videoPoster,
  videoPosterAlt,
  videoTitle,
) => {
  // Always create 4 divs as per the correct structure
  let html = '<div>';

  // Div 1: Image (with alt text embedded in img tag)
  if (type === 'image' && image) {
    html += `<div><picture><img src="${image}" alt="${imageAlt || ''}"></picture></div>`;
  } else {
    html += '<div></div>';
  }

  // Div 2: Video URL
  if (type === 'video' && videoUrl) {
    html += `<div>${videoUrl}</div>`;
  } else {
    html += '<div></div>';
  }

  // Div 3: Video Poster (with alt text embedded in img tag)
  if (type === 'video' && videoPoster) {
    html += `<div><picture><img src="${videoPoster}" alt="${videoPosterAlt || ''}"></picture></div>`;
  } else {
    html += '<div></div>';
  }

  // Div 4: Video Title
  if (type === 'video' && videoTitle) {
    html += `<div>${videoTitle}</div>`;
  } else {
    html += '<div></div>';
  }

  html += '</div>';
  return html;
};

// Editable template with controls
const EditableTemplate = (args) => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('mansory-wrapper');

  // Build HTML structure for each item based on controls
  let itemsHTML = '';

  for (let i = 1; i <= 6; i += 1) {
    const type = args[`item${i}_type`];
    const image = args[`item${i}_image`];
    const imageAlt = args[`item${i}_imageAlt`];
    const videoUrl = args[`item${i}_videoUrl`];
    const videoPoster = args[`item${i}_videoPoster`];
    const videoPosterAlt = args[`item${i}_videoPosterAlt`];
    const videoTitle = args[`item${i}_videoTitle`];

    itemsHTML += createItemHTML(
      type,
      image,
      imageAlt,
      videoUrl,
      videoPoster,
      videoPosterAlt,
      videoTitle,
    );
  }

  // Create container and apply decorator
  const container = document.createElement('div');
  container.className = 'mansory';
  container.innerHTML = itemsHTML;

  setTimeout(() => {
    decorator(container);
  }, 0);

  return container;
};

export const Editable = EditableTemplate.bind({});
Editable.storyName = 'Editable Masonry';
Editable.args = {
  // Item 1 - Video
  item1_type: 'video',
  item1_videoUrl: 'https://vimeo.com/1076505125',
  item1_videoPoster: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop',
  item1_videoPosterAlt: 'Fitness training video thumbnail',
  item1_videoTitle: 'Fitness Training Video',

  // Item 2 - Image
  item2_type: 'image',
  item2_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  item2_imageAlt: 'Boxing training',

  // Item 3 - Video
  item3_type: 'video',
  item3_videoUrl: 'https://vimeo.com/1076505125',
  item3_videoPoster: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
  item3_videoPosterAlt: 'Running workout video thumbnail',
  item3_videoTitle: 'Running Workout Video',

  // Item 4 - Image
  item4_type: 'image',
  item4_image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop',
  item4_imageAlt: 'Battle ropes exercise',

  // Item 5 - Image
  item5_type: 'image',
  item5_image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
  item5_imageAlt: 'Yoga stretching pose',

  // Item 6 - Video
  item6_type: 'video',
  item6_videoUrl: 'https://vimeo.com/1076505125',
  item6_videoPoster: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=300&fit=crop',
  item6_videoPosterAlt: 'Strength training video',
  item6_videoTitle: 'Weight Training Basics',
};
Editable.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};
Editable.parameters = {
  docs: {
    description: {
      story: 'Fully editable masonry with controls. Each item follows the 4-div structure. URL: globals=viewport.value:desktop',
    },
  },
};

// Mixed Content Template (Images and Videos)
const MixedContentTemplate = () => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('mansory-wrapper');

  const itemsHTML = createItemHTML(
    'video',
    '',
    '',
    'https://vimeo.com/1076505125',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop',
    'Fitness training video',
    'High Intensity Training',
  )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'Boxing training session',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
      'Running workout video',
      'Cardio Workout Session',
    )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop',
      'Battle ropes exercise',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
      'Yoga stretching routine',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=300&fit=crop',
      'Strength training video',
      'Weight Training Basics',
    );

  const container = document.createElement('div');
  container.className = 'mansory';
  container.innerHTML = itemsHTML;

  setTimeout(() => {
    decorator(container);
  }, 0);

  return container;
};

export const MixedContent = MixedContentTemplate.bind({});
MixedContent.storyName = 'Mixed Images and Videos';
MixedContent.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};
MixedContent.parameters = {
  docs: {
    description: {
      story: 'Masonry layout with a mix of images and Vimeo videos. Demonstrates the 4-div structure handling both media types. URL: globals=viewport.value:desktop',
    },
  },
};

// Images Only Template
const ImagesOnlyTemplate = () => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('mansory-wrapper');

  const itemsHTML = createItemHTML(
    'image',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop',
    'Person drinking water during workout',
    '',
    '',
    '',
    '',
  )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'Boxing training with heavy bag',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
      'Morning running workout',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop',
      'Battle ropes training',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
      'Yoga stretching pose',
      '',
      '',
      '',
      '',
    )
    + createItemHTML(
      'image',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=300&fit=crop',
      'Gym workout session',
      '',
      '',
      '',
      '',
    );

  const container = document.createElement('div');
  container.className = 'mansory';
  container.innerHTML = itemsHTML;

  setTimeout(() => {
    decorator(container);
  }, 0);

  return container;
};

export const ImagesOnly = ImagesOnlyTemplate.bind({});
ImagesOnly.storyName = 'Images Only';
ImagesOnly.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};
ImagesOnly.parameters = {
  docs: {
    description: {
      story: 'Masonry layout with only images, no videos. Each item uses the standard 4-div structure. URL: globals=viewport.value:desktop',
    },
  },
};

// Videos Only Template
const VideosOnlyTemplate = () => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('mansory-wrapper');

  const itemsHTML = createItemHTML(
    'video',
    '',
    '',
    'https://vimeo.com/1076505125',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop',
    'HIIT workout video',
    'HIIT Training Session',
  )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'Boxing technique video',
      'Boxing Fundamentals',
    )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',
      'Running form video',
      'Perfect Running Form',
    )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=300&fit=crop',
      'Battle ropes tutorial',
      'Battle Ropes Workout',
    )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
      'Yoga flow video',
      'Yoga Flow Session',
    )
    + createItemHTML(
      'video',
      '',
      '',
      'https://vimeo.com/1076505125',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=300&fit=crop',
      'Strength training basics',
      'Strength Training 101',
    );

  const container = document.createElement('div');
  container.className = 'mansory';
  container.innerHTML = itemsHTML;

  setTimeout(() => {
    decorator(container);
  }, 0);

  return container;
};

export const VideosOnly = VideosOnlyTemplate.bind({});
VideosOnly.storyName = 'Videos Only';
VideosOnly.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};
VideosOnly.parameters = {
  docs: {
    description: {
      story: 'Masonry layout with only Vimeo videos. Each video item follows the 4-div structure with poster images and titles. URL: globals=viewport.value:desktop',
    },
  },
};

// Tablet View
export const TabletView = MixedContentTemplate.bind({});
TabletView.storyName = 'Tablet View';
TabletView.globals = {
  viewport: {
    value: 'tablet',
    isRotated: false,
  },
};
TabletView.parameters = {
  docs: {
    description: {
      story: 'Masonry layout optimized for tablet viewing. URL: globals=viewport.value:tablet',
    },
  },
};

// Mobile View
export const MobileView = MixedContentTemplate.bind({});
MobileView.storyName = 'Mobile View';
MobileView.globals = {
  viewport: {
    value: 'mobile1',
    isRotated: false,
  },
};
MobileView.parameters = {
  docs: {
    description: {
      story: 'Masonry layout optimized for mobile viewing. URL: globals=viewport.value:mobile1',
    },
  },
};
