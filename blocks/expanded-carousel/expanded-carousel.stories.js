import decorator from './expanded-carousel.js';

// Add CSS to the page
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = '/blocks/expanded-carousel/expanded-carousel.css';
if (!document.head.querySelector(`link[href="${style.href}"]`)) {
  document.head.appendChild(style);
}

export default {
  title: 'Blocks/expanded Carousel',
  parameters: {
    docs: {
      description: {
        component: 'Interactive image carousel with responsive behavior for showcasing expanded programs and courses.',
      },
    },
  },
  argTypes: {
    // Item 1
    item1_image: {
      control: 'text',
      description: 'Item 1: Image URL',
      defaultValue: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_cpt_loggedout_website_072325.jpg',
      table: { category: 'Item 1' },
    },
    item1_title: {
      control: 'text',
      description: 'Item 1: Title',
      defaultValue: 'Certified Personal Trainer',
      table: { category: 'Item 1' },
    },
    item1_description: {
      control: 'text',
      description: 'Item 1: Description',
      defaultValue: 'Launch your expanded career by learning advanced training methods',
      table: { category: 'Item 1' },
    },
    item1_link: {
      control: 'text',
      description: 'Item 1: Link URL',
      defaultValue: '#cpt',
      table: { category: 'Item 1' },
    },
    item1_linkText: {
      control: 'text',
      description: 'Item 1: Link Text',
      defaultValue: 'Learn More',
      table: { category: 'Item 1' },
    },
    // Item 2
    item2_image: {
      control: 'text',
      description: 'Item 2: Image URL',
      defaultValue: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_cnc_loggedout_website_072325.jpg',
      table: { category: 'Item 2' },
    },
    item2_title: {
      control: 'text',
      description: 'Item 2: Title',
      defaultValue: 'Certified Nutrition Coach',
      table: { category: 'Item 2' },
    },
    item2_description: {
      control: 'text',
      description: 'Item 2: Description',
      defaultValue: 'Unleash nutrition science to foster better health and sustainable change',
      table: { category: 'Item 2' },
    },
    item2_link: {
      control: 'text',
      description: 'Item 2: Link URL',
      defaultValue: '#cnc',
      table: { category: 'Item 2' },
    },
    item2_linkText: {
      control: 'text',
      description: 'Item 2: Link Text',
      defaultValue: 'Learn More',
      table: { category: 'Item 2' },
    },
    // Item 3
    item3_image: {
      control: 'text',
      description: 'Item 3: Image URL',
      defaultValue: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_ces_loggedout_website_072325.jpg',
      table: { category: 'Item 3' },
    },
    item3_title: {
      control: 'text',
      description: 'Item 3: Title',
      defaultValue: 'Corrective Exercise',
      table: { category: 'Item 3' },
    },
    item3_description: {
      control: 'text',
      description: 'Item 3: Description',
      defaultValue: 'Empower clients with tools to enhance movement quality',
      table: { category: 'Item 3' },
    },
    item3_link: {
      control: 'text',
      description: 'Item 3: Link URL',
      defaultValue: '#ces',
      table: { category: 'Item 3' },
    },
    item3_linkText: {
      control: 'text',
      description: 'Item 3: Link Text',
      defaultValue: 'Learn More',
      table: { category: 'Item 3' },
    },
    // Item 4
    item4_image: {
      control: 'text',
      description: 'Item 4: Image URL',
      defaultValue: 'https://www.nasm.org/images/nasmlibraries/pages/home/footer-collage/nasm-collage-footer-img-5.png',
      table: { category: 'Item 4' },
    },
    item4_title: {
      control: 'text',
      description: 'Item 4: Title',
      defaultValue: 'Core Strength',
      table: { category: 'Item 4' },
    },
    item4_description: {
      control: 'text',
      description: 'Item 4: Description',
      defaultValue: 'Master proper technique with side plank exercises',
      table: { category: 'Item 4' },
    },
    item4_link: {
      control: 'text',
      description: 'Item 4: Link URL',
      defaultValue: '#core',
      table: { category: 'Item 4' },
    },
    item4_linkText: {
      control: 'text',
      description: 'Item 4: Link Text',
      defaultValue: 'Learn More',
      table: { category: 'Item 4' },
    },
    // Item 5
    item5_image: {
      control: 'text',
      description: 'Item 5: Image URL',
      defaultValue: 'https://www.nasm.org/images/nasmlibraries/pages/home/footer-collage/nasm-collage-footer-img-8.png',
      table: { category: 'Item 5' },
    },
    item5_title: {
      control: 'text',
      description: 'Item 5: Title',
      defaultValue: 'Strength Training',
      table: { category: 'Item 5' },
    },
    item5_description: {
      control: 'text',
      description: 'Item 5: Description',
      defaultValue: 'Build muscle with lateral raises and targeted exercises',
      table: { category: 'Item 5' },
    },
    item5_link: {
      control: 'text',
      description: 'Item 5: Link URL',
      defaultValue: '#strength',
      table: { category: 'Item 5' },
    },
    item5_linkText: {
      control: 'text',
      description: 'Item 5: Link Text',
      defaultValue: 'Learn More',
      table: { category: 'Item 5' },
    },
    // Item 6
    item6_image: {
      control: 'text',
      description: 'Item 6: Image URL',
      defaultValue: 'https://via.placeholder.com/450x563/1a1a2e/00a8cc?text=Wellness+Program',
      table: { category: 'Item 6' },
    },
    item6_title: {
      control: 'text',
      description: 'Item 6: Title',
      defaultValue: 'Wellness Program',
      table: { category: 'Item 6' },
    },
    item6_description: {
      control: 'text',
      description: 'Item 6: Description',
      defaultValue: 'Comprehensive wellness solutions for optimal health',
      table: { category: 'Item 6' },
    },
    item6_link: {
      control: 'text',
      description: 'Item 6: Link URL',
      defaultValue: '#wellness',
      table: { category: 'Item 6' },
    },
    item6_linkText: {
      control: 'text',
      description: 'Item 6: Link Text',
      defaultValue: 'Learn More',
      table: { category: 'Item 6' },
    },
  },
};

