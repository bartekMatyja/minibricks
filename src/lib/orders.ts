import { wooCommerceFetch } from './woocommerce';

export type PaymentMethod = 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank_transfer' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface OrderData {
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  totalAmount: number;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentIntentId?: string;
  paypalOrderId?: string;
  transactionId?: string;
  paymentProcessor?: string;
  paymentMetadata?: Record<string, any>;
}

export interface OrderItem {
  productId: number;
  productName: string;
  productTagline: string;
  price: number;
  quantity: number;
}

export interface OrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  error?: string;
}

interface WooCommerceAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  email?: string;
}

interface WooCommerceOrderLineItemMeta {
  key: string;
  value: string;
}

interface WooCommerceOrderLineItem {
  product_id: number;
  quantity: number;
  meta_data?: WooCommerceOrderLineItemMeta[];
}

interface WooCommerceOrderPayload {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: WooCommerceAddress;
  shipping: WooCommerceAddress;
  line_items: WooCommerceOrderLineItem[];
  meta_data?: WooCommerceOrderLineItemMeta[];
}

interface WooCommerceOrderResponse {
  id: number | string;
  number?: number | string;
  order_key?: string;
  status?: string;
}

export async function createOrder(orderData: OrderData): Promise<OrderResult> {
  try {
    const paymentConfig: Record<PaymentMethod, { method: string; title: string; setPaid: boolean }> = {
      credit_card: { method: 'stripe', title: 'Credit Card', setPaid: true },
      paypal: { method: 'paypal', title: 'PayPal', setPaid: true },
      apple_pay: { method: 'stripe', title: 'Apple Pay', setPaid: true },
      google_pay: { method: 'stripe', title: 'Google Pay', setPaid: true },
      bank_transfer: { method: 'bacs', title: 'Bank Transfer', setPaid: false },
      cash_on_delivery: { method: 'cod', title: 'Cash on Delivery', setPaid: false },
    };

    const selectedPaymentConfig = paymentConfig[orderData.paymentMethod] ?? {
      method: 'stripe',
      title: 'Online Payment',
      setPaid: true,
    };

    const metaData = [
      { key: 'minibricks_payment_method', value: orderData.paymentMethod },
      orderData.paymentProcessor ? { key: 'minibricks_payment_processor', value: orderData.paymentProcessor } : null,
      orderData.paymentIntentId ? { key: 'minibricks_payment_intent_id', value: orderData.paymentIntentId } : null,
      orderData.paypalOrderId ? { key: 'minibricks_paypal_order_id', value: orderData.paypalOrderId } : null,
      orderData.transactionId ? { key: 'minibricks_transaction_id', value: orderData.transactionId } : null,
      { key: 'minibricks_order_total', value: orderData.totalAmount.toFixed(2) },
    ].filter((entry): entry is { key: string; value: string } => Boolean(entry?.value));

    const lineItems = orderData.items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      meta_data: item.productTagline
        ? [
            {
              key: 'tagline',
              value: item.productTagline,
            },
          ]
        : undefined,
    }));

    const billing = {
      first_name: orderData.customerFirstName,
      last_name: orderData.customerLastName,
      address_1: orderData.shippingAddress,
      city: orderData.shippingCity,
      state: orderData.shippingState,
      postcode: orderData.shippingZip,
      email: orderData.customerEmail,
    };

    const shipping = {
      first_name: orderData.customerFirstName,
      last_name: orderData.customerLastName,
      address_1: orderData.shippingAddress,
      city: orderData.shippingCity,
      state: orderData.shippingState,
      postcode: orderData.shippingZip,
    };

    const order = await wooCommerceFetch<WooCommerceOrderResponse>('orders', {
      method: 'POST',
      body: {
        payment_method: selectedPaymentConfig.method,
        payment_method_title: selectedPaymentConfig.title,
        set_paid: selectedPaymentConfig.setPaid,
        billing,
        shipping,
        line_items: lineItems,
        meta_data: metaData,
      } satisfies WooCommerceOrderPayload,
    });

    if (!order || !order.id) {
      return { success: false, error: 'WooCommerce did not return a valid order response.' };
    }

    const orderNumber = order.number ? String(order.number) : String(order.id);

    return {
      success: true,
      orderNumber,
      orderId: String(order.id),
    };
  } catch (error) {
    console.error('Unexpected error creating order:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
    return { success: false, error: message };
  }
}

export async function sendOrderToMake(orderData: OrderData, orderNumber: string, orderId: string): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === 'your_make_webhook_url_here') {
    console.warn('Make.com webhook URL not configured. Skipping webhook notification.');
    return false;
  }

  try {
    const payload = {
      orderNumber,
      orderId,
      customer: {
        firstName: orderData.customerFirstName,
        lastName: orderData.customerLastName,
        email: orderData.customerEmail,
        fullName: `${orderData.customerFirstName} ${orderData.customerLastName}`
      },
      shipping: {
        address: orderData.shippingAddress,
        city: orderData.shippingCity,
        state: orderData.shippingState,
        zip: orderData.shippingZip,
        fullAddress: `${orderData.shippingAddress}, ${orderData.shippingCity}, ${orderData.shippingState} ${orderData.shippingZip}`
      },
      items: orderData.items.map(item => ({
        productId: item.productId,
        name: item.productName,
        tagline: item.productTagline,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      totalAmount: orderData.totalAmount,
      orderDate: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to send order to Make.com:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending order to Make.com:', error);
    return false;
  }
}
