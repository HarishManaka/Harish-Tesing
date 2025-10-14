import { h } from '@dropins/tools/preact.js';
import { useState, useEffect } from '@dropins/tools/preact-hooks.js';
import { events } from '@dropins/tools/event-bus.js';
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import { getCustomerAddress } from '@dropins/storefront-account/api.js';
import { ProgressSpinner } from '@dropins/tools/components.js';
import htm from '../../../scripts/htm.js';
import { getBillingAddress, RIC_ENV_CONFIG, ENV_CONFIG } from '../../../utils/cart-checkout.js';
import { loadCSS, loadScript } from '../../../scripts/aem.js';
import { getEnvironment } from '../../../scripts/configs.js';
import {
  STEP_CONFIGS,
  getCheckoutJourneyType,
  isZeroDollarCart,
} from './config.js';
import {
  ShippingDetails,
  ShippingMethods,
  PaymentOptions,
  Billing,
  RICCertification,
  AcceptTermsAndPlaceOrder,
} from './steps/index.js';

const html = htm.bind(h);

// Step component mapping
const STEP_COMPONENTS = {
  'shipping-details': ShippingDetails,
  'shipping-methods': ShippingMethods,
  'payment-options': PaymentOptions,
  billing: Billing,
  'ric-certification': RICCertification,
  'place-order': AcceptTermsAndPlaceOrder,
};