// Enhanced template with individual item controls
const EditableTemplate = (args) => {
  const wrapper = document.createElement('div');

  // Build items based on individual properties
  const items = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 1; i <= 6; i++) {
    if (args[`item${i}_image`]) {
      const item = {
        image: args[`item${i}_image`],
        title: args[`item${i}_title`],
        description: args[`item${i}_description`],
        link: args[`item${i}_link`],
        linkText: args[`item${i}_linkText`],
      };
      items.push(item);
    }
  }

  // Create carousel HTML
  const itemsHTML = items.map((item) => `
    <div>
      <picture>
        <img src="${item.image}" alt="${item.title}">
      </picture>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <p><a href="${item.link}">${item.linkText}</a></p>
    </div>
  `).join('');

  wrapper.innerHTML = `
    <div class="expanded-carousel">
      ${itemsHTML}
    </div>
  `;

  const block = wrapper.querySelector('.expanded-carousel');

  // Apply the decorator
  setTimeout(() => {
    decorator(block);
  }, 0);

  return wrapper;
};

// Main editable story
export const Editable = EditableTemplate.bind({});
Editable.args = {
  // Item 1 defaults
  item1_image: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_cpt_loggedout_website_072325.jpg',
  item1_title: 'Certified Personal Trainer',
  item1_description: 'Launch your expanded career by learning advanced training methods',
  item1_link: '#cpt',
  item1_linkText: 'Learn More',
  // Item 2 defaults
  item2_image: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_cnc_loggedout_website_072325.jpg',
  item2_title: 'Certified Nutrition Coach',
  item2_description: 'Unleash nutrition science to foster better health and sustainable change',
  item2_link: '#cnc',
  item2_linkText: 'Learn More',
  // Item 3 defaults
  item3_image: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_ces_loggedout_website_072325.jpg',
  item3_title: 'Corrective Exercise',
  item3_description: 'Empower clients with tools to enhance movement quality',
  item3_link: '#ces',
  item3_linkText: 'Learn More',
  // Item 4 defaults
  item4_image: 'https://www.nasm.org/images/nasmlibraries/pages/home/footer-collage/nasm-collage-footer-img-5.png',
  item4_title: 'Core Strength',
  item4_description: 'Master proper technique with side plank exercises',
  item4_link: '#core',
  item4_linkText: 'Learn More',
  // Item 5 defaults
  item5_image: 'https://www.nasm.org/images/nasmlibraries/pages/home/footer-collage/nasm-collage-footer-img-8.png',
  item5_title: 'Strength Training',
  item5_description: 'Build muscle with lateral raises and targeted exercises',
  item5_link: '#strength',
  item5_linkText: 'Learn More',
  // Item 6 defaults
  item6_image: 'https://via.placeholder.com/450x563/1a1a2e/00a8cc?text=Wellness+Program',
  item6_title: 'Wellness Program',
  item6_description: 'Comprehensive wellness solutions for optimal health',
  item6_link: '#wellness',
  item6_linkText: 'Learn More',
};
Editable.storyName = 'Editable Carousel';
Editable.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};
Editable.parameters = {
  docs: {
    description: {
      story: 'Fully editable carousel where you can modify each item\'s properties individually. URL: globals=viewport.value:desktop',
    },
  },
};

