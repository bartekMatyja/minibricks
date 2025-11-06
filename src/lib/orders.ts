import { supabase } from './supabase';

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

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function createOrder(orderData: OrderData): Promise<OrderResult> {
  try {
    const orderNumber = generateOrderNumber();

    console.log('Creating order with data:', { orderNumber, ...orderData });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_first_name: orderData.customerFirstName,
        customer_last_name: orderData.customerLastName,
        customer_email: orderData.customerEmail,
        shipping_address: orderData.shippingAddress,
        shipping_city: orderData.shippingCity,
        shipping_state: orderData.shippingState,
        shipping_zip: orderData.shippingZip,
        total_amount: orderData.totalAmount,
        order_status: 'pending',
        payment_method: orderData.paymentMethod,
        payment_status: orderData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'processing',
        payment_intent_id: orderData.paymentIntentId,
        paypal_order_id: orderData.paypalOrderId,
        transaction_id: orderData.transactionId,
        payment_processor: orderData.paymentProcessor,
        payment_metadata: orderData.paymentMetadata
      })
      .select()
      .single();

    console.log('Insert result:', { order, orderError });

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { success: false, error: `Failed to create order: ${orderError.message}` };
    }

    if (!order) {
      return { success: false, error: 'Failed to create order. Please try again.' };
    }

    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      product_tagline: item.productTagline,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return { success: false, error: 'Failed to save order items. Please contact support.' };
    }

    return {
      success: true,
      orderNumber: order.order_number,
      orderId: order.id
    };
  } catch (error) {
    console.error('Unexpected error creating order:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
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
