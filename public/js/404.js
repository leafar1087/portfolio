document.addEventListener('DOMContentLoaded', () => {
    const pathElement = document.getElementById('path');
    if (pathElement) {
        pathElement.innerText = window.location.pathname;
    }
});
