// Deployment trigger comment
import {
  h, render, Component,
} from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';
import { readBlockConfig } from '../../scripts/aem.js';
import FilterComponent from '../../shared-components/generic-filter/index.js';

const html = htm.bind(h);

function createFilterConfig(categories) {
  return {
    bodyPart: {
      label: 'Body Part',
      options: categories.bodyPart.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      multiSelect: true,
      matcher: (exercise, selectedValues) => {
        const exerciseBodyParts = exercise.bodyPart.map((part) => part.toLowerCase().replace(/\s+/g, '-'));
        return selectedValues.some((value) => exerciseBodyParts.includes(value));
      },
    },
    equipment: {
      label: 'Equipment',
      options: categories.equipment.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      multiSelect: true,
      matcher: (exercise, selectedValues) => {
        const exerciseEquipment = exercise.equipment.map((eq) => eq.toLowerCase().replace(/\s+/g, '-'));
        return selectedValues.some((value) => exerciseEquipment.includes(value));
      },
    },
    difficulty: {
      label: 'Difficulty',
      options: categories.difficulty.map((item) => ({
        value: item.id,
        label: item.name,
      })),
      multiSelect: true,
      matcher: (exercise, selectedValues) => {
        const difficulty = exercise.difficulty.toLowerCase();
        return selectedValues.includes(difficulty);
      },
    },
  };
}

function transformExerciseData(apiData) {
  const exercises = [];
  const bodyPartSet = new Set();
  const equipmentSet = new Set();
  const difficultySet = new Set();

  apiData.data.forEach((item, index) => {
    const bodyParts = item['Body Part'] ? item['Body Part'].split(',').map((part) => part.trim()).filter(Boolean) : [];
    const equipmentList = item.Equipment ? item.Equipment.split(',').map((eq) => eq.trim()).filter(Boolean) : ['None'];
    const difficulty = item.Difficulty || 'Beginner';

    bodyParts.forEach((part) => bodyPartSet.add(part));
    equipmentList.forEach((eq) => equipmentSet.add(eq));
    difficultySet.add(difficulty);

    exercises.push({
      id: index + 1,
      title: item.Title || 'Untitled Exercise',
      description: item.Description || '',
      category: bodyParts.join(', '),
      equipment: equipmentList,
      equipmentDisplay: equipmentList.join(', '),
      difficulty,
      bodyPart: bodyParts,
      image: item['Video Thumbnail'],
      videoUrl: item['Video URL'] || '#',
    });
  });

  const categories = {
    bodyPart: Array.from(bodyPartSet).sort().map((part) => ({
      id: part.toLowerCase().replace(/\s+/g, '-'),
      name: part,
    })),
    equipment: Array.from(equipmentSet).sort().map((eq) => ({
      id: eq.toLowerCase().replace(/\s+/g, '-'),
      name: eq,
    })),
    difficulty: Array.from(difficultySet).sort().map((diff) => ({
      id: diff.toLowerCase(),
      name: diff,
    })),
  };

  return { exercises, categories };
}

function renderExerciseCard(exercise) {
  const exerciseSlug = exercise.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const exerciseDetailUrl = `/workout-exercise-guidance/default?slug=${exerciseSlug}`;

  return html`
    <a 
      href="${exerciseDetailUrl}"
      class="crc-resource-list-item exercise-card-link" 
      data-category="${exercise.bodyPart.map((p) => p.toLowerCase().replace(/\s+/g, '-')).join(' ')}"
    >
      <div class="resource-list-item-img">
        <img src="${exercise.image}" alt="${exercise.title}" />
      </div>
      <div class="resource-list-item-content">
        <h3>${exercise.title}</h3>
        <div class="exercise-metadata">
          <p><span class="metadata-label">Body Part:</span> ${exercise.bodyPart.join(', ')}</p>
          <p><span class="metadata-label">Equipment:</span> ${exercise.equipmentDisplay}</p>
        </div>
        <div class="resource-list-item-meta">
          <span class="view-link">View Exercise</span>
          <span class="difficulty-pill difficulty-${exercise.difficulty.toLowerCase()}">${exercise.difficulty}</span>
        </div>
      </div>
    </a>
  `;
}

function renderExerciseSkeleton(index) {
  return html`
    <div class="crc-resource-list-item exercise-skeleton" key=${`skeleton-${index}`}>
      <div class="resource-list-item-img skeleton-image"></div>
      <div class="resource-list-item-content">
        <div class="skeleton-title"></div>
        <div class="exercise-metadata">
          <div class="skeleton-text"></div>
          <div class="skeleton-text" style="width: 85%"></div>
        </div>
        <div class="resource-list-item-meta">
          <div class="skeleton-link"></div>
          <div class="skeleton-pill"></div>
        </div>
      </div>
    </div>
  `;
}

class ExerciseFilterWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      exerciseData: [],
      filterConfig: {},
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  async fetchData() {
    try {
      const response = await fetch('/workout-exercise-guidance/exercises.json');
      if (!response.ok) {
        throw new Error('Failed to fetch exercises');
      }
      const apiData = await response.json();

      const { exercises, categories } = transformExerciseData(apiData);
      const filterConfig = createFilterConfig(categories);
      this.setState({
        exerciseData: exercises,
        filterConfig,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching exercises:', error);
      this.setState({
        isLoading: false,
        exerciseData: [],
        filterConfig: createFilterConfig({ bodyPart: [], equipment: [], difficulty: [] }),
      });
    }
  }

  render() {
    const { isLoading, exerciseData, filterConfig } = this.state;

    return html`
      <section class="filter-courses-container crc-filter-resources-container exercise-filter-container">
        <${FilterComponent}
          data=${exerciseData}
          filterConfig=${filterConfig}
          renderCard=${renderExerciseCard}
          renderSkeleton=${renderExerciseSkeleton}
          title="Filter exercises"
          mobilePrompt="Filter by category"
          noResultsMessage="We don't have any exercises that match those filters. Please clear some of your filters to reload."
          className="exercise-filter"
          loading=${isLoading}
        />
      </section>
    `;
  }
}

export default async function decorate(block) {
  readBlockConfig(block);

  block.textContent = '';

  const app = html`<${ExerciseFilterWrapper} />`;
  render(app, block);
}
