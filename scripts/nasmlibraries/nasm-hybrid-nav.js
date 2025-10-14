// Build the submenu (Desktop and Mobile)

// TODO:
// Hide h2:after on Desktop
// Mobile behavior: add .toggled class and show hidden child(link-section-links) when h2 is clicked

// setTimeout before display:none so fade animation can run
// fade animation run on blur BG as well, so it fades before disappearing

let menuJSON = null;
let submenuJSON = null;
let submenuContent;
let submenu;
let content;
let elementsCache = {};
let menuIsHovered;
let cbData = null;
let istimer = false;
let continuityBar;

addEventListener('DOMContentLoaded', (event) => {
// Check if the custom element is already defined
  if (!customElements.get('continuity-bar')) {
    // Define the custom element
    customElements.define('continuity-bar', ContinuityBar);
  }

  if (!document.querySelector('continuity-bar')) {
    continuityBar = document.createElement('continuity-bar');
    document.body.insertBefore(continuityBar, document.body.firstChild);
  }

  // TODO:
  // All Courses Layout
  // Spec layout
  // Add 'all blah blah blah' links at bottom
  // Add ability to switch between lists & cards with a key (it's just an if/else with the builder functions)
  // Which layouts are no longer used?
  // Just need 3 and 4. We'll call that 2 and 3 now.

  submenu = document.getElementById('main-menu');
  submenuContent = document.getElementById('nasm-submenu');

  // Get JSON data here. Assume Tabs is an array.
  // DON'T fetch nasm-submenu.json until the user mouses over a menu item
  // Menu options (not submenu) are their own, much smaller, file

  checkLayout();
  window.addEventListener('resize', checkLayout);
});

function buildSubmenu(isMobile) {
  // submenuContent.innerHTML = '';

  if (menuJSON == null) {
    if ($('.continuity-bar-nav')) {
      // Find and remove any existing continuity-bar-nav
      $('.continuity-bar-nav').remove();
    }

    // fetch menu JSON (only once)
    $.getJSON('/docs/nasmlibraries/json/nasm-menu.json', (data) => {
      $.getJSON('https://www.nasm.org/docs/nasmlibraries/json/nasm-continuity-bar.json', (data2) => {
        // Get the JSON for the Continuity Bar and build it out, only if the initial menuJSON was null

        if (data.timer == true) {
          istimer = true;
        }

        // buildContinuityBar(data2, "continuity", data["timer"]);
        // const intervalID = setInterval(function() {runSlickForNav(intervalID)}, 200);
        // Passing key in manually to avoid cycling through all keys again
        // Clear out any pre-existing Continuity Bar in case resizing window. Must remove completely.
        // Also important to strip out the placeholder
        // Then rebuild it

        if (!customElements.get('continuity-bar')) {
          // Define the custom element
          customElements.define('continuity-bar', ContinuityBar);
        }

        if (!document.querySelector('continuity-bar')) {
          continuityBar = document.createElement('continuity-bar');
          document.body.insertBefore(continuityBar, document.body.firstChild);
        }

        cbData = data2;
      });

      menuJSON = data;

      createElements(isMobile, menuJSON, submenu);
    });
  } else {
    createElements(isMobile, menuJSON, submenu);
    // buildContinuityBar(cbData, "continuity", istimer);

    if (!customElements.get('continuity-bar')) {
      // Define the custom element
      customElements.define('continuity-bar', ContinuityBar);
    }

    if (!document.querySelector('continuity-bar')) {
      continuityBar = document.createElement('continuity-bar');
      document.body.insertBefore(continuityBar, document.body.firstChild);
    }
  }
}

