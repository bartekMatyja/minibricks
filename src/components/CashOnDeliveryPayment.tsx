import { Truck, AlertCircle } from 'lucide-react';

interface CashOnDeliveryPaymentProps {
  amount: number;
}

export function CashOnDeliveryPayment({ amount }: CashOnDeliveryPaymentProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Cash on Delivery</h3>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Truck className="w-6 h-6 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900 mb-1">
              Pay when you receive your order
            </p>
            <p className="text-sm text-green-800">
              You can pay the delivery person in cash when your order arrives at your doorstep.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Amount to Pay on Delivery</p>
          <p className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">How it works:</p>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Complete your order now</li>
          <li>We will prepare and ship your items</li>
          <li>Pay cash to the delivery person when you receive your order</li>
          <li>Get your receipt and enjoy your products</li>
        </ol>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Please note:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Have exact change ready if possible</li>
              <li>The delivery person will provide a receipt</li>
              <li>Order confirmation will be sent to your email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
