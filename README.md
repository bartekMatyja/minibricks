# Minibricks Storefront

This project is a Vite + React storefront that loads catalogue data and creates orders through a WooCommerce backend.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- A reachable WordPress instance with the WooCommerce plugin enabled
- WooCommerce REST API consumer key and secret with permission to read products and create orders

## Configuration

1. In your WooCommerce dashboard generate a REST API key pair (Consumer Key & Consumer Secret) with **Read/Write** permissions.
2. Allow CORS requests from the domain where this frontend will run (e.g. `http://localhost:5173`). A plugin such as "Disable REST API CORS" or a small snippet in `functions.php` can add the necessary headers if your host does not send them by default.
3. Create a `.env.local` file in the project root and populate it with your WooCommerce details:
   ```bash
   VITE_WC_BASE_URL=https://your-wordpress-site.com
   VITE_WC_CONSUMER_KEY=ck_...
   VITE_WC_CONSUMER_SECRET=cs_...
   ```
   > The consumer credentials are embedded in the browser bundle. Restrict their permissions to only the endpoints you need and rotate them regularly. For production deployments consider proxying WooCommerce requests through your own backend.

If you previously used Supabase with this project you can remove the related environment variables—they are no longer used.

## Installation

```bash
npm install
```

## Running in development

```bash
npm run dev
```

The Vite dev server defaults to [http://localhost:5173](http://localhost:5173). When the app mounts it fetches products from `VITE_WC_BASE_URL/wp-json/wc/v3/products`. If WooCommerce is unreachable a fallback catalogue and error banner are shown.

## Building for production

```bash
npm run build
```

To preview the production build locally run:

```bash
npm run preview
```

Deploy the contents of the `dist/` directory to your static hosting provider. Ensure the deployed origin is allowed by your WooCommerce CORS configuration.

## Checkout flow overview

- Cart state and payment UI live entirely in the React application.
- Stripe and PayPal components continue to manage their respective payment flows, but final order creation happens through the WooCommerce REST API.
- For offline methods (bank transfer or cash on delivery) the checkout form posts directly to WooCommerce with the chosen `payment_method`.
- After WooCommerce confirms the order the frontend clears the cart, shows the confirmation view, and optionally sends the payload to the configured Make.com webhook.

Refer to `src/lib/woocommerce.ts` and `src/lib/orders.ts` for details about the WooCommerce integration.