function createElements(isMobile, menuJSON, submenu) {
  const searchDropdown = document.getElementById('search-dropdown');

  searchDropdown.addEventListener('mouseleave', () => {
    setTimeout(() => {
      // setTimeout to avoid feeling of a "hair trigger"

      document.getElementById('nav_bg_overlay').style.width = '100%';
      document.getElementById('nav_bg_overlay').style.height = '0';
      // Close search bar and set blur div height to 0 to remove blur
      // when mouse pointer leaves search bar

      $('.search-dropdown-hide').toggle();
      $('.search-wrapper').toggle();
      // Hide search bar, as well

      // TODO: very fast, slight fade
    }, 300);
  });

  const div1 = document.querySelector('#navWrapper');
  const div2 = document.querySelector('#nasm-submenu');

  div1.addEventListener('mouseleave', checkCloseSubmenu);
  div2.addEventListener('mouseleave', checkCloseSubmenu);

  function checkCloseSubmenu() {
    const isDiv1Hovered = div1.matches(':hover');
    const isDiv2Hovered = div2.matches(':hover');

    if (!isDiv1Hovered && !isDiv2Hovered) {
      hideSubmenu();
    }
  }

  if (!document.querySelector('.option')) {
    // Only build the menu if the menu options don't exist
    // No need to rebuild or re-attach event listeners

    optionContainer = document.createElement('ul');

    menuJSON.menu.forEach((option, index) => {
      let optionElement;

      if (option.visible == true) {
        optionElement = document.createElement('li');
        // Only populate with menu items that are intended to be visible

        optionElement.className = 'option';
        optionElement.classList.add(`blueMouseover-${index}`);
        optionElement.textContent = option.title;
        optionElement.dataset.index = index;
        optionContainer.appendChild(optionElement);

        if (window.innerWidth < 1440) {
          optionElement.removeEventListener('click', buildDesktopSubmenu.bind(this, optionElement, index, isClick = true));
          // Could use a curried function, but don't feel up to that level of refactoring at the moment
          // .bind will do
          // Remember the first two arguments before your params
          // Remove Desktop event listener, if it existed

          // TODO: fetch & cache submenu JSON only on first click
          optionElement.addEventListener('click', buildMobileSubmenu.bind(this, optionElement));
        } else {
          const hideOnDesktop = document.querySelector('#hideOnDesktop');
          hideOnDesktop.style = '';

          const slideoutSearch = document.querySelector('.slideout-search');
          slideoutSearch.style = '';

          const sideNav = document.querySelector('#mySidenav');
          sideNav.style = '';

          const mainMenu = document.querySelector('#main-menu');
          mainMenu.style = '';

          optionElement.removeEventListener('click', buildMobileSubmenu.bind(this, optionElement));
          // Remove mobile event listener, if it existed

          optionElement.addEventListener('mouseenter', buildDesktopSubmenu.bind(this, optionElement, index, isClick = false));
          optionElement.addEventListener('click', buildDesktopSubmenu.bind(this, optionElement, index, isClick = true));
        }
      }
    });
    submenu.appendChild(optionContainer);
  } else if (window.innerWidth >= 1440) {
    // On desktop, we may have resized from mobile
    // Options may be there, but styles need to be reset

    const sideNav = document.getElementById('mySidenav');
    sideNav.style = '';

    const search = document.querySelector('.search-wrapper-mobile');
    search.style = '';

    const slideoutSearch = document.querySelector('.slideout-search');
    slideoutSearch.style = '';

    const mobileHelpDiv = document.getElementById('hideOnDesktop');
    mobileHelpDiv.style = '';

    submenu.style = '';

    const options = document.querySelectorAll('.option');

    options.forEach((optionElement, index) => {
      optionElement.removeEventListener('click', buildMobileSubmenu);
      optionElement.addEventListener('mouseenter', buildDesktopSubmenu.bind(this, optionElement, index, isClick = false));
      optionElement.addEventListener('click', buildDesktopSubmenu.bind(this, optionElement, index, isClick = true));
    });
  }

  // const submenu = document.getElementById("main-menu");
}

