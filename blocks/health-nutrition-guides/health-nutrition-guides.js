import {
  h, render, Component,
} from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';
import { readBlockConfig } from '../../scripts/aem.js';
import FilterComponent from '../../shared-components/generic-filter/index.js';

const html = htm.bind(h);

function createFilterConfig(categories) {
  return {
    category: {
      label: 'Category',
      options: categories.category.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      multiSelect: true,
      matcher: (guide, selectedValues) => {
        const guideCategories = guide.category.map((cat) => cat.toLowerCase().replace(/\s+/g, '-'));
        return selectedValues.some((value) => guideCategories.includes(value));
      },
    },
  };
}

function transformGuideData(apiData) {
  const guides = [];
  const categorySet = new Set();

  apiData.data.forEach((item, index) => {
    const categories = item.Categories ? item.Categories.split(',').map((cat) => cat.trim()).filter(Boolean) : [];

    categories.forEach((cat) => categorySet.add(cat));

    guides.push({
      id: index + 1,
      title: item['Guide Title'] || 'Untitled Guide',
      description: item.Description || '',
      category: categories,
      image: item['Image Thumbnail'],
      url: item['Guide Link'] || '#',
      price: 'Free',
    });
  });

  const categories = {
    category: Array.from(categorySet).sort().map((cat) => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat,
    })),
  };

  return { guides, categories };
}

function renderGuideCard(guide) {
  return html`
    <a 
      href="${guide.url}"
      class="crc-resource-list-item health-nutrition-guide-card-link" 
      data-category="${guide.category.map((c) => c.toLowerCase().replace(/\s+/g, '-')).join(' ')}"
    >
      <div class="resource-list-item-img">
        <img src="${guide.image}" alt="${guide.title}" />
      </div>
      <div class="resource-list-item-content">
        <h3>${guide.title}</h3>
        <div class="guide-description">
          <p>${guide.description}</p>
        </div>
        <div class="resource-list-item-meta">
          <span class="view-link">Download Now</span>
        </div>
      </div>
    </a>
  `;
}

function renderGuideSkeleton(index) {
  return html`
    <div class="crc-resource-list-item health-nutrition-guide-skeleton" key=${`skeleton-${index}`}>
      <div class="resource-list-item-img skeleton-image"></div>
      <div class="resource-list-item-content">
        <div class="skeleton-title"></div>
        <div class="guide-description">
          <div class="skeleton-text"></div>
          <div class="skeleton-text" style="width: 90%"></div>
        </div>
        <div class="guide-metadata">
          <div class="skeleton-text" style="width: 60%"></div>
          <div class="skeleton-text" style="width: 40%"></div>
        </div>
        <div class="resource-list-item-meta">
          <div class="skeleton-link"></div>
        </div>
      </div>
    </div>
  `;
}

class HealthNutritionGuidesFilterWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      guideData: [],
      filterConfig: {},
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    try {
      const response = await fetch('/resource-center/free-health-nutrition-guides/health-nutrition-guides.json');
      if (!response.ok) {
        throw new Error('Failed to fetch health and nutrition guides');
      }
      const apiData = await response.json();

      const { guides, categories } = transformGuideData(apiData);
      const filterConfig = createFilterConfig(categories);
      this.setState({
        guideData: guides,
        filterConfig,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching health and nutrition guides:', error);
      this.setState({
        isLoading: false,
        guideData: [],
        filterConfig: createFilterConfig({ category: [] }),
      });
    }
  }

  render() {
    const { isLoading, guideData, filterConfig } = this.state;

    return html`
      <section class="filter-guides-container crc-filter-resources-container health-nutrition-guides-container">
        <${FilterComponent}
          data=${guideData}
          filterConfig=${filterConfig}
          renderCard=${renderGuideCard}
          renderSkeleton=${renderGuideSkeleton}
          title="Filter health and nutrition guides"
          mobilePrompt="Filter by category"
          noResultsMessage="We don't have any health and nutrition guides that match those filters. Please clear some of your filters to reload."
          className="health-nutrition-guides"
          loading=${isLoading}
          gridLayout="alternating"
        />
      </section>
    `;
  }
}

export default async function decorate(block) {
  readBlockConfig(block);

  block.textContent = '';

  const app = html`<${HealthNutritionGuidesFilterWrapper} />`;
  render(app, block);
}
