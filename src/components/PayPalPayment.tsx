import { PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalPaymentProps {
  amount: number;
  onPaymentSuccess: (orderId: string) => void;
  onPaymentError: (error: string) => void;
}

export function PayPalPayment({ amount, onPaymentSuccess, onPaymentError }: PayPalPaymentProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">PayPal Checkout</h3>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-yellow-900">
          You will be redirected to PayPal to complete your payment securely.
        </p>
      </div>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                amount: {
                  currency_code: 'USD',
                  value: amount.toFixed(2),
                },
              },
            ],
          });
        }}
        onApprove={async (data, actions) => {
          if (!actions.order) {
            onPaymentError('PayPal order action is not available.');
            return;
          }

          try {
            const details = await actions.order.capture();
            onPaymentSuccess(details.id);
          } catch (error) {
            onPaymentError('Failed to capture PayPal payment. Please try again.');
          }
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onPaymentError('PayPal payment failed. Please try again or use a different payment method.');
        }}
        onCancel={() => {
          onPaymentError('PayPal payment was cancelled. Please try again.');
        }}
      />
    </div>
  );
}
