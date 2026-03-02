document.addEventListener('DOMContentLoaded', function() {

    // =====================
    // MENU HAMBURGER MOBILE
    // =====================
    const menuBtn = document.getElementById('menu-btn');
    const navbar = document.querySelector('.navbar');

    menuBtn.addEventListener('click', function() {
        navbar.classList.toggle('active');
    });

    // Fermer le menu quand on clique sur un lien
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('active');
        });
    });

    // =====================
    // FILTRAGE FAQ
    // =====================
    const faqMenuItems = document.querySelectorAll('.faq-menu li');
    const faqGroups = document.querySelectorAll('.faq-group');

    function filterFAQ(category) {
        faqGroups.forEach(group => {
            const groupCategory = group.getAttribute('data-category');
            group.style.display = groupCategory === category ? 'block' : 'none';
        });
    }

    // Afficher "Générale" par défaut
    filterFAQ('generale');

    faqMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            faqMenuItems.forEach(menuItem => menuItem.classList.remove('active'));
            this.classList.add('active');
            const selectedCategory = this.getAttribute('data-category');
            filterFAQ(selectedCategory);
        });
    });

    // =====================
    // ANIMATIONS AU SCROLL
    // =====================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.animate').forEach(el => observer.observe(el));

});