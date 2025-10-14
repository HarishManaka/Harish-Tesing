// Atlas Engine searches for 'Atlas' in data-atlas attributes

// AJAX calls (getScript) because Sitefinity does not allow to declare script type as module
// Appending script tag does not work (it comes through as wrong MIME type)

// 1. Promo
// 2. Hubspot section

$(() => {
  runAtlas();
  // Run Atlas for the first time on the page

  console.log('Setting up atlas content event listener'); // Log to confirm event listener setup
  document.body.addEventListener('additionalAtlasContentLoaded', (e) => {
    console.log('Atlas content event detected'); // Log when the event is detected
    runAtlas();
  });

  function runAtlas() {
    console.log('ran Atlas');
    // Check to see if anything is using Atlas (if data-atlas string contains the word 'atlas')
    // TODO: This is redundant, the tag itself indicates we're using atlas. Remove and just look for the tag?
    const containsAtlas = $('[data-atlas*="atlas"]');

    if (containsAtlas !== undefined && containsAtlas.length > 0) {
      // Support for arbitrary JSON files
      // Use promo-dev.js for testing
      const atlasContent = $('[data-atlas]');
      const atlasPromos = [];
      let promoKeyword;

      $.getScript('/docs/nasmlibraries/js/atlas/promo/promo.js', (data) => {
        // const regex = /\b(promo-product)\b/
        // Regex to see if it's the 'promo' keyword
        // We'll look specifically for promo-product in this case

        $(atlasContent).each(function () {
          const atlasString = $(this).attr('data-atlas');

          const promoKeywordArray = atlasString.split('-');
          promoKeyword = promoKeywordArray[1];

          // if (!promoKeyword.match(regex)) {
          // the keyword will be the 2nd item in the array returned from splitting the string
          // if it isn't the 'promo' keyword...
          // currentDataId = $(this).attr("data-atlas");

          // Otherwise, push into the array of promos that will use the new Atlas JSON (this is the default)
          atlasPromos.push(atlasString);
          // }
        });
        promo(atlasPromos, promoKeyword);
      });
    }
  }
});
