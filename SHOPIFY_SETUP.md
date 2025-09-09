# Shopify Storefront API Setup Guide

This guide walks you through setting up the Shopify Storefront API for your Next.js application.

## 1. Create a Storefront API Access Token

1. **Log in to your Shopify admin panel**
   - Go to `https://your-store.myshopify.com/admin`
   - Replace `your-store` with your actual store name

2. **Navigate to API credentials**
   - Go to `Apps and sales channels` in the left sidebar
   - Click on `Develop apps` at the bottom (if you don't see this, you may need to enable developer features)
   - Click `Create an app`

3. **Create a custom app**
   - Give your app a name (e.g., "FitFinder Storefront")
   - Add a brief description of what your app will do
   - Click `Create app`

4. **Configure API access**
   - In your newly created app, click on `API credentials`
   - Click `Configure Storefront API scopes`
   - Select the following scopes (at minimum):
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_product_inventory`
     - `unauthenticated_read_product_tags`
     - `unauthenticated_read_collection_listings`
   - Click `Save`

5. **Create a Storefront API access token**
   - Back on the API credentials page, click `Install app` (if not already installed)
   - Under "Storefront API", click `Create token`
   - Give your token a name (e.g., "FitFinder Frontend Token")
   - Click `Save`
   - **IMPORTANT:** Copy your Storefront API access token immediately. It starts with `shpat_` and you won't be able to see it again!

## 2. Configure Environment Variables

1. **Add to your `.env.local` file**

   ```
   NEXT_PUBLIC_SHOPIFY_STORE_URL=your-store.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_token_here
   ```

2. **Add to deployment environment**
   - If using Vercel, add these same environment variables in your project settings

## 3. Testing Your API Connection

After setting up your environment variables, you can test your connection by making a request to the API endpoint:

```
/api/shopify/products
```

The response should include detailed product data from your Shopify store. If you see an error, check:

1. Your environment variables are correctly set
2. The token has the proper scopes
3. Your Shopify store has products available

## 4. API Endpoint Options

The product API supports the following query parameters:

- `limit` - Number of products to return (default: 12)
- `cursor` - Pagination cursor for fetching additional pages

Example:
```
/api/shopify/products?limit=20&cursor=abc123
```

## 5. Troubleshooting Common Issues

### Authentication Errors (401)

If you see a 401 error:
- Verify your `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` is correct
- Check that the token starts with `shpat_`
- Ensure the app is installed in your Shopify store
- Try generating a new token if necessary

### Permission Errors

If you can authenticate but not access certain data:
- Check that your token has the necessary scopes
- Verify the products/collections are published to the Storefront API

### Rate Limiting

The Shopify Storefront API has rate limits. If you hit them:
- Implement caching for frequently accessed data
- Reduce the frequency of requests
- Consider using a webhook-based approach for real-time updates

## 6. Additional Resources

- [Shopify Storefront API Documentation](https://shopify.dev/docs/api/storefront)
- [GraphQL API Reference](https://shopify.dev/docs/api/storefront/reference)
- [Shopify React Hooks Library](https://github.com/Shopify/hydrogen)
