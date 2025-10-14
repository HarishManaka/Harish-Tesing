/**
 * Navigation Data Store
 * Manages navigation data state and provides access methods
 * Avoids global variables by encapsulating data in a module
 */

class NavigationStore {
  constructor() {
    this.navData = null;
    this.level3DataList = [];
    this.subscribers = new Set();
  }

  // Set the main navigation data
  setNavData(data) {
    this.navData = data;
    this.notifySubscribers('navData', data);
  }

  // Get the main navigation data
  getNavData() {
    return this.navData;
  }

  // Add level 3 data to the list
  addLevel3Data(data) {
    this.level3DataList = [...this.level3DataList, data];
    this.notifySubscribers('level3Data', this.level3DataList);
  }

  // Get all level 3 data
  getLevel3DataList() {
    return this.level3DataList;
  }

  // Find level 3 data by ID
  findLevel3ById(id) {
    return this.level3DataList.find((l3) => l3 && l3.id === id) || null;
  }

  // Update navigation data with linked level 3 data
  linkNavigationData() {
    if (!this.navData) return;

    const linkItem = (item) => {
      if (!item || !Array.isArray(item.thirdLevel)) return item;
      const matchId = item.thirdLevel.find((id) => Boolean(this.findLevel3ById(id)));
      if (!matchId) return item;
      const found = this.findLevel3ById(matchId);
      return {
        ...item,
        thirdLevel: item.thirdLevel.filter((id) => id !== matchId),
        thirdLevelData: found,
      };
    };

    const linkEntry = (entry) => (!entry || !Array.isArray(entry.items)
      ? entry
      : { ...entry, items: entry.items.map(linkItem) });

    const linkNav = (dataObj) => (!dataObj || !Array.isArray(dataObj.firstLevelElements)
      ? dataObj
      : {
        ...dataObj,
        firstLevelElements: dataObj.firstLevelElements.map(linkEntry),
      });

    this.navData = linkNav(this.navData);
    this.notifySubscribers('navData', this.navData);
  }

  // Check if navigation data is available
  isNavDataReady() {
    return this.navData?.firstLevelElements?.length > 0;
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of data changes
  notifySubscribers(type, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback({ type, data });
      } catch (error) {
        console.warn('NavigationStore: Subscriber callback error:', error);
      }
    });
  }

  // Reset all data (useful for testing)
  reset() {
    this.navData = null;
    this.level3DataList = [];
    this.notifySubscribers('reset', null);
  }
}

// Create a singleton instance
const navigationStore = new NavigationStore();

export default navigationStore;
