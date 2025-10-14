const mediaQuery1920 = window.matchMedia('(min-width: 1920px)');
const mediaQuery1440 = window.matchMedia('(min-width: 1440px)');
const mediaQuery1024 = window.matchMedia('(min-width: 1024px)');
const mediaQuery768 = window.matchMedia('(min-width: 768px)');
const mediaQuery375 = window.matchMedia('(min-width: 375px)');

// Get the elements
const playButton = document.querySelector('.nasm-play-button');
const playButtonHover = document.querySelector('.nasm-play-button-hover');
const playButtonCircle = document.querySelector('.nasm-play-button-circle');
const playButtonBorder = document.querySelector('.nasm-play-button-border');
const pdpHeroGif = document.querySelector('.pdp-gif-hero');
const videoOverlay = document.querySelector('.video-overlay');

$(document).ready(() => {
  $('.pdp-hero-slider-container').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2500,
    arrows: false,
    dots: true,
    dotsClass: 'pdp-hero-pager',
    pauseOnHover: true,
    pauseOnDotsHover: true,
    responsive: [
      {
        breakpoint: 767,
        settings: {
          autoplay: false,
        },
      },
    ],
  });
  $('.testimonials-slider').slick({
    centerMode: true,
    centerPadding: '45px',
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2500,
    arrows: true,
    dots: true,
    pauseOnHover: false,
    arrowsPlacement: 'split',
    responsive: [
      {
        breakpoint: 3840,
        settings: {
          centerMode: true,
          centerPadding: '158px',
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 1920,
        settings: {
          centerMode: true,
          centerPadding: '158px',
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 1440,
        settings: {
          centerMode: true,
          centerPadding: '90px',
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          centerMode: true,
          centerPadding: '180px',
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 767,
        settings: {
          autoplay: false,
          centerMode: true,
          centerPadding: '90px',
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 520,
        settings: {
          autoplay: false,
          centerMode: true,
          centerPadding: '45px',
          slidesToShow: 1,
        },
      },
    ],
  });
});

/// ///////////////////////////////
// Logic below is for Vimeo Videos
/// ///////////////////////////////

if (!vimeoPlayer) {
  var vimeoPlayer = null;
}

if (playButton) {
  playButton.addEventListener('click', () => { togglePlayPause(); });
}

function togglePlayPause() {
  vimeoPlayer
    .getPaused()
    .then((paused) => {
      if (paused) {
        playVideo(vimeoPlayer);
      } else {
        pauseVideo(vimeoPlayer);
      }
    })
    .catch((error) => {
      console.error('Error checking video state:', error);
    });
}

function playVideo(video) {
  video
    .play()
    .then(() => {
      // Video started
      playButton.style.display = 'none';
      playButtonHover.style.display = 'none';
      if (pdpHeroGif) {
        pdpHeroGif.style.display = 'none';
      }
      video.setVolume(0.25);
    })
    .catch((error) => {
      // An error occurred
      console.log(error);
    });
}

function pauseVideo(video) {
  video
    .pause()
    .then(() => {
      // Video started
      playButton.style.display = 'flex';
      playButtonHover.style.display = 'block';
    })
    .catch((error) => {
      // An error occurred
      console.log(error);
    });
}

if (vimeoPlayer) {
  vimeoPlayer.on('play', () => {
    // When the video is played
    playButton.style.display = 'none';
    playButtonHover.style.display = 'none';
    if (pdpHeroGif) {
      pdpHeroGif.style.display = 'none';
    }
  });

  vimeoPlayer.on('pause', () => {
    // When the video is paused
    playButton.style.display = 'flex';
    playButtonHover.style.display = 'block';
  });
}

/// ///////////////////////////////
// Logic above is for Vimeo Videos
/// ///////////////////////////////

// Bind click event to the .pdp-hero-pager-play element
$('.pdp-hero-pager-play').click(() => {
  // Jump to the first slide (index 0)
  $('.pdp-hero-slider-container').slick('slickGoTo', 0);
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initializePager();
  }, 1250); // 1.25 seconds
});

