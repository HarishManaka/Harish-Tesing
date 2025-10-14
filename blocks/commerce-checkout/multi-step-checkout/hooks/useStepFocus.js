import { useEffect, useRef } from '@dropins/tools/preact-hooks.js';

let isInitialLoad = true;

export const scrollToStep = (element) => {
  if (element) {
    const headerHeight = window.innerWidth > 899 ? 20 : 100;
    const elementTop = element.offsetTop;

    // Scroll to element position minus header height
    window.scrollTo({
      top: elementTop - headerHeight,
      behavior: 'smooth',
    });
  }
};

export default function useStepFocus(isCompleted, isEditing, stepNum, totalSteps) {
  const stepTitleRef = useRef(null);

  useEffect(() => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return null;
    }
    if ((!isCompleted || isEditing) && stepTitleRef.current) {
      // Small delay to ensure DOM is ready and user has finished any current interaction
      const timer = setTimeout(() => {
        stepTitleRef.current.focus();
        scrollToStep(stepTitleRef.current);
      }, 200);

      return () => clearTimeout(timer);
    }
    return null;
  }, [isEditing, stepNum, totalSteps]);

  return stepTitleRef;
}
