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
      matcher: (course, selectedValues) => {
        const courseCategories = course.category.map((cat) => cat.toLowerCase().replace(/\s+/g, '-'));
        return selectedValues.some((value) => courseCategories.includes(value));
      },
    },
  };
}

function transformCourseData(apiData) {
  const courses = [];
  const categorySet = new Set();

  apiData.data.forEach((item, index) => {
    const categories = item.Categories ? item.Categories.split(',').map((cat) => cat.trim()).filter(Boolean) : [];

    categories.forEach((cat) => categorySet.add(cat));

    courses.push({
      id: index + 1,
      title: item['Course Title'] || 'Untitled Course',
      description: item.Description || '',
      category: categories,
      image: item['Image Thumbnail'],
      url: item['Course Link'] || '#',
      price: 'Free', // Assuming all are free
    });
  });

  const categories = {
    category: Array.from(categorySet).sort().map((cat) => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat,
    })),
  };

  return { courses, categories };
}

function renderCourseCard(course) {
  return html`
    <a 
      href="${course.url}"
      class="crc-resource-list-item mini-course-card-link" 
      data-category="${course.category.map((c) => c.toLowerCase().replace(/\s+/g, '-')).join(' ')}"
    >
      <div class="resource-list-item-img">
        <img src="${course.image}" alt="${course.title}" />
      </div>
      <div class="resource-list-item-content">
        <h3>${course.title}</h3>
        <div class="course-description">
          <p>${course.description}</p>
        </div>
        <div class="resource-list-item-meta">
          <span class="view-link">Download Now</span>
        </div>
      </div>
    </a>
  `;
}

function renderCourseSkeleton(index) {
  return html`
    <div class="crc-resource-list-item mini-course-skeleton" key=${`skeleton-${index}`}>
      <div class="resource-list-item-img skeleton-image"></div>
      <div class="resource-list-item-content">
        <div class="skeleton-title"></div>
        <div class="course-description">
          <div class="skeleton-text"></div>
          <div class="skeleton-text" style="width: 90%"></div>
        </div>
        <div class="course-metadata">
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

class MiniCoursesFilterWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      courseData: [],
      filterConfig: {},
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    try {
      const response = await fetch('/resource-center/free-wellness-and-fitness-mini-courses/mini-courses.json');
      if (!response.ok) {
        throw new Error('Failed to fetch mini-courses');
      }
      const apiData = await response.json();

      const { courses, categories } = transformCourseData(apiData);
      const filterConfig = createFilterConfig(categories);
      this.setState({
        courseData: courses,
        filterConfig,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching mini-courses:', error);
      this.setState({
        isLoading: false,
        courseData: [],
        filterConfig: createFilterConfig({ category: [] }),
      });
    }
  }

  render() {
    const { isLoading, courseData, filterConfig } = this.state;

    return html`
      <section class="filter-courses-container crc-filter-resources-container mini-courses-container">
        <${FilterComponent}
          data=${courseData}
          filterConfig=${filterConfig}
          renderCard=${renderCourseCard}
          renderSkeleton=${renderCourseSkeleton}
          title="Filter mini-courses"
          mobilePrompt="Filter by category"
          noResultsMessage="We don't have any mini-courses that match those filters. Please clear some of your filters to reload."
          className="mini-courses"
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

  const app = html`<${MiniCoursesFilterWrapper} />`;
  render(app, block);
}
