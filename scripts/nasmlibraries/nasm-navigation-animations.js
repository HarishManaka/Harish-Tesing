// Navigation animations

let isNavOpen;

function openNav() {
  // Change menu functionality for mobile devices (small tablets and below)
  if (window.innerWidth < 1440) {
    document.getElementById('mySidenav').style.left = '0';

    //   let submenus = document.getElementsByClassName("nav__mobile--slideout--pt");

    //   for (let i = 0; i < submenus.length; i++) {
    //     submenus[i].style.left = "0";
    // //     submenus[i].style.display = "block";
    //   }
  }

  // nav_bg_overlay controls the blur
  document.getElementById('nav_bg_overlay').style.width = '100%';
  document.getElementById('nav_bg_overlay').style.height = '100vh';
}

function closeSideMenu() {
  isNavOpen = false;
  if (window.innerWidth < 1440) {
    document.querySelector('.slideout-search').style.display = 'block';

    const idToClose = document.getElementById('main-menu');
    // Add the "fade-out" class immediately
    idToClose.classList.add('fade-out');
    // Fade out animation
    idToClose.style.display = 'none';
    // Display: none after animation so it doesn't pop back into existence

    idToClose.classList.remove('fade-out');
    // Remove fade-out class

    checkLayout();
    // Rebuild main menuclassList.remove("fade-out");

    idToClose.classList.add('fade-in');
    idToClose.style.display = 'block';
    // Add "fade-in" class to all main-menu divs
    // Set display block once faded in so they remain visible

    const needHelp = document.getElementById('hideOnDesktop');
    // Need to hide the "Need Help?" section
    needHelp.classList.add('fade-in');
    needHelp.style.display = 'block';

    setTimeout(() => {
      idToClose.classList.remove('fade-in');
      needHelp.classList.remove('fade-in');
      // Remove the fade-in class after 500ms so it can be re-added to cue the animation as needed
    }, 500);
  }
}

function closeNav() {
  // Remove background blur
  // Blur or unblur background depending on if Search is displayed
  if ($('.search-wrapper').css('display') == 'block') {
    document.getElementById('nav_bg_overlay').style.width = '100%';
    document.getElementById('nav_bg_overlay').style.height = '100vh';
  } else {
    document.getElementById('nav_bg_overlay').style.width = '0';
    document.getElementById('nav_bg_overlay').style.height = '0';
  }

  if (window.innerWidth < 1440) {
    document.getElementById('mySidenav').style.left = '-90%';
    closeSideMenu();
    // Calling this from main menu script

    // Set main menu back to display block, reset rest to none and remove fading classes
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('main-menu').classList.remove('fade-out');

    // Redisplay Account block
    document.querySelector(
      '#mySidenav > div.account-close > div',
    ).style.display = 'block';

    document.getElementById('hideOnDesktop').style.display = 'block';
    document
      .getElementsByClassName('slideout-search')[0]
      .classList.remove('fade-out');
    document.getElementsByClassName('slideout-search')[0].style.display = 'block';
    document
      .getElementsByClassName('slideout-img')[0]
      .classList.remove('fade-out');
    document.getElementsByClassName('slideout-img')[0].style.display = 'block';
  } else {
    $('.nav__mobile--slideout--pt').hide();

    document.getElementById('mySidenav').style.left = '0';
  }
}

// Search bar animation

function searchDropdown() {
  $('.search-dropdown-hide').toggle();
  $('.search-wrapper').toggle();

  // $('#nasm-submenu').html('');

  const submenuContent = document.getElementById('nasm-submenu');
  for (const child of submenuContent.children) {
    // Hide all submenu content divs
    child.style.display = 'none';
  }

  const searchBox = document.getElementsByName('search');
  // Desktop is at index 1. We don't care about mobile for setting focus.
  searchBox[1].focus();

  closeNav();
}

function toggleMobileOptions() {
  // Mobile dropdown functionality for Resources submenu
  const h2s = document.querySelectorAll('.link-section h2');
  h2s.forEach((item) => {
    if (window.innerWidth < 1440) {
      item.addEventListener('click', hideH2s);
    } else {
      item.removeEventListener('click', hideH2s);
      // Remove this for Desktop so we don't get unexpected behavior
    }
  });
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

document.addEventListener('DOMContentLoaded', toggleMobileOptions);

document.addEventListener('resize', toggleMobileOptions);