function buildCards(content) {
  let allCardsDiv = '<div class="submenu-cards">';

  // Create the beginning of this div. Doing it with string concat
  // allows us to avoid creating elements/appendChild

  content.cards.forEach((card) => {
    const { badges } = card;

    if (badges !== undefined) {
      const badgeDivs = badges.map((badge) =>
      // Map the badge content to individual divs

        `<div class="product-badge">${badge}</div>`).join('');

      const currentCardDiv = `<a href=${card.url}><div class="nav__mobile--slideout--cardHeader">
                <div class="product-badges">${badgeDivs}</div>
                <div class="slideout--highlight slideout--highlight--item1 slideout--highlight-padding"><div>${card.promoText}</div></div>
            </div>
            <div>${card.header}</div></a>`;
      allCardsDiv += currentCardDiv;
      // Add the generated card div to the div containing all of the cards
    } else {
      currentCardDiv = `<a href="${card.url}"><div>
            <h4>${card.title}</h4>
            <p>${card.copy}</p>
            </div></a>`;
      allCardsDiv += currentCardDiv;
    }
  });

  if (content.layout == '2') {
    allCardsDiv += `<p class="more-courses-link-wrapper">
        <a class="more-courses-link" href="${content['more-courses-link']}">${content['more-courses-link-text']}</a>
    </p>`;
  }

  allCardsDiv += '</div>';
  // Close up the div containing all of the cards

  return allCardsDiv;
}

function addCachedElement() {

}

function renderTabContent(tab, index) {
  return new Promise((resolve) => {
    let submenuContent;

    if (window.innerWidth >= 1440) {
      // Attach direction to submenu div if on Desktop
      submenuContent = document.getElementById('nasm-submenu');

      for (const child of submenuContent.children) {
        if (child.id != `${tab.id}-tab`) {
          child.style.display = 'none';
        }
      }
    } else {
      submenuContent = document.getElementById('main-menu');
    }

    if (elementsCache[`${tab.id}-tab`] != undefined && document.getElementById(`${tab.id}-tab`) !== undefined) {
      // Will rebuild completely for mobile for now - we have to change where it's appended to anyway

      // If the element already exists in cache, use that

      const newTab = document.getElementById(`${tab.id}-tab`);

      newTab.style.display = 'block';
      // tab-# is a convention to avoid confusion, could use the number
      // as a string, but don't want it confused for an array
      // at first glance
    } else {
      // Element has not been buld - build it and cache it
      let html = '';

      switch (tab.layout) {
        case '1':
          html = renderLayout1(tab, index);

          break;
        case '2':
          html = renderLayout2(tab, index);
          break;
        case '3':

          html = renderLayout3(tab, index);

          break;
        case '4':

          html = renderLayout4(tab, index);
          break;
        default:
          html = '';
      }

      elementsCache[`${tab.id}-tab`] = html;
      // add HTML to cache object at 'tab-index'

      if (window.innerWidth < 1440) {
        submenuContent.innerHTML = html;
      } else {
        submenuContent.innerHTML += html;
      }

      resolve();
      toggleMobileOptions();
    }
  });
}

function buildSubmenuTab(optionElement, submenuJSON) {
  if (submenuJSON == null) {
    // Fallback just in case... make sure JSON is not null

    $.getJSON('/docs/nasmlibraries/json/nasm-submenu.json', (submenudata) => {
      submenuJSON = submenudata;
      const thisIndex = optionElement.getAttribute('data-index');

      renderTabContent(submenudata.tabs[`${thisIndex}`], thisIndex)
        .then(() => {
          // Code to run after rendering is complete

          const matchingTab = document.querySelectorAll(`.blueMouseover-${thisIndex}`)[1];

          const navigationEvent = new CustomEvent(`item${thisIndex}`, { detail: `item${thisIndex}-tab` });

          if (matchingTab) {
            matchingTab.addEventListener('mouseenter', (e) => {
              optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';
            });

            matchingTab.addEventListener('mouseleave', (e) => {
              optionElement.style.borderBottom = '3px solid var(--ui-color-light)';

              // Remove the border if they leave the tab
            });
          }

          document.dispatchEvent(navigationEvent);
        })
        .catch((error) => {

        });
    });
  } else {
    const thisIndex = optionElement.getAttribute('data-index');

    renderTabContent(submenuJSON.tabs[`${thisIndex}`], thisIndex)
      .then(() => {
        // Code to run after rendering is complete

        const navigationEvent = new CustomEvent(`item${thisIndex}`, { detail: `item${thisIndex}-tab` });
        // const submenuWrapper = document.getElementById("nasm-submenu");

        const matchingTab = document.querySelectorAll(`.blueMouseover-${thisIndex}`)[1];

        if (matchingTab) {
          // Stop looking for the tab
          matchingTab.addEventListener('mouseenter', (e) => {
            optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';
          });

          matchingTab.addEventListener('mouseleave', (e) => {
            optionElement.style.borderBottom = '3px solid var(--ui-color-light)';
            // Remove the border if they leave the tab
          });
        }

        document.dispatchEvent(navigationEvent);

        // TO LISTEN FOR THIS EVENT:
        // const submenuWrapper = document.getElementById("nasm-submenu");
        // submenuWrapper.addEventListener("tabRendered",
        // (e) => {
        //     /* Ã¢â‚¬Â¦ */
        // });
        // then check the detail to see which tab it was, and run code accordingly
      })
      .catch((error) => {
        console.error('Error occurred during rendering:', error);
      });
  }
}

