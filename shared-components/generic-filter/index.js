import {
  h, Component,
} from '@dropins/tools/preact.js';
import htm from '../../scripts/htm.js';

const html = htm.bind(h);

export class GenericFilter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filteredData: props.data || [],
      activeFilters: GenericFilter.initializeFilters(props.filterConfig),
      showMobileFilters: false,
    };
  }

  static initializeFilters(filterConfig) {
    const filters = {};
    if (filterConfig) {
      Object.keys(filterConfig).forEach((key) => {
        filters[key] = filterConfig[key].multiSelect ? [] : null;
      });
    }
    return filters;
  }

  componentDidMount() {
    this.applyFilters();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.applyFilters();
    }
  }

  applyFilters = () => {
    const { data, filterConfig } = this.props;
    const { activeFilters } = this.state;

    if (!data || !filterConfig) {
      this.setState({ filteredData: data || [] });
      return;
    }

    let filtered = [...data];

    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
        return;
      }

      const config = filterConfig[filterKey];
      if (config && config.matcher) {
        filtered = filtered.filter((item) => config.matcher(item, filterValue));
      }
    });

    this.setState({
      filteredData: filtered,
    });

    if (this.props.onFilter) {
      this.props.onFilter(filtered);
    }
  };

  handleFilterChange = (filterKey, value) => {
    const { filterConfig } = this.props;
    const config = filterConfig[filterKey];
    const newFilters = { ...this.state.activeFilters };

    if (config.multiSelect) {
      // Ensure we're working with an array
      const currentValues = Array.isArray(newFilters[filterKey])
        ? [...newFilters[filterKey]]
        : [];
      const index = currentValues.indexOf(value);

      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value);
      }

      newFilters[filterKey] = currentValues;
    } else {
      newFilters[filterKey] = newFilters[filterKey] === value ? null : value;
    }

    this.setState({ activeFilters: newFilters }, this.applyFilters);
  };

  clearFilters = () => {
    const clearedFilters = GenericFilter.initializeFilters(this.props.filterConfig);
    this.setState({ activeFilters: clearedFilters }, this.applyFilters);
  };

  toggleMobileFilters = () => {
    this.setState({ showMobileFilters: !this.state.showMobileFilters });
  };

  closeMobileFilters = () => {
    this.setState({ showMobileFilters: false });
  };

  renderFilterControls() {
    const { filterConfig } = this.props;
    const { activeFilters } = this.state;

    if (!filterConfig) return null;

    return Object.entries(filterConfig).map(([filterKey, config]) => {
      const { label, options, type = 'checkbox' } = config;

      return html`
        <div class="gf-filter-group" key="${filterKey}">
          <h6 class="gf-filter-label">${label}</h6>
          ${options.map((option) => {
    const isActive = config.multiSelect
      ? activeFilters[filterKey]?.includes(option.value)
      : activeFilters[filterKey] === option.value;

    return html`
      <label class="gf-filter-option" key="${filterKey}-${option.value}">
        <input 
          type=${type}
          name=${filterKey}
          value=${option.value}
          checked=${isActive}
          onChange=${() => this.handleFilterChange(filterKey, option.value)}
        />
        <span>${option.label}</span>
      </label>
    `;
  })}
        </div>
      `;
    });
  }

  renderCard(item, index) {
    const { renderCard } = this.props;

    if (renderCard) {
      return renderCard(item, index);
    }

    return html`
      <div class="gf-card" key=${item.id || index}>
        <h3>${item.title || item.name || 'Untitled'}</h3>
        <p>${item.description || ''}</p>
      </div>
    `;
  }

  static renderSkeletonCard = (index) => html`
    <div class="gf-skeleton-card" key=${`skeleton-${index}`}>
      <div class="gf-skeleton-image"></div>
      <div class="gf-skeleton-content">
        <div class="gf-skeleton-title"></div>
        <div class="gf-skeleton-text"></div>
        <div class="gf-skeleton-text" style="width: 80%"></div>
        <div class="gf-skeleton-text" style="width: 60%"></div>
      </div>
    </div>
  `;

  renderResultsContent(
    loading,
    filteredData,
    noResultsMessage,
    gridColumns,
    customRenderSkeleton,
    gridLayout,
  ) {
    if (loading) {
      // Show skeleton cards based on grid columns
      const skeletonCount = gridColumns.desktop * 2; // Show 2 rows of skeletons
      const skeletonRenderer = customRenderSkeleton || GenericFilter.renderSkeletonCard;

      const gridClass = gridLayout === 'alternating' ? 'gf-grid gf-grid-alternating' : 'gf-grid';

      return html`
        <div class="${gridClass}" style=${`--gf-cols-mobile: ${gridColumns.mobile}; --gf-cols-tablet: ${gridColumns.tablet}; --gf-cols-desktop: ${gridColumns.desktop};`}>
          ${Array.from({ length: skeletonCount }, (_, i) => skeletonRenderer(i))}
        </div>
      `;
    }

    if (filteredData.length === 0) {
      return html`
        <div class="gf-no-results">
          <p>${noResultsMessage}</p>
        </div>
      `;
    }

    const gridClass = gridLayout === 'alternating' ? 'gf-grid gf-grid-alternating' : 'gf-grid';

    return html`
      <div class="${gridClass}" style=${`--gf-cols-mobile: ${gridColumns.mobile}; --gf-cols-tablet: ${gridColumns.tablet}; --gf-cols-desktop: ${gridColumns.desktop};`}>
        ${filteredData.map((item, index) => this.renderCard(item, index))}
      </div>
    `;
  }

  render() {
    const {
      title = 'Filter',
      mobilePrompt = 'Want to filter?',
      noResultsMessage = 'No results found. Please adjust your filters.',
      className = '',
      showResults = true,
      gridColumns = { mobile: 1, tablet: 2, desktop: 3 },
      loading = false,
      renderSkeleton = null,
      gridLayout = 'standard',
    } = this.props;

    const { filteredData, showMobileFilters, activeFilters } = this.state;
    const hasActiveFilters = Object.values(activeFilters).some(
      (value) => value !== null && (!Array.isArray(value) || value.length > 0),
    );

    return html`
      <div class="gf-container ${className}">
        <!-- Mobile Filter Toggle -->
        <div class="gf-mobile-toggle" onClick=${this.toggleMobileFilters}>
          <div class="gf-mobile-prompt">
            <p>${mobilePrompt}</p>
          </div>
          <div class="gf-mobile-controls">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>${title}</p>
          </div>
        </div>

        <!-- Filter Sidebar -->
        <div class="gf-sidebar ${showMobileFilters ? 'gf-sidebar-open' : ''}">
          <div class="gf-sidebar-header">
            <h5>${title}</h5>
            <button class="gf-close-btn" onClick=${this.closeMobileFilters} aria-label="Close filters">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 16 15" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.3989 6.02085L2.38849 0.0104375L0.974275 1.42465L6.98468 7.43506L0.974275 13.4455L2.38849 14.8597L8.3989 8.84927L14.4093 14.8597L15.8235 13.4455L9.81311 7.43506L15.8235 1.42465L14.4093 0.0104375L8.3989 6.02085Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
          <div class="gf-sidebar-content">
            ${this.renderFilterControls()}
            ${hasActiveFilters && html`
              <button class="gf-clear-desktop" onClick=${this.clearFilters}>
                Clear All Filters
              </button>
            `}
          </div>
          
          <div class="gf-sidebar-footer">
            ${hasActiveFilters && html`
              <button class="gf-clear-btn" onClick=${this.clearFilters}>
                Clear All
              </button>
            `}
            <button class="gf-apply-btn" onClick=${this.closeMobileFilters}>
              View Results (${filteredData.length})
            </button>
          </div>
        </div>


        <!-- Mobile Overlay -->
        ${showMobileFilters && html`
          <div class="gf-overlay" onClick=${this.closeMobileFilters}></div>
        `}

        <!-- Results Grid -->
        ${showResults && html`
          <div class="gf-results">
            ${this.renderResultsContent(loading, filteredData, noResultsMessage, gridColumns, renderSkeleton, gridLayout)}
          </div>
        `}
      </div>
    `;
  }
}

export default GenericFilter;