function initializePager() {
  // Select elements
  const heroCarousel = document.querySelector(
    '.pdp-hero-slider-container .slick-list .slick-track',
  );

  // Set variables
  let heroCarouselSet = new Set();
  let heroSlideCount = heroCarouselSet.size;

  // Checks for true slides. Slick adds extra elements intermittently, and some are clones.
  function heroCheckSlide() {
    heroCarouselSet = new Set();
    if (heroCarousel != null && heroCarousel != undefined) {
      for (const child of heroCarousel.children) {
        if (!child.getAttribute('class').includes('slick-cloned')) {
          heroCarouselSet.add(child.children[0].children[0].children);
        }
      }
    }
    heroSlideCount = heroCarouselSet.size;
  }

  heroCheckSlide();

  // Find all elements with the pdp-thumbnail class
  const thumbnailElements = [];

  heroCarouselSet.forEach((value) => {
    for (let i = 0; i < value.length; i++) {
      if (value[i].getAttribute('class').includes('pdp-thumbnail')) {
        thumbnailElements.push(value[i]);
      }
    }
  });

  // Find the pdp-hero-pager li elements
  const pagerLiElements = document.querySelectorAll('.pdp-hero-pager li');
  if (thumbnailElements.length > 0 && pagerLiElements.length > 0) {
    // Loop through each thumbnail element
    thumbnailElements.forEach((thumbnailElement, index) => {
      // Get the src attribute value from the thumbnail image
      const thumbnailImageSrc = thumbnailElement.getAttribute('src');

      // Update the background image of the corresponding pager li element
      if (pagerLiElements[index]) {
        pagerLiElements[index].style.backgroundImage = `url('${thumbnailImageSrc}')`;
        pagerLiElements[index].style.backgroundSize = 'cover';
        pagerLiElements[index].style.backgroundPosition = 'center';

        if (thumbnailImageSrc.includes('gif')) {
          // Create the play button element
          const playButtonElement = document.createElement('img');
          playButtonElement.src = '/images/nasmlibraries/pages/pdp-page/play-button.png';
          playButtonElement.alt = 'Play Button';
          playButtonElement.className = 'pdp-hero-pager-play';

          // Append the play button element to the pager li element
          pagerLiElements[index].appendChild(playButtonElement);
        }
      }
    });
  }
}

// Check if the browser window is maximized or minimized
function isBrowserMaximized() {
  // Usage
  if (videoOverlay) {
    if (mediaQuery1024.matches || vimeoVideoiFrame.offsetWidth >= 600) {
      videoOverlay.style.display = 'none';
    } else {
      videoOverlay.style.display = 'block';
    }
  }
}

if (vimeoPlayer) {
  //* ***************************************
  // JS - PROGRESS BAR TESTIMONIALS
  //* ***************************************
  // Initialize Progress Bar on load
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initializeProgressBar2();
      isBrowserMaximized();
    }, 2000);
  });

  // Initialize Progress Bar on resize
  window.addEventListener('resize', () => {
    setTimeout(() => {
      initializeProgressBar2();
      isBrowserMaximized();
    }, 2000);
  });

  function initializeProgressBar2() {
    // Select elements
    const carousel = document.querySelector(
      '.pdp-hero-slider-container .slick-list .slick-track',
    );
    const progressBar = document.querySelector('.slick-dots');

    // If both elements are not found, exit the function
    if (!carousel && !progressBar) {
      return;
    }

    // Set variables for all slides
    let currentSlide = 0;
    let carouselSet = new Set();
    let slideCount = carouselSet.size;

    // Checks for TRUE slide count. Slick adds extra elements intermittently, and some are clones.
    function checkSlideCount2() {
      carouselSet = new Set();
      if (carousel != null && carousel != undefined) {
        for (const child of carousel.children) {
          if (!child?.getAttribute('class')?.includes('slick-cloned')) {
            carouselSet.add(child.getAttribute('aria-label'));
          }
        }
      }
      slideCount = carouselSet.size;
    }

    // Check what slide Slick is currently displaying
    function checkCurrentSlide2() {
      checkSlideCount2();

      // Find the slide that is currently centered in the carousel
      if (carousel != null && carousel != undefined) {
        for (const child of carousel.children) {
          const slickIndex = child.getAttribute('data-slick-index');

          // If slide is (centered) and is not a clone, update to current slide
          if (
            child?.getAttribute('class')?.includes('slick-active')
            && !child?.getAttribute('class')?.includes('slick-cloned')
          ) {
            currentSlide = parseInt(slickIndex) + 1;
          }
        }
      }

      if (currentSlide != 1) {
        pauseVideo(vimeoPlayer);
      }
    }

    checkSlideCount2();

    // Automatic check slide change (adjust the interval as needed) check slide every 1 seconds
    setInterval(checkCurrentSlide2, 1000);
  }
}

