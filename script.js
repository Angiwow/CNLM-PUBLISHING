document.addEventListener('DOMContentLoaded', function() {

    // ─── FILTRAGE PAR CATÉGORIE ───────────────────────────────────────────
    const faqMenuItems = document.querySelectorAll('.faq-menu li');
    const faqGroups = document.querySelectorAll('.faq-group');

    function filterFAQ(category) {
        faqGroups.forEach(group => {
            group.style.display = group.getAttribute('data-category') === category ? 'block' : 'none';
        });
    }

    filterFAQ('generale');

    faqMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            faqMenuItems.forEach(menuItem => menuItem.classList.remove('active'));
            this.classList.add('active');
            filterFAQ(this.getAttribute('data-category'));
        });
    });

    // ─── TOGGLE OUVERTURE DES RÉPONSES ───────────────────────────────────
    document.querySelectorAll('.faq-group-header').forEach(header => {
        header.addEventListener('click', function() {
            const body = this.nextElementSibling;
            const icon = this.querySelector('i');
            const isOpen = body.classList.contains('open');

            // Fermer toutes les réponses ouvertes dans le groupe visible
            document.querySelectorAll('.faq-group-body.open').forEach(openBody => {
                openBody.classList.remove('open');
                const openIcon = openBody.previousElementSibling.querySelector('i');
                if (openIcon) {
                    openIcon.classList.remove('fa-chevron-up');
                    openIcon.classList.add('fa-chevron-down');
                }
            });

            // Ouvrir celle cliquée (si elle était fermée)
            if (!isOpen) {
                body.classList.add('open');
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            }
        });
    });

    // ─── ANIMATIONS AU SCROLL ────────────────────────────────────────────
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.animate').forEach(el => observer.observe(el));

});