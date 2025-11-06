import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export function StripePayment({ amount, onPaymentSuccess, onPaymentError }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      onPaymentError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onPaymentError('Card information is not available.');
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed. Please check your card details.');
        setProcessing(false);
        return;
      }

      onPaymentSuccess(paymentMethod.id);
      setProcessing(false);
    } catch (err) {
      onPaymentError('An unexpected error occurred. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Card Details</h3>
      <div className="p-4 border-2 border-gray-200 rounded-lg mb-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                '::placeholder': {
                  color: '#9ca3af',
                },
                fontFamily: 'system-ui, -apple-system, sans-serif',
              },
              invalid: {
                color: '#ef4444',
              },
            },
            hidePostalCode: true,
          }}
        />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-900">
          Your payment is secured by Stripe. We never store your card details.
        </p>
      </div>
      {processing && (
        <div className="text-center text-gray-600">
          <p>Processing payment...</p>
        </div>
      )}
    </div>
  );
}
