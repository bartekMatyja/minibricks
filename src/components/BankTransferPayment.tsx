import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface BankTransferPaymentProps {
  orderNumber: string;
  amount: number;
}

export function BankTransferPayment({ orderNumber, amount }: BankTransferPaymentProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const bankDetails = {
    accountName: 'BrickMini LLC',
    accountNumber: '1234567890',
    routingNumber: '021000021',
    bankName: 'Example Bank',
    swiftCode: 'EXBKUS33',
    reference: orderNumber
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Bank Transfer Details</h3>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-900 font-medium mb-2">
          Please transfer the exact amount to the following bank account:
        </p>
        <p className="text-lg font-bold text-amber-900">${amount.toFixed(2)} USD</p>
      </div>

      <div className="space-y-3 mb-4">
        <BankDetailRow
          label="Account Name"
          value={bankDetails.accountName}
          onCopy={() => copyToClipboard(bankDetails.accountName, 'accountName')}
          copied={copiedField === 'accountName'}
        />
        <BankDetailRow
          label="Account Number"
          value={bankDetails.accountNumber}
          onCopy={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')}
          copied={copiedField === 'accountNumber'}
        />
        <BankDetailRow
          label="Routing Number"
          value={bankDetails.routingNumber}
          onCopy={() => copyToClipboard(bankDetails.routingNumber, 'routingNumber')}
          copied={copiedField === 'routingNumber'}
        />
        <BankDetailRow
          label="Bank Name"
          value={bankDetails.bankName}
          onCopy={() => copyToClipboard(bankDetails.bankName, 'bankName')}
          copied={copiedField === 'bankName'}
        />
        <BankDetailRow
          label="SWIFT Code"
          value={bankDetails.swiftCode}
          onCopy={() => copyToClipboard(bankDetails.swiftCode, 'swiftCode')}
          copied={copiedField === 'swiftCode'}
        />
        <BankDetailRow
          label="Reference Number"
          value={bankDetails.reference}
          onCopy={() => copyToClipboard(bankDetails.reference, 'reference')}
          copied={copiedField === 'reference'}
          highlight
        />
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-900 font-semibold mb-2">Important:</p>
        <ul className="text-sm text-red-900 space-y-1 list-disc list-inside">
          <li>Include the reference number in your transfer</li>
          <li>Payment must be received within 3 business days</li>
          <li>Order will be processed after payment verification</li>
          <li>You will receive a confirmation email once payment is verified</li>
        </ul>
      </div>
    </div>
  );
}

interface BankDetailRowProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  highlight?: boolean;
}

function BankDetailRow({ label, value, onCopy, copied, highlight }: BankDetailRowProps) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
      <div>
        <div className="text-xs text-gray-600 mb-1">{label}</div>
        <div className={`font-semibold ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>{value}</div>
      </div>
      <button
        onClick={onCopy}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <Copy className="w-5 h-5 text-gray-600" />
        )}
      </button>
    </div>
  );
}
