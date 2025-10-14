$(document).ready(() => {
  // Mobile Filter Menu Open
  const filterToggleOpen = $('#crc-filter-panel-toggle');

  $(filterToggleOpen).on('click', () => {
    $('#crc-filter').css({
      right: '0',
      opacity: '1',
    });
    $('#filter-menu-overlay').css({
      position: 'fixed',
      width: '100%',
      height: '100%',
    });
    $('body').css({
      overflow: 'hidden',
    });
  });

  // Mobile Filter Menu Close
  $('#crc-mobile-filter-toggle, #crc-view-filter-results').on('click', () => {
    $('#crc-filter').css({
      right: '-90%',
      opacity: '0',
    });
    $('#filter-menu-overlay').css({
      width: '0',
      height: '0',
    });
    $('body').css({
      overflow: 'auto',
    });
  });

  // Clear Checked Filters
  $('#crc-clear-filter-results').on('click', () => {
    $('.crc-filter-menu .crc-filter-item label input.filter-option[type="checkbox"]').prop('checked', false);
    $('div.crc-resource-list-category[data-item]').removeClass('crc-hide-category');
  });

  /* Start of Resource Center Main Page JSON */

  // Position Stands JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-position-stands.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=position-stands]');
      for (let i = 0; i < json.length; ++i) {
        // anchorClass: Determines the class of the anchor tag based on the itemLocked property.
        const anchorClass = json[i].itemLocked ? 'sub-locked' : 'sub-unlocked';

        // anchorText: Sets the text of the anchor tag based on the itemLocked property.
        const anchorText = json[i].itemLocked ? 'Subscribe to unlock' : 'Download Now';

        // anchorHref: Sets the href of the anchor tag based on the itemLocked property.
        const anchorHref = json[i].itemLocked ? json[i].lockedHref : json[i].itemHref;

        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank" data-locked="${json[i].itemLocked}"><div class="resource-list-item-img"><span class="resource-item-tag"><p>${json[i].itemTag}</p></span><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${anchorHref}" target="_blank" class="${anchorClass} download-now-link">${json[i].itemLocked ? '<img src="/images/nasmlibraries/nasm-resource-center/lock-icon.png" />' : ''}${anchorText}</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Free Mini Courses JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-free-mini-courses.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=free-mini-courses]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Free Guides JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-free-guides.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=free-guides]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Free Webinars JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-free-webinars.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=free-webinars]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Watch Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Calculators JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-calculators.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=calculators]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">View Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Podcast JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-podcast.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=podcast]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Listen Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Assessment Forms JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-assessment-forms.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=assessment-forms]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Programming Templates JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-programming-templates.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=programming-templates]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Blog JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-blog.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=blog]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Read Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  /* End of Resource Center Main Page JSON */

  /* Start of Resource Center Category Pages JSON */

  // Free Mini Courses LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-free-mini-courses-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=free-mini-courses-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Free Guides LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-free-guides-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=free-guides-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Free Webinars LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-free-webinars-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=free-webinars-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Watch Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Calculators LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-calculators-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=calculators-lp]');
      for (let i = 0; i < json.length; ++i) {
        $(contentContainer).append(`<div class="crc-resource-list-item crc-half-width-item" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">View Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Podcast LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-podcast-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=podcast-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Listen Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Assessment Forms LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-assessment-forms-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=assessment-forms-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Programming Templates LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-programming-templates-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=programming-templates-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Download Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  // Blog LP JSON
  $.ajax({
    url: '/docs/nasmlibraries/json/nasm-resource-center-database/nasm-crc-blog-lp.json',
    dataType: 'text',
    success(data) {
      const json = $.parseJSON(data);
      const contentContainer = $('.crc-resource-list-category[data-item=blog-lp]');
      for (let i = 0; i < json.length; ++i) {
        // Determine if the current item is within the first two of a set of 8
        const isHalfWidth = i % 8 === 0 || i % 8 === 1;
        // Add the 'crc-half-width-item' class to the first two items of every set of 8
        const additionalClass = isHalfWidth ? ' crc-half-width-item' : '';
        $(contentContainer).append(`<div class="crc-resource-list-item${additionalClass}" data-category="${json[i].itemCategory}" data-href="${json[i].itemHref}" data-target="_blank"><div class="resource-list-item-img"><img src="${json[i].itemImg}" /></div><div class="resource-list-item-content"><h3>${json[i].itemTitle}</h3><p>${json[i].itemExcerpt}</p><div class="resource-list-item-meta"><a href="${json[i].itemHref}" class="download-now-link">Read Now</a><span class="resource-item-type">${json[i].itemPill}</span></div></div>`);
      }
    },
  });

  /* End of Resource Center Category Pages JSON */
});

// Mobile sticky filter bar
let isSticky = false;

window.addEventListener('scroll', () => {
  const stickySection = document.getElementById('crc-filter-sticky');
  const stickySectionAbove = document.querySelector('.crc-featured-resources');
  const stickyPosition = stickySectionAbove.offsetTop + stickySectionAbove.offsetHeight;
  if (window.scrollY > stickyPosition && !isSticky) {
    stickySection.classList.add('filter-sticky');
    isSticky = true;
  } else if (window.scrollY <= stickyPosition && isSticky) {
    stickySection.classList.remove('filter-sticky');
    isSticky = false;
  }
});

/* Hide/Show Filter Main Page Categories based on which checkbox is checked */
function toggleCRCfilterCategory() {
  // Selects all the checkboxes and divs with the appropriate selectors.
  const checkboxes = document.querySelectorAll('input.filter-option[type="checkbox"]:checked');
  const divs = document.querySelectorAll('div.crc-resource-list-category[data-item]');

  // Empty array checkedValues is created to store the values of the checked checkboxes.
  const checkedValues = [];

  // Loops through all the checkboxes and checks if they are checked.
  // If a checkbox is checked, its value is added to the checkedValues array.
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      checkedValues.push(checkboxes[i].value);
      console.log(checkedValues);
    }
  }

  // Looks into the checkValues array and stores selected values into 'valuesToCheck' variable
  // If any of the 'valuesToCheck' are checked, hide .crc-resource-list-form, if not, show it
  const valuesToCheck = ['calculators', 'podcast', 'assessment-forms', 'programming-templates', 'blog'];
  const shouldHide = checkedValues.some((value) => valuesToCheck.includes(value));

  if (shouldHide) {
    $('.crc-resource-list-form').hide();
  } else {
    $('.crc-resource-list-form').show();
  }

  // If none of the checkboxes are checked (checkedValues array has a length of zero),
  // remove the class crc-hide-category from all the divs.
  if (checkedValues.length === 0) {
    for (var i = 0; i < divs.length; i++) {
      divs[i].classList.remove('crc-hide-category');
    }
  } else {
    for (var i = 0; i < divs.length; i++) {
      const value = divs[i].getAttribute('data-item');
      if (checkedValues.includes(value)) {
        divs[i].classList.remove('crc-hide-category');
      } else {
        divs[i].classList.add('crc-hide-category');
      }
    }
  }
}

/* Hide/Show Filter Landing Page Categories based on which checkbox is checked */
$('input.filter-option[type="checkbox"]').attr('checked', false);

const $filterCheckboxes = $('input.filter-option[type="checkbox"]');

$filterCheckboxes.on('change', () => {
  const selectedFilters = {};

  $filterCheckboxes.filter(':checked').each(function () {
    if (!selectedFilters.hasOwnProperty(this.name)) {
      selectedFilters[this.name] = [];
    }
    selectedFilters[this.name].push(this.value);
  });

  // create a collection containing all of the filterable elements
  const $filterableResults = $('div.crc-resource-list-category .crc-resource-list-item[data-category]');

  // variable to keep track of items that match the filter
  let $matchedResults = $();

  // Check if any filters are selected
  const anyFiltersSelected = Object.keys(selectedFilters).length > 0;

  // If no filters are selected, show all items
  if (!anyFiltersSelected) {
    $matchedResults = $filterableResults;
  } else {
    // loop over the selected filter name -> (array) values pairs
    $.each(selectedFilters, (name, filterValues) => {
      // filter each .crc-resource-list-item element
      $filterableResults.each(function () {
        const currentFilterValues = $(this).data('category').split(' ');
        const matched = currentFilterValues.some((currentFilterValue) => $.inArray(currentFilterValue, filterValues) !== -1);

        // if matched is true, add the current .crc-resource-list-item element to the collection of matched results
        if (matched) {
          $matchedResults = $matchedResults.add(this);
        }
      });
    });
  }

  // Show all results if no filters are selected, otherwise show matched results
  if (!anyFiltersSelected) {
    $filterableResults.show();
    $('div.crc-resource-list-category .crc-resource-list-no-results').hide();
  } else {
    // Show matched results and hide all others
    $filterableResults.hide();
    $matchedResults.show();

    // If filters are selected but no matches are found, show 'no results' message
    if ($matchedResults.length === 0) {
      $('div.crc-resource-list-category .crc-resource-list-no-results').show();
    } else {
      // If filters are selected and matches are found, hide 'no results' message
      $('div.crc-resource-list-category .crc-resource-list-no-results').hide();
    }
  }

  // Removes .crc-half-width-item class from all items before executing the .slice methods
  $('div.crc-resource-list-category .crc-resource-list-item[data-category]').removeClass('crc-half-width-item');

  // After filtering, apply the class to the first two matched elements
  $matchedResults.slice(0, 2).addClass('crc-half-width-item');
  $matchedResults.slice(8, 10).addClass('crc-half-width-item');
});
