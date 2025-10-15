// three-cards-generator.js

document.addEventListener("DOMContentLoaded", () => {
  // Root container
  const container = document.createElement("section");
  container.className = "three-cards";

  // Section title
  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "three-cards__title";
  sectionTitle.textContent = "Our Services"; // Change as needed
  container.appendChild(sectionTitle);

  // Grid container
  const grid = document.createElement("div");
  grid.className = "three-cards__grid";
  container.appendChild(grid);

  // Sample card data (image URL, title, CTA link)
  const cardsData = [
    {
      img: "https://via.placeholder.com/400x300",
      title: "Card One",
      cta: "Learn More",
      link: "#"
    },
    {
      img: "https://via.placeholder.com/400x300",
      title: "Card Two",
      cta: "Discover",
      link: "#"
    },
    {
      img: "https://via.placeholder.com/400x300",
      title: "Card Three",
      cta: "Get Started",
      link: "#"
    }
  ];

  // Generate each card
  cardsData.forEach((data) => {
    const card = document.createElement("div");
    card.className = "three-cards__card new-card--reveal";

    // Image container
    const imgContainer = document.createElement("div");
    imgContainer.className = "new-card__media";
    const img = document.createElement("img");
    img.src = data.img;
    img.alt = data.title;
    imgContainer.appendChild(img);
    card.appendChild(imgContainer);

    // Content container
    const content = document.createElement("div");
    content.className = "new-card__content";

    const title = document.createElement("h3");
    title.className = "new-card__title";
    title.textContent = data.title;

    const cta = document.createElement("a");
    cta.className = "new-card__cta";
    cta.href = data.link;
    cta.textContent = data.cta;

    content.appendChild(title);
    content.appendChild(cta);
    card.appendChild(content);

    grid.appendChild(card);
  });

  // Append the whole section to body
  document.body.appendChild(container);

  // Reveal animation using Intersection Observer
  const revealCards = document.querySelectorAll(".new-card--reveal");
  const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };

  const revealOnScroll = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  };

  const observer = new IntersectionObserver(revealOnScroll, observerOptions);
  revealCards.forEach((card) => observer.observe(card));
});