function buildList(content) {
  let linkListDiv = '<div class="submenu-sections">';

  if (content.learn !== undefined) {
    const links = content.learn.map((link) =>
    // Map the links to paragraph tags containing links
      `<p><a href="${link.url}">${link.copy}</a></p>`).join('');

    linkListDiv += links;
    // Add the links to the div

    // // Close up the div
    linkListDiv += '</div>';
    // Close up the div

    return linkListDiv;
  }
  const linkColumns = content['link-sections'];
  // Grab the content for the columns

  linkColumns.forEach((column) => {
    // Create the column and its heading

    let linkColumn = `<div class="link-section">
            <h2>${column['heading-copy']}</h2>`;
    links = column.links.map((link) => `<a href="${link.url}">${link.copy}</a>`).join('');
    // Create the links
    linkColumn += `<div class="link-section-links">${links}</div>`;
    linkColumn += '</div>';

    linkListDiv += linkColumn;
  });

  linkListDiv += '</div>';
  // Close up the div

  return linkListDiv;
  // Add the column to the div containing the columns
}

function checkLayout() {
  // Helper function to rebuild menu for smaller breakpoints
  const blurOverlay = document.getElementById('nav_bg_overlay');
  blurOverlay.style = '';
  // Remove the blur overlay if it was active

  const searchDropdown = document.querySelector('#search-dropdown');
  searchDropdown.style.display = 'none';
  // Remove the search dropdown if it's open

  const isMobile = window.innerWidth < 1440;

  if (window.innerWidth < 1440) {
    if (submenuContent.innerHTML != '') {
      // If coming from Desktop with an open menu, close it
      document.getElementById('mySidenav').style.left = '-90%';

      // If coming from Desktop, reset the blur
      blurOverlay.style.height = '0';

      // Reset search display for mobile
      $('.search-wrapper-mobile').css('display') == 'block';
    }

    submenu = document.getElementById('main-menu');
    submenu.innerHTML = '';
    submenuContent = document.getElementById('nasm-submenu');
    submenuContent.innerHTML = '';

    elementsCache = {};
    // for (const child of submenuContent.children) {
    //     child.innerHTML = '';
    //     child.style.display = "none";
    //   }

    // Clear existing innerHTML for mobile and reset styles

    if (document.querySelector('.submenu-panels') == null || document.querySelector('.slideout-close-button-mobile') !== null) {
      // Make sure we haven't just changed to a different tab on mobile
      // by checking for a div that exists only on tabs

      buildSubmenu(window.innerWidth < 1440);
    }
  } else {
    submenu = document.getElementById('main-menu');
    submenu.innerHTML = '';
    submenuContent = document.getElementById('nasm-submenu');
    submenuContent.innerHTML = '';
    elementsCache = {};
    buildSubmenu(window.innerWidth < 1440);

    // Just build it on desktop
  }
}

