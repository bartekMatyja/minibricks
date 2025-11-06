import { CreditCard, Wallet, Building2, Truck } from 'lucide-react';
import { PaymentMethod } from '../lib/orders';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) {
  const paymentMethods = [
    {
      id: 'credit_card' as PaymentMethod,
      name: 'Credit/Debit Card',
      description: 'Pay securely with Visa, Mastercard, or Amex',
      icon: CreditCard,
      available: true
    },
    {
      id: 'paypal' as PaymentMethod,
      name: 'PayPal',
      description: 'Fast and secure PayPal checkout',
      icon: Wallet,
      available: true
    },
    {
      id: 'apple_pay' as PaymentMethod,
      name: 'Apple Pay',
      description: 'Quick checkout with Apple Pay',
      icon: Wallet,
      available: typeof window !== 'undefined' && (window as any).ApplePaySession
    },
    {
      id: 'google_pay' as PaymentMethod,
      name: 'Google Pay',
      description: 'Pay with Google Pay',
      icon: Wallet,
      available: true
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      name: 'Bank Transfer',
      description: 'Direct bank transfer (manual verification)',
      icon: Building2,
      available: true
    },
    {
      id: 'cash_on_delivery' as PaymentMethod,
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: Truck,
      available: true
    }
  ];

  const availableMethods = paymentMethods.filter(method => method.available);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {availableMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{method.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
