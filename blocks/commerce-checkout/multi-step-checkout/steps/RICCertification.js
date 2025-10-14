import { h } from '@dropins/tools/preact.js';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from '@dropins/tools/preact-hooks.js';
import renderRICCertificationMFE from '../../../../custom-blocks/ric-certification-mfe/ric-certification-mfe.js';
import htm from '../../../../scripts/htm.js';
import ProgressBar from '../../../../custom-blocks/progress-bar/progress-bar.js';
import useStepFocus from '../hooks/useStepFocus.js';

const html = htm.bind(h);

export default function RICCertification({
  stepId,
  nextStepTitle,
  ctaTitle,
  isCompleted,
  isEditing,
  onComplete,
  onEdit,
  cartData,
  labels,
  stepNum,
  totalSteps,
  stepData,
}) {
  const [selectedRICData, setSelectedRICData] = useState(null);
  const [isRicCertificationRequired] = useState(stepData?.['payment-options']?.paymentOption?.ricRequired || false);
  const ricCertificationMFEContainerRef = useRef(null);
  const checkoutStepsLoadingSpinnerRef = useRef(null);
  const mfeRenderedRef = useRef(false);
  const currentStepIdRef = useRef(stepId);

  const { billToShipping } = stepData.billing || {};

  // Use the focus hook
  const stepTitleRef = useStepFocus(isCompleted, isEditing, stepNum, totalSteps);

  useEffect(() => {
    if (!isRicCertificationRequired) {
      onComplete(stepId, { ricData: null });
    }
  }, []);

  // Update selectedRICData when handleUpdateRICCertification is called
  const handleUpdateRICCertification = (ricData) => {
    if (ricData?.detail?.status) {
      setSelectedRICData(ricData?.detail);
      ricCertificationMFEContainerRef.current.innerHTML = '';
      onComplete(stepId, { ricData: ricData?.detail });
    }
  };

  // Reset state when editing starts
  useEffect(() => {
    if (!isRicCertificationRequired) {
      return;
    }
    if (isEditing) {
      setSelectedRICData(null);
      mfeRenderedRef.current = false;
    }
  }, [isEditing]);

  // Memoize the render function to prevent recreation on every render
  const renderRICCertificationMFEComponent = useCallback(async () => {
    if ((mfeRenderedRef.current && !isEditing) || !isRicCertificationRequired) {
      return;
    }

    try {
      if (ricCertificationMFEContainerRef.current) {
        ricCertificationMFEContainerRef.current.innerHTML = '';
      }
      const selectedPaymentPlanData = stepData?.['payment-options']?.paymentOption;
      const { shipping, tax } = JSON.parse(selectedPaymentPlanData?.cartObj) || {};
      await renderRICCertificationMFE({
        container: ricCertificationMFEContainerRef.current,
        loaderContainer: checkoutStepsLoadingSpinnerRef.current,
        handleUpdateRICCertification,
        ctaTitle,
        cartData,
        labels,
        billToShipping,
        shipping,
        tax,
        ppId: selectedPaymentPlanData?.ppId || '',
      });

      mfeRenderedRef.current = true;
    } catch (error) {
      console.error('Error rendering RIC Certification MFE:', error);
    }
  }, [
    isCompleted,
    isEditing,
    isRicCertificationRequired,
    ctaTitle,
    cartData,
    labels,
    stepData,
  ]);

  useEffect(() => {
    if (!isRicCertificationRequired) {
      return false;
    }

    if (currentStepIdRef.current !== stepId) {
      mfeRenderedRef.current = false;
      currentStepIdRef.current = stepId;
    }

    if (!isCompleted && (isEditing || !mfeRenderedRef.current)) {
      renderRICCertificationMFEComponent();
    }

    return () => {
      if (isEditing) {
        mfeRenderedRef.current = false;
      }
    };
  }, [
    stepId,
    isCompleted,
    isEditing,
  ]);

  const handleEdit = () => {
    onEdit(stepId);
  };

  if (!isRicCertificationRequired) {
    return null;
  }

  if (isCompleted && !isEditing && selectedRICData?.status) {
    return html`
      <div class="checkout-step checkout-step--completed">
        <div class="checkout-step__header">
          <h3 class="checkout-step__title">${labels?.checkout.ricc.infoLabel}</h3>
          <button class="checkout-step__edit-btn" onClick=${handleEdit}>
            ${labels?.checkout.editLabel}
          </button>
        </div>
        <div class="checkout-step__content">
          <div class="checkout-step__completed-data">
            <div class="ric-certification-summary">
                <div class="ric-summary">
                  <p>${labels?.checkout.statusLabel}: <strong>SIGNED</strong></p>
                </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="checkout-step checkout-step--editing">
      <div class="checkout-step__header">
        <h3 
          class="checkout-step__title"
          ref=${stepTitleRef}
          tabindex="-1"
          aria-label="Step ${stepNum} of ${totalSteps}: ${labels?.checkout.ricc.infoLabel}"
        >
          ${labels?.checkout.ricc.certificateInfo}
          <p class="next-step-indicator">${labels?.checkout.nextLabel}: ${nextStepTitle}</p>
        </h3>
                 ${html`
              <${ProgressBar}
                current=${stepNum}
                total=${totalSteps}
              />`
}
      </div>
      <div class="checkout-step__content checkout-mfe-container-wrapper">
        <div class="ric-certification-mfe-container" ref=${ricCertificationMFEContainerRef}></div>
        <div class="checkout__steps-loading-spinner" ref=${checkoutStepsLoadingSpinnerRef}></div>        
      </div>
    </div>
  `;
}