//* ************ LAYOUTS ***************/
function renderLayout1(content, index) {
  // Create the HTML for submenu layout 1
  // Drop in the content
  // TODO: correct the notation for the form of the content that's passed in

  const allCardsDiv = buildCards(content);

  const linkListDiv = buildList(content);

  const submenuHTML = `
            <div id="${content.id}-tab" class="blueMouseover-${index}" data-index="${index}">
                <div class="mobile-close-controls">
                    <p class="slideout-close-button-mobile" onClick="closeSideMenu()">Back</p>
                    <div class="close-nav-desktop" onClick="hideSubmenu()">X</div>
                </div>
                      
                <section>
                    <h2 class="mobile-nav-header fade-in hideOnDesktop">${content['promoHeader-mobile']}</h2>
                    <p class="mobile-nav-header fade-in hideOnDesktop">${content['promoCopy-mobile']}</p> 
                    <a class="mobile-nav-header fade-in hideOnDesktop" href="${content['learn-more-link']}">${content['learn-more-copy-mobile']}</a>
                    <div class="submenu-panels fade-in">
                            
                        <div id="submenu-cards" class="${content.id}-cards">
                            <h2>${content.title}</h2>
                            ${allCardsDiv}
                            <p class="more-courses-link-wrapper">
                                <a class="more-courses-link" href="${content['more-courses-link']}">${content['more-courses-link-text']}</a>
                            </p>
                        </div>
                        <div id="submenu-links" class="${content.id}-links">
                            <h2>${content.title2}</h2>
                            ${linkListDiv}
                        </div>
                        <div id="submenu-image" class="${content.id}-image">
                                <img src="${content.image}" />
                        </div>
                        <section class="nav__mobile--slideout--header">
                            <h2 class="hideOnMobile">${content['promoHeader-desktop']}</h2>
                            <p class="hideOnMobile">${content['promoCopy-desktop']}</p>
                            <a class="hideOnMobile" href="${content['learn-more-link']}">${content['learn-more-copy-desktop']}</a>
                        </section>
                    </div>
                </section>
                  
            </div>
    `;
  return submenuHTML;
}

function renderLayout2(content, index) {
  // Create the HTML for submenu layout 2
  // This used to be Layout 3
  // Maybe a slightly different card building function, since the cards have different content
  // OR if it has no .badges key (result is undefined), we know it's a different card

  const allCardsDiv = buildCards(content);

  const submenuHTML = `
            <div id="${content.id}-tab" class="blueMouseover-${index}" data-index="${index}">
                <div class="mobile-close-controls">
                    <p class="slideout-close-button-mobile" onClick="closeSideMenu()"Back</p>
                    <div class="close-nav-desktop" onClick="hideSubmenu()">X</div>
                </div>
                      
                <section>
                    <h2 class="mobile-nav-header hideOnDesktop">${content['promoHeader-mobile']}</h2>
                    <p class="mobile-nav-header hideOnDesktop">${content['promoCopy-mobile']}</p> 
                    <a class="mobile-nav-header hideOnDesktop" href="${content['learn-more-link']}">${content['learn-more-copy-mobile']}</a>
                    <div class="submenu-panels fade-in">
                            
                        <div id="submenu-cards" class="${content.id}-cards">
                            <h2>${content.title}</h2>
                            <div class="allCardsDiv-${index}">${allCardsDiv}</div>
                        </div>
                       
                        <div id="submenu-image" class="${content.id}-image">
                            <img src="${content.image}" />
                        </div>  
                        <section class="nav__mobile--slideout--header">
                            <h2 class="hideOnMobile">${content['promoHeader-desktop']}</h2>
                            <p class="hideOnMobile">${content['promoCopy-desktop']}</p>
                            <a class="hideOnMobile" href="${content['learn-more-link']}">${content['learn-more-copy-desktop']}</a>
                        </section>
                    </div>
                </section>
                  
            </div>
    `;

  return submenuHTML;
}

