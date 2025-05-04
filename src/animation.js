// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initial load animations
    handleInitialAnimations();
    
    // Set up scroll animations
    handleScrollAnimations();
    
    // Optional: Add loading screen functionality
    handleLoadingScreen();
});

// Handle initial page load animations
function handleInitialAnimations() {
    // Target elements that should fade in on page load
    const heroSection = document.querySelector('.hero-section');
    const homeHeader = document.querySelector('.home-header');
    const searchContainer = document.querySelector('.side-search-container');
    const buttonsContainer = document.querySelector('.buttons-container');
    const infoSection = document.querySelector('.info-section');
    
    // Apply animations with slight delays for a staggered effect
    if (homeHeader) {
        homeHeader.classList.add('header-animation');
    }
    
    if (heroSection) {
        heroSection.classList.add('hero-animation');
    }
    
    if (searchContainer) {
        searchContainer.classList.add('search-animation');
        // Slightly longer delay for search
        searchContainer.style.animationDelay = '0.3s';
    }
    
    if (buttonsContainer) {
        // Add slight delay for each button
        const buttons = buttonsContainer.querySelectorAll('button');
        buttons.forEach((button, index) => {
            button.classList.add('button-animation');
            button.style.animationDelay = `${0.5 + (index * 0.2)}s`;
        });
    }
    
    if (infoSection) {
        infoSection.classList.add('fade-in');
        infoSection.style.animationDelay = '0.8s';
    }
    
    // Add animation to footer elements
    const footerElements = document.querySelectorAll('.footer .partners, .footer .copyright');
    footerElements.forEach((element, index) => {
        element.classList.add('fade-in');
        element.style.animationDelay = `${1 + (index * 0.2)}s`;
    });
}

// Handle scroll-triggered animations
function handleScrollAnimations() {
    // Get all elements with the 'hidden' class
    const hiddenElements = document.querySelectorAll('.hidden');
    
    // Create an Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // If element is intersecting (visible)
            if (entry.isIntersecting) {
                // Add the 'show' class
                entry.target.classList.add('show');
                // Optional: unobserve after animation is triggered
                // observer.unobserve(entry.target);
            } else {
                // Optional: Remove 'show' class when element is out of view
                // Uncomment next line for elements to re-animate when scrolling back up
                // entry.target.classList.remove('show');
            }
        });
    }, {
        root: null, // Use viewport as root
        threshold: 0.15, // Trigger when at least 15% of the element is visible
        rootMargin: '-50px' // Trigger animation slightly before element enters viewport
    });
    
    // Observe all hidden elements
    hiddenElements.forEach(element => {
        observer.observe(element);
    });
    
    // Handle header scroll effect
    const header = document.querySelector('.home-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Optional: Add progress bar
    handleProgressBar();
}

// Optional: Loading screen functionality
function handleLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (!loadingScreen) return;
    
    // Hide loading screen after content is loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 600); // Short delay to ensure smooth transition
    });
}

// Optional: Progress bar that shows scroll position
function handleProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}