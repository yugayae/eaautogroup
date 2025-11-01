// animations.js - Главный файл анимаций для сайта Eaautogroup
// Автор: AI Assistant
// Дата: 2024

(function() {
    'use strict';

    // === АНИМАЦИИ ПРИ СКРОЛЛЕ ===
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -30px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    
                    // Добавляем задержку для последовательного появления
                    const delay = parseInt(entry.target.dataset.delay) || 0;
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, delay);
                }
            });
        }, observerOptions);

        // Находим все элементы для анимации
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => observer.observe(el));
    }

    // === АНИМАЦИИ КНОПОК ===
    function initButtonAnimations() {
        const buttons = document.querySelectorAll('.btn, .cta-button, .submit-btn');
        
        buttons.forEach(button => {
            // Добавляем эффект ripple при клике
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    // === АНИМАЦИИ КАРТОЧЕК ===
    function initCardAnimations() {
        const cards = document.querySelectorAll('.about-card, .contact-card, .advantage');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
                this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)';
            });
        });
    }

    // === АНИМАЦИЯ ЗАГРУЗКИ СТРАНИЦЫ ===
    function initPageLoadAnimation() {
        // Создаем лоадер
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = '<div class="loader-spinner"></div>';
        document.body.appendChild(loader);
        
        // Добавляем класс перехода к body
        document.body.classList.add('page-transition');
        
        window.addEventListener('load', function() {
            // Скрываем лоадер
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => {
                    loader.remove();
                }, 500);
            }, 800);
            
            // Показываем контент
            setTimeout(() => {
                document.body.classList.add('loaded');
            }, 300);
            
            // Анимируем появление элементов с задержкой
            const hero = document.querySelector('.hero, .about-header');
            if (hero) {
                hero.style.opacity = '0';
                hero.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    hero.style.transition = 'all 0.8s ease-out';
                    hero.style.opacity = '1';
                    hero.style.transform = 'translateY(0)';
                }, 200);
            }
        });
    }

    // === АНИМАЦИИ НАВИГАЦИИ ===
    function initNavigationAnimations() {
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // === АНИМАЦИИ ИКОНОК ===
    function initIconAnimations() {
        // Исключаем имена в контактных карточках
        const icons = document.querySelectorAll('h3:not(.contact-card h3)');
        
        icons.forEach(icon => {
            // Проверяем, что это не имя в контактной карточке
            if (icon.closest('.contact-card')) {
                return;
            }
            
            icon.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05) rotate(2deg)';
                this.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
            
            icon.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1) rotate(0deg)';
            });
        });
    }

    // === ПЛАВНАЯ ПРОКРУТКА ===
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // === ПЛАВНЫЕ ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ ===
    function initPageTransitions() {
        const navLinks = document.querySelectorAll('nav a[href$=".html"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Проверяем, что это не внешняя ссылка
                if (href && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
                    e.preventDefault();
                    
                    // Добавляем эффект исчезновения
                    document.body.style.opacity = '0';
                    document.body.style.transform = 'translateY(-20px)';
                    
                    // Переходим на новую страницу
                    setTimeout(() => {
                        window.location.href = href;
                    }, 300);
                }
            });
        });
    }

    // === АНИМАЦИЯ СЧЕТЧИКОВ ===
    function initCounterAnimations() {
        const counters = document.querySelectorAll('.counter');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.target);
                    const duration = 2000; // 2 секунды
                    const increment = target / (duration / 16); // 60 FPS
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        counter.textContent = Math.floor(current).toLocaleString();
                    }, 16);
                }
            });
        });
        
        counters.forEach(counter => observer.observe(counter));
    }

    // === ИНИЦИАЛИЗАЦИЯ ВСЕХ АНИМАЦИЙ ===
    function initAllAnimations() {
        initScrollAnimations();
        initButtonAnimations();
        initCardAnimations();
        initPageLoadAnimation();
        initNavigationAnimations();
        initIconAnimations();
        initSmoothScroll();
        initPageTransitions();
        initCounterAnimations();
    }

    // Запускаем анимации когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllAnimations);
    } else {
        initAllAnimations();
    }

    // Экспортируем функции для использования в других скриптах
    window.Animations = {
        initScrollAnimations,
        initButtonAnimations,
        initCardAnimations,
        initPageLoadAnimation,
        initNavigationAnimations,
        initIconAnimations,
        initSmoothScroll,
        initPageTransitions,
        initCounterAnimations
    };

})();