function renderLayout3(content, index) {
  // Create the HTML for submenu layout 3
  // Resources tab

  const linkListDiv = buildList(content);

  const submenuHTML = `
            <div id="${content.id}-tab" class="blueMouseover-${index}" data-index="${index}">
                <div class="mobile-close-controls">
                    <p class="slideout-close-button-mobile" onClick="closeSideMenu()">Back</p>
                    <div class="close-nav-desktop" onClick="hideSubmenu()">X</div>
                </div>
                      
                <section id="submenu-cards">
                    <h2 class="mobile-nav-header hideOnDesktop">${content['promoHeader-mobile']}</h2>
                    <p class="mobile-nav-header hideOnDesktop">${content['promoCopy-mobile']}</p> 
                    <a class="mobile-nav-header hideOnDesktop" href="${content['learn-more-link']}">${content['learn-more-copy-mobile']}</a>
                    <div class="submenu-panels">
                            
                    <div class="link-section-columns">${linkListDiv}</div>
                    </div>
                </section>
                  
            </div>
    `;
  return submenuHTML;
}

function renderLayout4(content, index) {
  // Create the HTML for submenu layout 4
  // SINGLE LINK layout, NO submenu
  // Drop in the content

  const submenuHTML3 = '';

  // TODO: Add anchor tag around the menu item
}

function buildMobileSubmenu(optionElement) {
  if (window.innerWidth < 1440) {
    document.querySelector('.slideout-search').style.display = 'none';
    const needHelp = document.getElementById('hideOnDesktop');
    // Need to hide the "Need Help?" section
    needHelp.classList.add('fade-out');

    setTimeout(() => {
      needHelp.style.display = 'none';
      needHelp.classList.remove('fade-out');
    });

    if (submenuJSON == null) {
      $.getJSON('/docs/nasmlibraries/json/nasm-submenu.json', (submenudata) => {
        submenuJSON = submenudata;
        buildSubmenuTab(optionElement, submenuJSON);
      });
    } else {
      submenu = document.getElementById('main-menu');
      submenu.innerHTML = '';
      // Temp: clear innerHTML
      // TODO: Replace with appropriate animation
      buildSubmenuTab(optionElement, submenuJSON);
    }
  }
}

function buildDesktopSubmenu(optionElement, index, isClick) {
  const hideOnDesktop = document.querySelector('#hideOnDesktop');
  hideOnDesktop.style = '';

  const slideoutSearch = document.querySelector('.slideout-search');
  slideoutSearch.style = '';

  const sideNav = document.querySelector('#mySidenav');
  sideNav.style = '';

  setTimeout(() => {
    const blurOverlay = document.querySelector('#nav_bg_overlay');
    blurOverlay.style.height = '100vh';
    blurOverlay.style.width = '100%';
    document.querySelector('.search-dropdown-hide').style = '';
  }, 300);

  const matchingTab = document.querySelectorAll(`.blueMouseover-${index}`)[1];
  if (matchingTab) {
    matchingTab.addEventListener('mouseenter', (e) => {
      // optionElement.style.borderBottom = "2px solid var(--brand-color-turquoise)";
      optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';
    });

    matchingTab.addEventListener('mouseleave', (e) => {
      setTimeout(() => {
        // optionElement.style.borderBottom = "2px solid var(--ui-color-light)";
        optionElement.style.borderBottom = '3px solid var(--ui-color-light)';
      }, 200);
    });
  }

  // optionElement.style.borderBottom = "2px solid var(--brand-color-turquoise)";
  optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';

  optionElement.addEventListener('mouseenter', (e) => {
    // optionElement.style.borderBottom = "2px solid var(--brand-color-turquoise)";
    optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';
  });

  optionElement.addEventListener('mouseleave', (e) => {
    optionElement.style.borderBottom = '3px solid var(--ui-color-light)';
  });

  if (submenuJSON == null) {
    $.getJSON('/docs/nasmlibraries/json/nasm-submenu.json', (submenudata) => {
      submenuJSON = submenudata;

      buildSubmenuTab(optionElement, submenuJSON);
    });
  } else {
    const thisIndex = optionElement.getAttribute('data-index');

    optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';

    renderTabContent(submenuJSON.tabs[`${thisIndex}`], thisIndex)
      .then(() => {
        const navigationEvent = new CustomEvent(`item${thisIndex}`, { detail: `item${thisIndex}-tab` });

        const matchingTab = document.querySelectorAll(`.blueMouseover-${thisIndex}`)[1];

        matchingTab.addEventListener('mouseenter', (e) => {
          // optionElement.style.borderBottom = "2px solid var(--brand-color-turquoise)";
          optionElement.style.borderBottom = '3px solid var(--brand-color-turquoise)';
        });

        matchingTab.addEventListener('mouseleave', (e) => {
          setTimeout(() => {
            // optionElement.style.borderBottom = "2px solid var(--ui-color-light)";
            optionElement.style.borderBottom = '3px solid var(--ui-color-light)';
          }, 200);
        });

        document.dispatchEvent(navigationEvent);
        toggleMobileOptions();
      })
      .catch((error) => {
        console.error('Error occurred during rendering:', error);
      });
  }
}

