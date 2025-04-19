import { useEffect, useCallback } from 'react';

export const useScrollAnimation = () => {
  const animateElements = useCallback(() => {
    const elements = document.querySelectorAll('.hidden');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
  }, []);

  return { animateElements };
};