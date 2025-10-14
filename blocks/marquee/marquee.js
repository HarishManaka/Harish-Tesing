// Deployment trigger comment
export default async function decorate(block) {
  // Get the text from the first li element
  const firstLi = block.querySelector('li');
  const marqueeText = firstLi ? firstLi.textContent : '';

  // Clear the block content
  block.innerHTML = '';

  // Add the id
  block.id = 'nasm-marquee';

  // Create the marquee structure
  const createMarqueeContent = (isHidden = false) => {
    const ul = document.createElement('ul');
    ul.className = 'marquee-content';
    ul.setAttribute('role', 'marquee');
    ul.setAttribute('aria-label', 'Scrolling text');
    if (isHidden) {
      ul.setAttribute('aria-hidden', 'true');
    }

    // Create 4 repetitions of the text with arrow images
    for (let i = 0; i < 4; i += 1) {
      const li = document.createElement('li');
      li.textContent = marqueeText;
      ul.appendChild(li);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = 'https://nasm.org/docs/nasmlibraries/svg/marquee-arrow.svg?sfvrsn=3e966a87_2';
      img.alt = 'arrow-right';
      ul.appendChild(img);
    }

    return ul;
  };

  // Add two marquee content sections
  block.appendChild(createMarqueeContent());
  block.appendChild(createMarqueeContent(true));
}