// Simple presets for quick testing
const SimpleTemplate = (itemCount = 4) => {
  const wrapper = document.createElement('div');

  const defaultItems = [
    {
      image: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_cpt_loggedout_website_072325.jpg',
      title: 'Certified Personal Trainer',
      description: 'Launch your expanded career',
    },
    {
      image: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_cnc_loggedout_website_072325.jpg',
      title: 'Nutrition Coach',
      description: 'Master nutrition science',
    },
    {
      image: 'https://www.nasm.org/images/nasmlibraries/pages/home/featured-products/na_ditchtheclassroom_450x563_homeproduct_ces_loggedout_website_072325.jpg',
      title: 'Corrective Exercise',
      description: 'Enhance movement quality',
    },
    {
      image: 'https://www.nasm.org/images/nasmlibraries/pages/home/footer-collage/nasm-collage-footer-img-5.png',
      title: 'Core Strength',
      description: 'Master proper technique',
    },
    {
      image: 'https://www.nasm.org/images/nasmlibraries/pages/home/footer-collage/nasm-collage-footer-img-8.png',
      title: 'Strength Training',
      description: 'Build muscle effectively',
    },
    {
      image: 'https://via.placeholder.com/450x563/1a1a2e/00a8cc?text=Wellness',
      title: 'Wellness Program',
      description: 'Comprehensive solutions',
    },
  ];

  const items = defaultItems.slice(0, itemCount);

  const itemsHTML = items.map((item) => `
    <div>
      <picture>
        <img src="${item.image}" alt="${item.title}">
      </picture>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    </div>
  `).join('');

  wrapper.innerHTML = `
    <div class="expanded-carousel">
      ${itemsHTML}
    </div>
  `;

  const block = wrapper.querySelector('.expanded-carousel');

  setTimeout(() => {
    decorator(block);
  }, 0);

  return wrapper;
};

export const ThreeItems = () => SimpleTemplate(3);
ThreeItems.storyName = 'Three Items';
ThreeItems.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};

export const FourItems = () => SimpleTemplate(4);
FourItems.storyName = 'Four Items';
FourItems.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};

export const FiveItems = () => SimpleTemplate(5);
FiveItems.storyName = 'Five Items';
FiveItems.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};

export const SixItems = () => SimpleTemplate(6);
SixItems.storyName = 'Six Items';
SixItems.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};

// Desktop view preset
export const DesktopView = () => SimpleTemplate(6);
DesktopView.storyName = 'Desktop View';
DesktopView.globals = {
  viewport: {
    value: 'desktop',
    isRotated: false,
  },
};
DesktopView.parameters = {
  docs: {
    description: {
      story: 'Desktop view with 6 items. URL: globals=viewport.value:desktop',
    },
  },
};

// Small Mobile view preset (mobile1)
export const SmallMobileView = () => SimpleTemplate(4);
SmallMobileView.storyName = 'Small Mobile View';
SmallMobileView.globals = {
  viewport: {
    value: 'mobile1',
    isRotated: false,
  },
};
SmallMobileView.parameters = {
  docs: {
    description: {
      story: 'Small mobile optimized view (390px width). URL: globals=viewport.value:mobile1',
    },
  },
};

// Large Mobile view preset (mobile2)
export const LargeMobileView = () => SimpleTemplate(4);
LargeMobileView.storyName = 'Large Mobile View';
LargeMobileView.globals = {
  viewport: {
    value: 'mobile2',
    isRotated: false,
  },
};
LargeMobileView.parameters = {
  docs: {
    description: {
      story: 'Large mobile optimized view (540px width). URL: globals=viewport.value:mobile2',
    },
  },
};

// Tablet view preset
export const TabletView = () => SimpleTemplate(5);
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
      story: 'Tablet view with horizontal scroll (768px width). URL: globals=viewport.value:tablet',
    },
  },
};