function toggleMobileOptions() {
  // Code for Resources Dropdown, DRY up later
  console.log('ran mobile options');

  const resourcesLinks = document.querySelectorAll('.link-section h2');

  if (resourcesLinks !== null) {
    resourcesLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const linkChild = link.nextElementSibling;

        if (linkChild.style.display !== 'block') {
          linkChild.style.display = 'block';
        } else {
          linkChild.style.display = 'none';
        }
      });
    });
  }

  const resourceCarats = document.querySelectorAll('.link-section h2:after');
  console.log('resourceCarats', resourceCarats);

  if (resourceCarats !== null) {
    resourceCarats.forEach((link) => {
      link.addEventListener('click', (e) => {
        const linkChild = link.nextElementSibling;

        if (linkChild.style.display !== 'block') {
          linkChild.style.display = 'block';
        } else {
          linkChild.style.display = 'none';
        }
      });
    });
  }
}

function hideH2s(e) {
  const content = e.target.nextElementSibling;
  // Get the sibling p tag of just the target
  if (e.target.classList.contains('toggled')) {
    e.target.classList.remove('toggled');
    content.style.display = 'none';
  } else {
    e.target.classList.add('toggled');
    content.style.display = 'block';
  }
}

function hideSubmenu() {
  document.getElementById('nav_bg_overlay').style.width = '100%';

  submenuContent.classList.add('fade-out');
  // Add fadeout animaton class

  setTimeout(() => {
    document.getElementById('nav_bg_overlay').style.height = '0';
    for (const child of submenuContent.children) {
      child.style.display = 'none';
    }
    submenuContent.classList.remove('fade-out');
  }, 160);
}

function runSlickForNav(intervalID) {
  clearInterval(intervalID);

  $('.continuity-bar-nav').slick({
    speed: 500,
    autoplay: true,
    infinite: true,
    draggable: true,
    vertical: true,
    verticalSwiping: true,
    autoplaySpeed: 6000,
    pauseOnHover: false,
    pauseOnFocus: false,
    touchMove: false,
  });
}

const _second = 1000;
const _minute = _second * 60;
const _hour = _minute * 60;
const _day = _hour * 24;

function showRemaining(data, auth, key) {
  let end;

  if (auth) {
    end = new Date(`${data['auth-date']} 12:00 AM`);
  } else {
    end = new Date(`${data['unauth-date']} 12:00 AM`);
  }

  const now = new Date();
  let distance = end - now;

  if (distance < 0) {
    distance = 0; // Set distance to 0 if it's negative

    // document.getElementById('countdown').innerHTML = 'EXPIRED!';

    // Used class rather than ID because having difficulty grabbing IDs of injected elements but not classes
    $('.continuity-countdown').html('');

    return;
  }
  const days = Math.floor(distance / _day);
  const hours = Math.floor((distance % _day) / _hour);
  let totalhours;
  if (days > 0) {
    totalhours = Math.floor(days * 24 + hours);
  } else {
    totalhours = hours;
  }
  const minutes = Math.floor((distance % _hour) / _minute);
  const seconds = Math.floor((distance % _minute) / _second);

  $(`.${key} .continuity-countdown`).html(`<span class="continuity-countdown-numbers"><p>${totalhours}</p><p>hrs</p></span> <span class="continuity-countdown-numbers"><p>${minutes}</p><p>min</p></span> <span class="continuity-countdown-numbers"><p>${seconds}</p><p>sec</p></span>`);
  setTimeout(showRemaining, 1000, data, auth, key);
}