export default function MultiStepCheckout({
  cartData,
  labels,
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepData, setStepData] = useState({});
  const [editingStep, setEditingStep] = useState(null);

  useEffect(() => {
    const handleCheckoutInitialized = async () => {
      if (isZeroDollarCart(cartData)) {
        const customerAddresses = await getCustomerAddress();
        const billingAddress = getBillingAddress(customerAddresses);
        checkoutApi.setBillingAddress({
          address: billingAddress,
          sameAsShipping: false,
        });
        await checkoutApi.setPaymentMethod({
          code: 'free',
        });
      }
    };
    const eventSubscription = events.on('checkout/initialized', handleCheckoutInitialized);
    return () => {
      if (eventSubscription && eventSubscription.off) {
        eventSubscription.off();
      }
    };
  }, [cartData]);

  // Determine journey type and steps
  const [journeyType, setJourneyType] = useState(null);
  const [stepConfig, setStepConfig] = useState(null);
  const [steps, setSteps] = useState([]);
  const [billToShipping, setBillToShipping] = useState(false);
  const [shippingMethod, setShippingMethod] = useState('');

  // Fetch journey type asynchronously
  useEffect(() => {
    const fetchJourneyType = async () => {
      try {
        const journey = await getCheckoutJourneyType(cartData);
        setJourneyType(journey);
        const config = STEP_CONFIGS[journey];
        setStepConfig(config);
        setSteps(config?.steps || []);
      } catch (error) {
        // Handle error silently or log to monitoring service
      }
    };

    if (cartData) {
      fetchJourneyType();
    }
  }, [cartData]);

  useEffect(() => {
    const handleCheckoutValues = (values) => {
      if (values && typeof values.isBillToShipping !== 'undefined') {
        setBillToShipping(values?.isBillToShipping);
      }

      if (values?.selectedShippingMethod) {
        setShippingMethod(values?.selectedShippingMethod);
      }
    };
    events.on('checkout/values', handleCheckoutValues);

    return () => {
      events.off('checkout/values', handleCheckoutValues);
    };
  }, []);

  // Load RIC dependencies when RIC step is included in the journey
  useEffect(() => {
    const loadRICDependencies = async () => {
      try {
        // Check if RIC certification step exists in the current steps
        const hasRICStep = steps.some((step) => step.id === 'ric-certification');

        if (hasRICStep) {
          const environment = getEnvironment();
          const ricConfig = RIC_ENV_CONFIG[environment];

          if (ricConfig) {
            // Load RIC dependencies
            await Promise.all([
              loadScript(ricConfig.mfeUrl),
              loadCSS(ricConfig.cssUrl),
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading RIC dependencies:', error);
      }
    };

    if (steps.length > 0) {
      loadRICDependencies();
    }
  }, [steps]);

  // Load Payment Plan MFE dependencies when payment-options step is included
  useEffect(() => {
    const loadPaymentPlanDependencies = async () => {
      try {
        // Check if payment-options step exists in the current steps
        const hasPaymentOptionsStep = steps.some((step) => step.id === 'payment-options');

        if (hasPaymentOptionsStep) {
          const environment = getEnvironment();
          const paymentPlanConfig = ENV_CONFIG[environment];

          if (paymentPlanConfig) {
            // Load Payment Plan MFE script
            await loadScript(paymentPlanConfig.mfeUrl);
          }
        }
      } catch (error) {
        console.error('Error loading Payment Plan MFE dependencies:', error);
      }
    };

    if (steps.length > 0) {
      loadPaymentPlanDependencies();
    }
  }, [steps]);

  // Show loading state while determining journey type
  if (!journeyType || !stepConfig) {
    return html`
      <div class="checkoout__multistep-loader">
          <${ProgressSpinner} />
      </div>
    `;
  }

  const totalSteps = steps.length;
  const completedCount = completedSteps.size;

  const handleStepComplete = (stepId, data) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
    setStepData((prev) => ({ ...prev, [stepId]: data }));

    // If we were editing a step, clear the editing state
    if (editingStep === stepId) {
      setEditingStep(null);
    }

    // Find the index of the completed step and move to next
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    if (stepIndex !== -1 && stepIndex < totalSteps - 1) {
      // Move to the next step automatically
      setCurrentStepIndex(stepIndex + 1);
    }
  };

  const handleStepEdit = (stepId) => {
    // Find the index of the step being edited
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) return;

    // Set the editing step
    setEditingStep(stepId);

    // Set current step to the editing step
    setCurrentStepIndex(stepIndex);

    // Remove completion status from the edited step and all subsequent steps
    const stepsToReset = steps.slice(stepIndex).map((step) => step.id);
    setCompletedSteps((prev) => {
      const newCompleted = new Set(prev);
      stepsToReset.forEach((id) => newCompleted.delete(id));
      return newCompleted;
    });

    // Clear step data for the edited step and all subsequent steps
    setStepData((prev) => {
      const newStepData = { ...prev };
      stepsToReset.forEach((id) => delete newStepData[id]);
      return newStepData;
    });
  };

  const isStepCompleted = (stepId) => completedSteps.has(stepId);
  const isStepEditing = (stepId) => editingStep === stepId;

  const isStepVisible = (index) => {
    // If we're editing a step, only show steps up to the editing step
    if (editingStep !== null) {
      const editingStepIndex = steps.findIndex(
        (step) => step.id === editingStep,
      );
      return index <= editingStepIndex;
    }

    // Show the current step and all previous steps
    return index <= currentStepIndex;
  };

  const renderStepComponent = (step, _index) => {
    const StepComponent = STEP_COMPONENTS[step.id];
    // Get the next step title directly from the config
    const nextStepTitle = step.nextStepTitle || null;
    const ctaTitle = step.ctaTitle || 'Continue';

    return html`
      <${StepComponent}
        key=${step.id}
        stepId=${step.id}
        title=${step.title}
        nextStepTitle=${nextStepTitle}
        ctaTitle=${ctaTitle}
        isCompleted=${isStepCompleted(step.id)}
        isEditing=${isStepEditing(step.id)}
        onComplete=${handleStepComplete}
        onEdit=${handleStepEdit}
        stepData=${stepData}
        totalSteps=${totalSteps}
        stepNum=${completedCount + 1}
        cartData=${cartData}
        labels=${labels}
        billToShipping=${billToShipping}
        shippingMethod=${shippingMethod}
      />
    `;
  };

  return html`
    <div class="multi-step-checkout">
      <!-- Steps -->
      <div class="checkout-steps">
  ${steps.map((step, index) => {
    if (!isStepVisible(index)) return null;
    return renderStepComponent(step);
  })}
      </div>      
    </div>
  `;
}
