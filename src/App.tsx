import { useEffect, useState } from 'react';
import { ShoppingCart, Search, Menu, X, Star, ChevronLeft, ChevronRight, Package, Sparkles, Gift, Trash2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { createOrder, sendOrderToMake, type OrderData, type PaymentMethod } from './lib/orders';
import { PaymentMethodSelector } from './components/PaymentMethodSelector';
import { StripePayment } from './components/StripePayment';
import { PayPalPayment } from './components/PayPalPayment';
import { BankTransferPayment } from './components/BankTransferPayment';
import { CashOnDeliveryPayment } from './components/CashOnDeliveryPayment';
import { fetchWooCommerceProducts } from './lib/woocommerce';

import { fallbackProducts, resolveFallbackImage } from './data/fallbackCatalogue';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Product {
  id: number;
  name: string;
  tagline?: string;
  price: number;
  image: string;
  bestseller?: boolean;
}

interface CartItem extends Product {
  quantity: number;
}


const resolvedFallbackProducts: Product[] = fallbackProducts.map((product) => ({
  ...product,
  image: resolveFallbackImage(product.image),
}));

const fallbackProducts: Product[] = [
  { id: 1, name: 'Mini Retro Car', tagline: 'Small set, big fun.', price: 12.99, image: 'https://images.pexels.com/photos/35619/capri-ford-oldtimer-automotive.jpg?auto=compress&cs=tinysrgb&w=800', bestseller: true },
  { id: 2, name: 'Cosmic Robot', tagline: 'Build your own galactic buddy.', price: 14.99, image: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800', bestseller: true },
  { id: 3, name: 'Castle in the Clouds', tagline: 'For dreamers and creators.', price: 18.99, image: 'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800', bestseller: true },
  { id: 4, name: 'Ocean Explorer', tagline: 'Dive into creativity.', price: 16.99, image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 5, name: 'Space Station', tagline: 'Build your own orbit.', price: 22.99, image: 'https://images.pexels.com/photos/73910/mars-mars-rover-space-travel-robot-73910.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 6, name: 'Jungle Temple', tagline: 'Adventure awaits.', price: 19.99, image: 'https://images.pexels.com/photos/1660996/pexels-photo-1660996.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const testimonials = [
  { name: 'Sarah M.', text: 'These sets are perfect for my kids and me! Quality is amazing.', rating: 5 },
  { name: 'James T.', text: 'Love the mini format. Great for my desk at work!', rating: 5 },
  { name: 'Emily R.', text: 'Creative designs and excellent packaging. Highly recommend!', rating: 5 },
];

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [tempOrderNumber, setTempOrderNumber] = useState('');
  const [addToCartModalOpen, setAddToCartModalOpen] = useState(false);
  const [animatingProduct, setAnimatingProduct] = useState<number | null>(null);
  const [animationStart, setAnimationStart] = useState<{x: number, y: number} | null>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [numberPop, setNumberPop] = useState(false);
  const [cartPosition, setCartPosition] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const wooProducts = await fetchWooCommerceProducts();

        if (!isMounted) {
          return;
        }

        const normalizedProducts = wooProducts
          .map((product) => {
            const priceString = product.price || product.regular_price || product.sale_price || '0';
            const parsedPrice = Number.parseFloat(priceString);
            if (!Number.isFinite(parsedPrice)) {
              return null;
            }

            const rawTagline = product.short_description || product.description || '';
            const cleanedTagline = rawTagline
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            return {
              id: product.id,
              name: product.name,
              tagline: cleanedTagline || undefined,
              price: parsedPrice,
              image: product.images?.[0]?.src || 'https://images.pexels.com/photos/1871318/pexels-photo-1871318.jpeg?auto=compress&cs=tinysrgb&w=800',
              bestseller: Boolean(product.featured),
            } satisfies Product;
          })
          .filter((product): product is Product => product !== null);

        if (normalizedProducts.length === 0) {

          setProducts(resolvedFallbackProducts);

          setProducts(fallbackProducts);
          setProductsError('No products were returned from WooCommerce. Showing fallback catalogue.');
        } else {
          setProducts(normalizedProducts);
          setProductsError(null);
        }
      } catch (error) {
        console.error('Failed to load WooCommerce products:', error);
        if (!isMounted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load products from WooCommerce.';
        setProductsError(`${message} Showing fallback catalogue.`);

        setProducts(resolvedFallbackProducts);

        setProducts(fallbackProducts);

      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const bestsellers = products.filter(p => p.bestseller);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = searchQuery
    ? products.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          (p.tagline?.toLowerCase() ?? '').includes(query)
        );
      })
    : products;

  useEffect(() => {
    setCurrentSlide(prev => {
      if (bestsellers.length === 0) {
        return 0;
      }
      return Math.min(prev, bestsellers.length - 1);
    });
  }, [bestsellers.length]);

  const handleAddToCart = (product: Product, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const cartButton = document.querySelector('[data-cart-button]');
    if (cartButton) {
      const cartRect = cartButton.getBoundingClientRect();
      setCartPosition({
        x: cartRect.left + cartRect.width / 2,
        y: cartRect.top + cartRect.height / 2
      });
    }

    setAnimationStart({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });

    setAnimatingProduct(product.id);

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });

    setTimeout(() => {
      setAnimatingProduct(null);
      setCartBounce(true);
      setCartPulse(true);
      setNumberPop(true);
      setTimeout(() => {
        setCartBounce(false);
        setCartPulse(false);
        setNumberPop(false);
      }, 600);
      setAddToCartModalOpen(true);
    }, 650);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const nextSlide = () => {
    if (bestsellers.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % bestsellers.length);
  };

  const prevSlide = () => {
    if (bestsellers.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + bestsellers.length) % bestsellers.length);
  };

  const smoothScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setMobileMenuOpen(false);
    }
  };

  const validateCheckoutForm = () => {
    const errors: {[key: string]: string} = {};

    if (!checkoutForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!checkoutForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!checkoutForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!checkoutForm.address.trim()) errors.address = 'Address is required';
    if (!checkoutForm.city.trim()) errors.city = 'City is required';
    if (!checkoutForm.state.trim()) errors.state = 'State is required';
    if (!checkoutForm.zip.trim()) {
      errors.zip = 'ZIP code is required';
    } else if (!/^\d{5}$/.test(checkoutForm.zip)) {
      errors.zip = 'ZIP code must be 5 digits';
    }

    if (!selectedPaymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!selectedPaymentMethod) return;

    setPaymentProcessing(true);
    setPaymentError('');

    try {
      const orderData: OrderData = {
        customerFirstName: checkoutForm.firstName,
        customerLastName: checkoutForm.lastName,
        customerEmail: checkoutForm.email,
        shippingAddress: checkoutForm.address,
        shippingCity: checkoutForm.city,
        shippingState: checkoutForm.state,
        shippingZip: checkoutForm.zip,
        totalAmount: cartTotal,
        paymentMethod: selectedPaymentMethod,
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          productTagline: item.tagline ?? '',
          price: item.price,
          quantity: item.quantity
        }))
      };

      if (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'apple_pay' || selectedPaymentMethod === 'google_pay') {
        orderData.paymentIntentId = paymentId;
        orderData.paymentProcessor = 'stripe';
      } else if (selectedPaymentMethod === 'paypal') {
        orderData.paypalOrderId = paymentId;
        orderData.paymentProcessor = 'paypal';
      }

      orderData.transactionId = paymentId;

      const result = await createOrder(orderData);

      if (!result.success) {
        setPaymentError(result.error || 'Failed to create order. Please try again.');
        setPaymentProcessing(false);
        return;
      }

      if (result.orderNumber && result.orderId) {
        await sendOrderToMake(orderData, result.orderNumber, result.orderId);
        setOrderNumber(result.orderNumber);
      }

      setCheckoutOpen(false);
      setOrderComplete(true);
      setPaymentProcessing(false);

      setTimeout(() => {
        setOrderComplete(false);
        setCartItems([]);
        setCheckoutForm({
          firstName: '',
          lastName: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: ''
        });
        setFieldErrors({});
        setSelectedPaymentMethod(null);
        setOrderNumber('');
        setTempOrderNumber('');
      }, 5000);
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentError('An unexpected error occurred. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateCheckoutForm()) {
      return;
    }

    if (selectedPaymentMethod === 'bank_transfer' || selectedPaymentMethod === 'cash_on_delivery') {
      setIsSubmitting(true);

      try {
        const orderData: OrderData = {
          customerFirstName: checkoutForm.firstName,
          customerLastName: checkoutForm.lastName,
          customerEmail: checkoutForm.email,
          shippingAddress: checkoutForm.address,
          shippingCity: checkoutForm.city,
          shippingState: checkoutForm.state,
          shippingZip: checkoutForm.zip,
          totalAmount: cartTotal,
          paymentMethod: selectedPaymentMethod,
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          productTagline: item.tagline ?? '',
          price: item.price,
          quantity: item.quantity
        }))
      };

        const result = await createOrder(orderData);

        if (!result.success) {
          alert(result.error || 'Failed to place order. Please try again.');
          setIsSubmitting(false);
          return;
        }

        if (result.orderNumber && result.orderId) {
          await sendOrderToMake(orderData, result.orderNumber, result.orderId);
          setOrderNumber(result.orderNumber);
          setTempOrderNumber(result.orderNumber);
        }

        if (selectedPaymentMethod === 'bank_transfer') {
          return;
        }

        setCheckoutOpen(false);
        setOrderComplete(true);

        setTimeout(() => {
          setOrderComplete(false);
          setCartItems([]);
          setCheckoutForm({
            firstName: '',
            lastName: '',
            email: '',
            address: '',
            city: '',
            state: '',
            zip: ''
          });
          setFieldErrors({});
          setSelectedPaymentMethod(null);
          setOrderNumber('');
          setTempOrderNumber('');
        }, 5000);
      } catch (error) {
        console.error('Error placing order:', error);
        alert('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test', currency: 'USD' }}>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 via-blue-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BrickMini</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => smoothScrollTo('shop')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Shop</button>
              <button onClick={() => smoothScrollTo('new')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">New Arrivals</button>
              <button onClick={() => smoothScrollTo('about')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About Us</button>
              <button onClick={() => smoothScrollTo('contact')} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</button>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setCartOpen(!cartOpen)}
                className={`relative p-2 hover:bg-gray-100 rounded-full transition-all ${cartBounce ? 'animate-cartBounce' : ''} ${cartPulse ? 'animate-cartPulse' : ''}`}
                data-cart-button
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartCount > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold transition-all ${numberPop ? 'animate-numberPop' : ''}`}>
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white animate-slideDown">
            <nav className="px-4 py-4 space-y-3">
              <button onClick={() => smoothScrollTo('shop')} className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium">Shop</button>
              <button onClick={() => smoothScrollTo('new')} className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium">New Arrivals</button>
              <button onClick={() => smoothScrollTo('about')} className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium">About Us</button>
              <button onClick={() => smoothScrollTo('contact')} className="block w-full text-left text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</button>
            </nav>
          </div>
        )}

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {/* Flying Product Animation */}
      {animatingProduct !== null && animationStart && cartPosition && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{
            left: `${animationStart.x}px`,
            top: `${animationStart.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative">
            <img
              src={products.find(p => p.id === animatingProduct)?.image || 'https://images.pexels.com/photos/1871318/pexels-photo-1871318.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt="Flying product"
              className="w-24 h-24 rounded-xl shadow-2xl"
              style={{
                animation: `flyToCart 0.65s ease-out forwards`,
                '--cart-x': `${cartPosition.x - animationStart.x}px`,
                '--cart-y': `${cartPosition.y - animationStart.y}px`,
                willChange: 'transform, opacity'
              } as React.CSSProperties}
            />
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                animation: `flyToCart 0.65s ease-out forwards`,
                '--cart-x': `${cartPosition.x - animationStart.x}px`,
                '--cart-y': `${cartPosition.y - animationStart.y}px`,
                boxShadow: '0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)',
                pointerEvents: 'none',
                willChange: 'transform, opacity'
              } as React.CSSProperties}
            />
          </div>
        </div>
      )}

      {/* Add to Cart Modal */}
      {addToCartModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setAddToCartModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Added to Cart!</h2>
                </div>
                <button
                  onClick={() => setAddToCartModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Your cart is empty</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">${item.price}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="ml-auto p-2 hover:bg-red-100 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t p-6 space-y-4 bg-gray-50">
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-2xl">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setAddToCartModalOpen(false)}
                        className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                      >
                        Continue Shopping
                      </button>
                      <button
                        onClick={() => {
                          setAddToCartModalOpen(false);
                          setCheckoutOpen(true);
                        }}
                        className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Checkout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-overlayFadeIn"
            onClick={() => setCheckoutOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeInSlideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="First Name *"
                          value={checkoutForm.firstName}
                          onChange={(e) => {
                            setCheckoutForm({...checkoutForm, firstName: e.target.value});
                            if (fieldErrors.firstName) {
                              const newErrors = {...fieldErrors};
                              delete newErrors.firstName;
                              setFieldErrors(newErrors);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                        />
                        {fieldErrors.firstName && (
                          <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Last Name *"
                          value={checkoutForm.lastName}
                          onChange={(e) => {
                            setCheckoutForm({...checkoutForm, lastName: e.target.value});
                            if (fieldErrors.lastName) {
                              const newErrors = {...fieldErrors};
                              delete newErrors.lastName;
                              setFieldErrors(newErrors);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                        />
                        {fieldErrors.lastName && (
                          <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email *"
                        value={checkoutForm.email}
                        onChange={(e) => {
                          setCheckoutForm({...checkoutForm, email: e.target.value});
                          if (fieldErrors.email) {
                            const newErrors = {...fieldErrors};
                            delete newErrors.email;
                            setFieldErrors(newErrors);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                      />
                      {fieldErrors.email && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Address *"
                        value={checkoutForm.address}
                        onChange={(e) => {
                          setCheckoutForm({...checkoutForm, address: e.target.value});
                          if (fieldErrors.address) {
                            const newErrors = {...fieldErrors};
                            delete newErrors.address;
                            setFieldErrors(newErrors);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                      />
                      {fieldErrors.address && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.address}</p>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder="City *"
                          value={checkoutForm.city}
                          onChange={(e) => {
                            setCheckoutForm({...checkoutForm, city: e.target.value});
                            if (fieldErrors.city) {
                              const newErrors = {...fieldErrors};
                              delete newErrors.city;
                              setFieldErrors(newErrors);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                        />
                        {fieldErrors.city && (
                          <p className="text-red-600 text-sm mt-1">{fieldErrors.city}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="State *"
                          value={checkoutForm.state}
                          onChange={(e) => {
                            setCheckoutForm({...checkoutForm, state: e.target.value});
                            if (fieldErrors.state) {
                              const newErrors = {...fieldErrors};
                              delete newErrors.state;
                              setFieldErrors(newErrors);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                        />
                        {fieldErrors.state && (
                          <p className="text-red-600 text-sm mt-1">{fieldErrors.state}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="ZIP *"
                          value={checkoutForm.zip}
                          onChange={(e) => {
                            setCheckoutForm({...checkoutForm, zip: e.target.value});
                            if (fieldErrors.zip) {
                              const newErrors = {...fieldErrors};
                              delete newErrors.zip;
                              setFieldErrors(newErrors);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.zip ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-blue-500 focus:outline-none`}
                        />
                        {fieldErrors.zip && (
                          <p className="text-red-600 text-sm mt-1">{fieldErrors.zip}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <PaymentMethodSelector
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={(method) => {
                      setSelectedPaymentMethod(method);
                      setPaymentError('');
                      if (fieldErrors.paymentMethod) {
                        const newErrors = {...fieldErrors};
                        delete newErrors.paymentMethod;
                        setFieldErrors(newErrors);
                      }
                    }}
                  />
                  {fieldErrors.paymentMethod && (
                    <p className="text-red-600 text-sm mt-2">{fieldErrors.paymentMethod}</p>
                  )}
                </div>

                {/* Payment Details Based on Selected Method */}
                {selectedPaymentMethod === 'credit_card' && (
                  <Elements stripe={stripePromise}>
                    <StripePayment
                      amount={cartTotal}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={(error) => setPaymentError(error)}
                    />
                  </Elements>
                )}

                {selectedPaymentMethod === 'paypal' && (
                  <PayPalPayment
                    amount={cartTotal}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={(error) => setPaymentError(error)}
                  />
                )}

                {selectedPaymentMethod === 'bank_transfer' && tempOrderNumber && (
                  <BankTransferPayment
                    orderNumber={tempOrderNumber}
                    amount={cartTotal}
                  />
                )}

                {selectedPaymentMethod === 'bank_transfer' && !tempOrderNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      Click "Place Order" below to receive your bank transfer details.
                    </p>
                  </div>
                )}

                {selectedPaymentMethod === 'cash_on_delivery' && (
                  <CashOnDeliveryPayment amount={cartTotal} />
                )}

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900">{paymentError}</p>
                  </div>
                )}

                {/* Place Order Button */}
                {(selectedPaymentMethod === 'bank_transfer' || selectedPaymentMethod === 'cash_on_delivery') && !tempOrderNumber && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || paymentProcessing}
                    className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Processing Order...' : `Place Order - $${cartTotal.toFixed(2)}`}
                  </button>
                )}

                {selectedPaymentMethod === 'credit_card' && (
                  <button
                    onClick={() => {
                      if (validateCheckoutForm()) {
                        const stripePayment = document.querySelector('[data-stripe-payment]');
                        if (stripePayment) {
                          (stripePayment as any).handleSubmit?.();
                        }
                      }
                    }}
                    disabled={isSubmitting || paymentProcessing}
                    className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {paymentProcessing ? 'Processing Payment...' : `Pay $${cartTotal.toFixed(2)}`}
                  </button>
                )}

                {tempOrderNumber && selectedPaymentMethod === 'bank_transfer' && (
                  <button
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderComplete(true);
                      setTimeout(() => {
                        setOrderComplete(false);
                        setCartItems([]);
                        setCheckoutForm({
                          firstName: '',
                          lastName: '',
                          email: '',
                          address: '',
                          city: '',
                          state: '',
                          zip: ''
                        });
                        setFieldErrors({});
                        setSelectedPaymentMethod(null);
                        setOrderNumber('');
                        setTempOrderNumber('');
                      }, 100);
                    }}
                    className="w-full bg-green-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-green-700 transition-colors"
                  >
                    I've Noted the Transfer Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Order Complete Message */}
      {orderComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
            <p className="text-gray-600 mb-2">Your order number is: <span className="font-bold text-blue-600">{orderNumber}</span></p>
            <p className="text-gray-600">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
          </div>
        </div>
      )}

      {/* Shopping Cart Sidebar */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-overlayFadeIn"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Your cart is empty</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">${item.price}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="ml-auto p-2 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t p-6 space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-2xl">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="w-full bg-blue-600 text-white py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors"
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-yellow-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">Imagination</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover creative brick sets that inspire you to build more.
              </p>
              <button
                onClick={() => smoothScrollTo('shop')}
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Shop Now
              </button>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1871318/pexels-photo-1871318.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Colorful brick sets"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-gray-900 px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                New Arrivals!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="new" className="py-16 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div onClick={() => smoothScrollTo('shop')} className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform cursor-pointer shadow-lg">
              <Package className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Mini Sets</h3>
              <p className="text-red-100">Perfect for quick builds</p>
            </div>
            <div onClick={() => smoothScrollTo('shop')} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform cursor-pointer shadow-lg">
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">New Arrivals</h3>
              <p className="text-blue-100">Latest designs just dropped</p>
            </div>
            <div onClick={() => smoothScrollTo('shop')} className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform cursor-pointer shadow-lg">
              <Gift className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Creative Bundles</h3>
              <p className="text-yellow-100">Save on combo packs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="shop" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Collection</h2>
            <p className="text-lg text-gray-600">Handpicked sets for every creator</p>
          </div>
          {productsError && (
            <div className="max-w-2xl mx-auto mb-8 bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-xl">
              {productsError}
            </div>
          )}
          {loadingProducts ? (
            <div className="text-center text-gray-600">Loading products from WooCommerce...</div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-gray-600">No products found. Please adjust your filters or try again later.</p>
          ) : (
            <>
              {searchQuery && (
                <div className="text-center mb-8">
                  <p className="text-gray-600">
                    {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-2 group">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 mb-4">{product.tagline || 'Discover more with BrickMini.'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Best Sellers Carousel */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Best Sellers</h2>
          {bestsellers.length === 0 ? (
            <p className="text-center text-gray-300">Best seller products will appear here once they are marked as featured in WooCommerce.</p>
          ) : (
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {bestsellers.map((product) => (
                    <div key={product.id} className="min-w-full px-4">
                      <div className="grid md:grid-cols-2 gap-8 items-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                        <div className="aspect-square rounded-xl overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold mb-4">{product.name}</h3>
                          <p className="text-xl text-gray-300 mb-6">{product.tagline || 'Discover more with BrickMini.'}</p>
                          <div className="flex items-center space-x-4 mb-8">
                            <span className="text-4xl font-bold">${product.price}</span>
                            <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">Bestseller</span>
                          </div>
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-gray-900 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-lg leading-relaxed">"{testimonial.text}"</p>
                <p className="font-bold text-gray-900">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">About BrickMini</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            We design compact brick kits that spark imagination and bring joy to every age.
            Each set is carefully crafted to provide the perfect balance of challenge and fun,
            whether you're a beginner or an experienced builder. Our mission is to make creativity
            accessible, portable, and endlessly enjoyable.
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-xl text-blue-100 mb-8">Get new sets and exclusive offers delivered to your inbox</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 via-blue-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">BrickMini</span>
              </div>
              <p className="text-gray-400">Building imagination, one brick at a time.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <p className="text-gray-400">Email: hello@brickmini.com</p>
              <p className="text-gray-400">Phone: (555) 123-4567</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BrickMini. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </PayPalScriptProvider>
  );
}

export default App;