jQuery(document).ready(($) => {
  const gatedContentOverlayStyles = '<style>/************************'
    + '  Mobile and up view'
    + '*************************/'
    + '#overlayForm { position: relative; z-index: 10; margin: 0 auto; width: 75%; }'
    + '#gatedcontentform { display: none; position: absolute; top: 0; left: 0; width: 100%; max-width: 500px; height: 100%; overflow: hidden; z-index: 2; padding: 0 25px; }'
    + '#videoOverLay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100000; text-align: center;     background: rgba(0, 0, 0, .9); }'
    + '#videoOverLayBG {'
    + '    background-image: url(/images/2020/pages/ces-product-page/gated-mobile-background.png?sfvrsn=a127cb3_2);'
    + '    position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;'
    + '}'
    + '#videoOverlayiFrame { position: relative; z-index: 2; }'
    + '#overlayForm .hs-input { background-color: rgba(255, 255, 255, .40); color: #fff; }'
    + 'div.gatedcontenthead p { color: #ffffff; font-size: 20px !important; }'
    + 'div.gatedcontenthead p span { color:#ffffff; font-size: 16px !important; }'
    + '#overlayForm .hs-button { border: none; width: 136px; margin-top: 23px !important; background-color: #DD3533; }'
    + '#overlayForm .hs-button:hover { background-color: #F5403E;}'
    + '#videoOverlayCloser {'
    + '    position: relative; z-index: 100; color: #fff; font-weight: 400; text-align: right;'
    + '    padding: 0 5px 0 0; margin: 0; font-size: 30px !important; cursor: pointer; display:none;'
    + '}'
    + '#gatedContentFormSkip { position:absolute; width:100%; text-align:right; bottom:-60px; right:10px; cursor:pointer; }'
    + '#gatedContentFormSkip p {'
    + '    background:url(https://www.nasm.org/images/2020/gated-content/video-skip.png?sfvrsn=18e27db3_2) center right no-repeat;'
    + '    padding-right:40px; font-family:Roboto, sans-serif; color:#ffffff; font-size:20px !important; font-weight:400; line-height:1.3;'
    + '}'
    + '#overlayForm ul.no-list.hs-error-msgs.inputs-list { list-style: none; margin: -15px 0 0 0; padding: 0; }'
    + '#overlayForm ul.no-list.hs-error-msgs.inputs-list li { font-size: 12px !important; }'
    + '#overlayForm ul.no-list.hs-error-msgs.inputs-list li label { color: red; }'
    + '#overlayForm div.hs-form-field div.input { margin-right: 0 !important; }'
    + '#overlayForm input.hs-input::-webkit-input-placeholder { /* Chrome/Opera/Safari */ color: #ffffff; }'
    + '#overlayForm input.hs-input::-moz-placeholder { /* Firefox 19+ */ color: #ffffff; }'
    + '#overlayForm input.hs-input:-ms-input-placeholder { /* IE 10+ */ color: #ffffff; }'
    + '#overlayForm input.hs-input:-moz-placeholder { /* Firefox 18- */color: #ffffff;}'
    + '#overlayForm div.input input.hs-input { margin: 0; width: 100% !important; }'
    + '#overlayForm input.hs-button { margin-top: 0px; }'
    + 'div.gatedcontenthead { margin-top: 15px; }'
    + 'div.gatedcontenthead p { margin: 0; color:#ffffff; font-size: 20px !important; font-weight: 700; line-height: 1; }'
    + '/************************'
    + '  Small Tablet and up view'
    + '*************************/'
    + '@media only screen and (min-width: 768px) {'
    + '    #overlayForm { width: 600px; }'
    + '    div.gatedcontenthead p { font-size: 31px !important; }'
    + '    fieldset { max-width: inherit !important; }'
    + '    #overlayForm fieldset.form-columns-2 .hs-form-field { width: 100% !important; float: none !important; }'
    + '    #gatedContentFormSkip { bottom:0; }'
    + '}'
    + '/************************'
    + '  Large Tablet and up view'
    + '*************************/'
    + '@media only screen and (min-width: 1024px) {'
    + '    #overlayForm { width: 821px; margin-top: 502px; padding: 42px 176px; background-repeat:no-repeat; background-size: cover; }'
    + '    #overlayForm .hs-input { background-color: rgba(255, 255, 255, .20); color: #fff; padding: 15px; }'
    + '    #videoOverLayBG { background-image: url(/images/2020/pages/ces-product-page/black-background.png?sfvrsn=9b027cb3_2); }'
    + '    #overlayForm .hs-button { font-size: 24px; width: 202px; padding: 16px 0; height: inherit; }'
    + '    #overlayForm .hs-input { font-size: 14px; }'
    + '    div.gatedcontenthead p { color: #ffffff; font-size: 34px !important; }'
    + '    div.gatedcontenthead p span { color:#ffffff; font-size: 24px !important; }'
    + '    #videoOverlayCloser { position: absolute; left: 0; }'
    + '    .hs-input { font-size: 14px; }'
    + '}</style>';
  $('body').append(gatedContentOverlayStyles);
  $('.expand').click(() => {
    $('.expanded').css('display', 'inherit');
    $('.expand').css('display', 'none');
  });
  let formSubmitted = false;
  let windowWidth = null;
  let windowHeight = null;
  function videoModal(videoID) {
    // video is 66% of window width unless less than 768px, then it's 90%
    var videoWidth = windowWidth < 768 ? (videoWidth = windowWidth * 0.9) : windowWidth * 0.66;
    const videoHeight = videoWidth * 0.5625; // 1280/720
    const videoOverlayiFrame = document.createElement('iframe');
    videoOverlayiFrame.id = 'videoOverlayiFrame';
    videoOverlayiFrame.width = Math.floor(videoWidth);
    videoOverlayiFrame.height = Math.floor(videoHeight);
    videoOverlayiFrame.src = `https://www.youtube.com/embed/${
      videoID
    }?rel=0&controls=0&nocookie=true&allowFullScreen=true&autoplay=1`;
    $('#videoOverLay').append(videoOverlayiFrame);
    $('#videoOverlayiFrame')
      .attr('frameborder', 0)
      .attr('allowfullscreen', true)
      .attr('tabindex', -1);
    if (videoHeight < windowHeight) {
      $('#videoOverlayiFrame').css(
        'margin-top',
        windowWidth < 768
          ? Math.floor((windowHeight - videoHeight) / 2 - 45)
          : Math.floor((windowHeight - videoHeight) / 2),
      );
    }
    $('#videoOverlayCloser').css(
      'width',
      windowWidth < 768 ? '100%' : videoWidth + 60,
    );
    if (windowWidth < 768) {
      $('#videoOverlayCloser').css('margin', '0 auto');
    } else {
      $('#videoOverlayCloser').css(
        'margin-left',
        (windowWidth - videoWidth) / 2 - 30,
      );
      $('#videoOverlayCloser').css(
        'top',
        Math.floor((windowHeight - videoHeight) / 2)
        - $('#videoOverlayCloser').height(),
      );
    }
    $('#videoOverlayCloser').show();
    // $('#videoOverlayCloser').css('margin-left',(((windowWidth - videoWidth)/2) - 30));
    // $('#videoOverlayCloser').css('top',(Math.floor((windowHeight-videoHeight)/2))-$('#videoOverlayCloser').height());
  }
  function getCookie(cname) {
    const name = `${cname}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return false;
  }
  function makeCookie(cname, cvalue, numDays) {
    const d = new Date();
    d.setTime(d.getTime() + numDays * 24 * 60 * 60 * 1000);
    // document.cookie = cname + "=" + cvalue + "; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    document.cookie = `${cname}=${cvalue}; expires=${d.toUTCString()}`;
  }
  $('.spawnVideo').click(function (e) {
    const gatedContentOverlayStyles = '';
    const videoID = $(this).attr('data-videoid');
    const isGatedContent = $(this).attr('data-gatedcontent');
    const formBGImage = $(this).attr('data-imgbg');
    windowWidth = $(window).width();
    windowHeight = $(window).height();
    e.preventDefault();
    let landingpageid = null;
    const gatedcontentcookie = getCookie('gatedcontentcookie');
    formSubmitted = !!gatedcontentcookie;
    if (!formSubmitted && isGatedContent == 'true') {
      var videoOverlayDiv = document.createElement('div');
      videoOverlayDiv.id = 'videoOverLay';
      $('body').append(videoOverlayDiv);
      var videoOverlayDivBG = document.createElement('div');
      videoOverlayDivBG.id = 'videoOverLayBG';
      $('#videoOverLay').append(videoOverlayDivBG);
      var videoOverlayCloser = document.createElement('p');
      videoOverlayCloser.id = 'videoOverlayCloser';
      videoOverlayCloser.className = 'x-exit';
      videoOverlayCloser.innerHTML = '&times;';
      $('#videoOverLay').append(videoOverlayCloser);
      $('#videoOverlayCloser').click(() => {
        $('#videoOverLay').remove();
      });
      $('#videoOverLayBG').click(() => {
        $('#videoOverLay').remove();
      });
      const formDiv = document.createElement('div');
      formDiv.id = 'overlayForm';
      $('#videoOverLay').append(formDiv);
      $('#overlayForm').css('background-image', `url(${formBGImage})`);
      hbspt.forms.create({
        portalId: '2494739',
        formId: 'bd92fd47-5db2-4042-a164-3e773913d7ee',
        target: '#overlayForm',
        onFormReady() {
          let videoOverlayFormSkip = document.createElement('div');
          videoOverlayFormSkip.id = 'gatedContentFormSkip';
          $('#overlayForm').append(videoOverlayFormSkip);
          videoOverlayFormSkip = document.createElement('p');
          videoOverlayFormSkip.id = 'gatedContentFormSkipEl';
          videoOverlayFormSkip.textContent = 'Skip to Video';
          $('#gatedContentFormSkip').append(videoOverlayFormSkip);
          $('#gatedContentFormSkip p').click(() => {
            formSubmitted = true;
            $('#overlayForm').hide();
            videoModal(videoID);
          });
          $('div.hs_lead_topic div.input input')
            .val('Website Lead Capture-Web Lead Footer')
            .change();
          const formHeight = $('#overlayForm').height();
          const formWidth = $('#overlayForm').width();
          const formPadTop = $('#overlayForm').css('padding-top');
          const formPadBottom = $('#overlayForm').css('padding-bottom');
          const formPadLeft = $('#overlayForm').css('padding-left');
          const formPadRight = $('#overlayForm').css('padding-right');
          const formPaddingLR = parseInt(formPadLeft.split('px')[0])
            + parseInt(formPadRight.split('px')[0]);
          const formPaddingTB = parseInt(formPadTop.split('px')[0])
            + parseInt(formPadBottom.split('px')[0]);
          if (formHeight < windowHeight) {
            $('#overlayForm').css(
              'margin-top',
              Math.floor((windowHeight - (formHeight + formPaddingTB)) / 2),
            );
          }
          if (typeof window.location.href.split('?')[1] !== 'undefined') {
            landingpageid = window.location.href.split('?')[0];
            let qString = window.location.href.split('?')[1];
            if (typeof qString.split('&') !== 'undefined') {
              qString = qString.split('&');
              for (let i = 0; i < qString.length; i++) {
                const paramName = qString[i].split('=')[0];
                const paramVal = qString[i].split('=')[1];
                if (paramName == 'utm_source') {
                  $(
                    '#overlayForm div.hs_lead_web_source div.input input.hs-input',
                  )
                    .val(paramVal)
                    .change();
                } else if (paramName == 'utm_medium') {
                  $(
                    '#overlayForm div.hs_lead_web_medium div.input input.hs-input',
                  )
                    .val(paramVal)
                    .change();
                } else if (paramName == 'utm_campaign') {
                  $(
                    '#overlayForm div.hs_lead_campaign_name div.input input.hs-input',
                  )
                    .val(paramVal)
                    .change();
                } else if (paramName == 'utm_content') {
                  $(
                    '#overlayForm div.hs_lead_campaign_content div.input input.hs-input',
                  )
                    .val(paramVal)
                    .change();
                }
              }
            }
            $('#overlayForm div.hs_lead_landing_page_id div.input input').val(
              landingpageid,
            );
          }
          function checkforVID() {
            if (typeof window.visitorID !== undefined) {
              clearInterval(checkforvidtimer);
              $('#overlayForm div.hs_lead_client_id div.input input').val(
                window.visitorID,
              );
            }
          }
          var checkforvidtimer = setInterval(checkforVID, 250);
          $('#videoOverlayCloser').css('width', formWidth + formPaddingLR + 60);
          $('#videoOverlayCloser').css(
            'margin-left',
            (windowWidth - (formWidth + formPaddingLR)) / 2 - 30,
          );
          $('#videoOverlayCloser').css(
            'top',
            Math.floor((windowHeight - formHeight) / 2)
            - $('#videoOverlayCloser').height(),
          );
          $('#gatedcontentform').show();
        },
        onFormSubmitted() {
          makeCookie('gatedcontentcookie', 'true', 365);
          formSubmitted = true;
          $('#overlayForm').hide();
          videoModal(videoID);
        },
      });
    } else {
      var videoOverlayDiv = document.createElement('div');
      videoOverlayDiv.id = 'videoOverLay';
      $('body').append(videoOverlayDiv);
      var videoOverlayCloser = document.createElement('p');
      videoOverlayCloser.id = 'videoOverlayCloser';
      videoOverlayCloser.className = 'x-exit';
      videoOverlayCloser.innerHTML = '&times;';
      $('#videoOverLay').append(videoOverlayCloser);
      $('#videoOverlayCloser').click(() => {
        $('#videoOverLay').remove();
      });
      var videoOverlayDivBG = document.createElement('div');
      videoOverlayDivBG.id = 'videoOverLayBG';
      $('#videoOverLay').append(videoOverlayDivBG);
      $('#videoOverLayBG').click(() => {
        $('#videoOverLay').remove();
      });
      videoModal(videoID);
    }
  });
});

// Intersection Observer Configuration
const observerOptions = {
  threshold: 0.3, // 30% visibility required to trigger the callback
};

// Define functions to apply fade-in classes
function fadeInSection(element, className) {
  element?.classList.add(className);
}

function initializeSlickDots() {
  setTimeout(() => {
    fadeInSection(document.querySelector('.slick-dots'), 'fade-in-place');
  }, 1250);
}

window.addEventListener('resize', () => {
  // Check if the media query is true
  if (mediaQuery1024.matches) {
    initializeSlickDots();
  }

  if (mediaQuery1440.matches) {
    initializeSlickDots();
  }

  if (mediaQuery1920.matches) {
    initializeSlickDots();
  }
});

// Callback function for the Intersection Observer
function handleIntersection(entries, observer) {
  entries.forEach((entry) => {
    const { target, isIntersecting } = entry;
    if (isIntersecting) {
      switch (target.id) {
        case 'pdp-pause-video':
        case 'pdp-summary':
          if (vimeoPlayer) {
            pauseVideo(vimeoPlayer);
          }
          break;
        case 'homepage-testimonials':
          fadeInSection(
            target.querySelector('.homepage-testimonials-title'),
            'fade-in-place',
          );
          target.querySelectorAll('.testimonial img').forEach((image) => {
            fadeInSection(image, 'fade-expand-bottom');
          });
          target.querySelectorAll('.testimonial-content').forEach((content) => {
            fadeInSection(content, 'fade-in-place');
          });
          fadeInSection(target.querySelector('.slick-dots'), 'fade-in-place');
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              fadeInSection(
                document.querySelector('.slick-dots'),
                'fade-in-place',
              );
            }, 2000);
          });
          break;
        default:
          break;
      }

      // Remove the observer once the section has been revealed
      // observer.unobserve(target);
    }
  });
}

// Create Intersection Observers for each section
const sections = document.querySelectorAll('section');
sections.forEach((section) => {
  const observer = new IntersectionObserver(
    handleIntersection,
    observerOptions,
  );
  observer.observe(section);
});

//* ***************************************
// JS - PROGRESS BAR TESTIMONIALS
//* ***************************************
// Initialize Progress Bar on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initializeProgressBar();
  }, 2000);
});

// Initialize Progress Bar on resize
window.addEventListener('resize', () => {
  setTimeout(() => {
    initializeProgressBar();
  }, 2000);
});

function initializeProgressBar() {
  // Select elements
  const carousel = document.querySelector(
    '.testimonials-slider .slick-list .slick-track',
  );
  const progressBar = document.querySelector('.slick-dots');

  // If one or both elements are not found, exit the function
  if (!carousel || !progressBar) {
    return;
  }

  // Set variables for all slides
  let currentSlide = 0;
  let carouselSet = new Set();
  let slideCount = carouselSet.size;

  // Checks for TRUE slide count. Slick adds extra elements intermittently, and some are clones.
  function checkSlideCount() {
    carouselSet = new Set();
    if (carousel != null && carousel != undefined) {
      for (const child of carousel.children) {
        if (!child?.getAttribute('class')?.includes('slick-cloned')) {
          carouselSet.add(child.getAttribute('aria-label'));
        }
      }
    }
    slideCount = carouselSet.size;
  }

  // Update progress bar length according to Slick
  function updateProgressBar(slide) {
    if (slide == 1) {
      // console.log(slide)
      const firstSlickDot = progressBar.children.item(0).childNodes[0].childNodes[0];
      // console.log("Clearing first dot");
      firstSlickDot.classList.remove('slick-fill');
      firstSlickDot.classList.add('slick-fill');

      // console.log("Clearing all other dots")
      for (let i = 0; i < slideCount; i++) {
        if (progressBar.children.item(i)) {
          const prevSlickDot = progressBar.children.item(i).childNodes[0].childNodes[0];
          prevSlickDot.classList.remove('slick-fill');
        }
      }
      // console.log("END")
    } else {
      for (const child of progressBar.children) {
        if (child?.getAttribute('class')?.includes('slick-active')) {
          // All children before "slick-active" to get "slick-fill" added
          for (let i = 0; i < slide; i++) {
            const prevSlickDot = progressBar.children.item(i).childNodes[0].childNodes[0];
            prevSlickDot.classList.add('slick-fill');
          }

          // All children after "slick-active" to get "slick-fill" removed
          for (let i = slideCount; i >= slide; i--) {
            if (progressBar.children.item(i)) {
              const prevSlickDot = progressBar.children.item(i).childNodes[0].childNodes[0];
              prevSlickDot.classList.remove('slick-fill');
            }
          }
        }
      }
    }
  }

  // Check what slide Slick is currently displaying
  function checkCurrentSlide() {
    checkSlideCount();

    // Find the slide that is currently centered in the carousel
    if (carousel != null && carousel != undefined) {
      for (const child of carousel.children) {
        const slickIndex = child.getAttribute('data-slick-index');

        // If slide is (centered) and is not a clone, update to current slide
        if (
          child?.getAttribute('aria-label')?.includes('(centered)')
          && !child?.getAttribute('class')?.includes('slick-cloned')
        ) {
          currentSlide = parseInt(slickIndex) + 1;
        }
      }
    }
    if (progressBar != null && progressBar != undefined) {
      updateProgressBar(currentSlide);
    }
  }

  checkSlideCount();

  // Automatic check slide change (adjust the interval as needed) check slide every 1 seconds
  setInterval(checkCurrentSlide, 500);
}

// initialize Hubspot form
jQuery(document).ready(($) => {
  leadtopic = 'NASM Website';
  hbspt.forms.create({
    portalId: '2494739',
    formId: 'd8bf21c7-c69f-4a3c-a305-d32172ec0c4f',
    target: '.hsform',
    locale: 'en',
    translations: {
      en: {
        submitText: 'Get Started Now',
      },
    },
  });
  $('div.hs_lead_topic div.input input').val('NASM Website');
  $('div.hs_lead_topic div.input input').val('NASM Website').change();
});

// Hide pdp-summary-single-payment-flag, show it if it has a value
$(document).ready(() => {
  $('.pdp-summary-single-payment-flag p').hide();
  setTimeout(() => {
    if ($('.pdp-summary-single-payment-flag p').text() !== '') {
      $('.pdp-summary-single-payment-flag p').show();
    }
  }, 1000);
});

$.fn.isOnScreen = function () {
  const win = $(window);

  const viewport = {
    top: win.scrollTop(),
    left: win.scrollLeft(),
  };
  viewport.right = viewport.left + win.width();
  viewport.bottom = viewport.top + win.height();

  const bounds = this.offset();
  bounds.right = bounds.left + this.outerWidth();
  bounds.bottom = bounds.top + this.outerHeight();

  return !(
    viewport.right < bounds.left
    || viewport.left > bounds.right
    || viewport.bottom < bounds.top
    || viewport.top > bounds.bottom
  );
};

$(window).scroll(() => {
  // console.log("scrolling");
  if ($(window).width() < 768) {
    // console.log("<768");
    if (
      $('#pdp-matrix').isOnScreen()
      || $('.pdp-summary-buy-now').isOnScreen()
    ) {
      $('#pdp-choose').hide();
    } else {
      $('#pdp-choose').show();
    }
  }
});

// When the "curriculum here" link is clicked, the "Prerequisites" tab will open up as the page scrolls down to it.
$(document).ready(() => {
  $('#curriculumJumpLink').click((e) => {
    $('.curriculum .curriculum-item:first-of-type').addClass('active');
  });
});

setTimeout(() => {
  document.querySelector('#pdp-hero').style.visibility = 'visible';
}, 2000);

//* ***************************************
// JS - PDP Matrix Option/Select Bug Fix
//* ***************************************

$('.pdp-selector').on('change', function () {
  // Get this value of the selected option in the current dropdown
  const selectedValue = $(this).val();

  // Iterate over all .pdp-selector elements
  $('.pdp-selector').each(function () {
    // Set the value of each dropdown to match the selected value
    $(this).val(selectedValue);

    // Explicitly set the 'selected' attribute for the corresponding option
    $(this).find('option').removeAttr('selected');
    $(this).find(`option[value="${selectedValue}"]`).attr('selected', 'selected');

    // Use $(this) to refer to the changed .pdp-selector
    const $thisSelector = $(this);
    const $parentContainer = $thisSelector.closest('.pdp-zero-select-monthly');

    // Check if the selected option has the class .single-month-selected
    if ($thisSelector.find('option:selected').hasClass('single-month-selected')) {
      // Hide the .pdp-monthly div that is a direct descendant of the parent container
      // and show the .pdp-montly.single-month-selected-text div
      $parentContainer.find('> .pdp-monthly').css('display', 'none');
      $parentContainer.find('.single-month-selected-text').css('display', 'block');
    } else {
      // Show the .pdp-monthly div that is a direct descendant of the parent container
      // and hide the .pdp-montly.single-month-selected-text div
      $parentContainer.find('> .pdp-monthly').css('display', 'block');
      $parentContainer.find('.single-month-selected-text').css('display', 'none');
    }
  });
});

// Matrix Monthly Payment Toggler - Mobile
const monthlySelect = $('.pdp-selector');

$(monthlySelect).each(function () {
  $(this).on('change', function () {
    $("[class^='matrix-monthly-']").each(function () {
      $(this).removeClass('active');
    });

    const monthlyNumber = $(this).val();
    const className = `.matrix-monthly-${monthlyNumber}`;

    $(className).addClass('active');

    const downPayment = $(this).parent().prev();

    switch (monthlyNumber) {
      case '1':
        downPayment.text('One-Time Payment');
        $('.pdp-monthly-price span.mo-first').text('');
        break;
      case '4':
        downPayment.text('25% down +');
        $('.pdp-monthly-price span.mo-first').text('/month');
        break;
      case '12':
        downPayment.text('$25 down +');
        $('.pdp-monthly-price span.mo-first').text('/month');
        break;
      case '17':
        downPayment.text('$199 down +');
        $('.pdp-monthly-price span.mo-first').text('/month');
        break;
      case '18':
        downPayment.text('$199 down +');
        $('.pdp-monthly-price span.mo-first').text('/month');
        break;

      default:
        break;
    }
  });
});

// Matrix Benefits List Dropdown
document.getElementById('pssBT').addEventListener('click', () => {
  const benefitsTitle = document.getElementById('pssBT');
  const benefitsList = document.getElementById('pssBL');

  if (!benefitsList.classList.contains('open-benefits-list')) {
    benefitsList.style.height = 'fit-content';
    benefitsList.classList.add('open-benefits-list');
  } else {
    benefitsList.style.height = '0';
    benefitsList.classList.remove('open-benefits-list');
  }

  if (!benefitsTitle.classList.contains('benefits-open')) {
    benefitsTitle.classList.add('benefits-open');
  } else {
    benefitsTitle.classList.remove('benefits-open');
  }
});

document.getElementById('essBT').addEventListener('click', () => {
  const benefitsTitle = document.getElementById('essBT');
  const benefitsList = document.getElementById('essBL');

  if (!benefitsList.classList.contains('open-benefits-list')) {
    benefitsList.style.height = 'fit-content';
    benefitsList.classList.add('open-benefits-list');
  } else {
    benefitsList.style.height = '0';
    benefitsList.classList.remove('open-benefits-list');
  }

  if (!benefitsTitle.classList.contains('benefits-open')) {
    benefitsTitle.classList.add('benefits-open');
  } else {
    benefitsTitle.classList.remove('benefits-open');
  }
});

document.getElementById('excBT').addEventListener('click', () => {
  const benefitsTitle = document.getElementById('excBT');
  const benefitsList = document.getElementById('excBL');

  if (!benefitsList.classList.contains('open-benefits-list')) {
    benefitsList.style.height = 'fit-content';
    benefitsList.classList.add('open-benefits-list');
  } else {
    benefitsList.style.height = '0';
    benefitsList.classList.remove('open-benefits-list');
  }

  if (!benefitsTitle.classList.contains('benefits-open')) {
    benefitsTitle.classList.add('benefits-open');
  } else {
    benefitsTitle.classList.remove('benefits-open');
  }
});
