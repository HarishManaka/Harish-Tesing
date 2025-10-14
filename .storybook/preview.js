/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    docs: {
      toc: true,
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'Small Mobile',
          styles: {
            width: '390px',
            height: '667px',
          },
        },
        mobile2: {
          name: 'Large Mobile',
          styles: {
            width: '540px',
            height: '926px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
      },
    },
  },
  initialGlobals: {
    viewport: {
      value: 'desktop',
      isRotated: false,
    },
  },
};

// Load global styles
const loadStyles = () => {
  const styles = [
    '/styles/styles.css',
    '/styles/lazy-styles.css'
  ];

  styles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
};

// Initialize on load
if (typeof window !== 'undefined') {
  loadStyles();
}

export default preview;