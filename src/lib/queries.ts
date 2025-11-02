/**
 * Shopify Storefront API GraphQL queries
 * Updated to include essential product fields for FitFinder functionality
 */

export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          # Basic product information
          id
          title
          handle
          description
          descriptionHtml
          productType
          vendor
          availableForSale
          createdAt
          updatedAt
          publishedAt
          tags
          
          # SEO
          seo {
            title
            description
          }
          
          # Online store
          onlineStoreUrl
          isGiftCard
          
          # Featured image
          featuredImage {
            id
            url
            width
            height
            altText
          }
          
          # Price ranges
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          
          # Product options (like "Size", "Color") - Important for fit matching
          options {
            id
            name
            values
          }
          
          # All variants - Important for size/fit data
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                barcode
                availableForSale
                currentlyNotInStock
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                # quantityAvailable removed (requires inventory scope)
                weight
                weightUnit
                requiresShipping
                selectedOptions {
                  name
                  value
                }
                image {
                  id
                  url
                  width
                  height
                  altText
                }
              }
            }
          }
          
          # Metafields - For custom size/dimension data
          metafields(identifiers: [
            {namespace: "custom", key: "dimensions"},
            {namespace: "custom", key: "sizes"},
            {namespace: "custom", key: "fit_notes"},
            {namespace: "custom", key: "features"}
          ]) {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      productType
      vendor
      availableForSale
      createdAt
      updatedAt
      publishedAt
      tags
      
      seo {
        title
        description
      }
      
      onlineStoreUrl
      isGiftCard
      
      featuredImage {
        id
        url
        width
        height
        altText
      }
      
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      
      options {
        id
        name
        values
      }
      
      variants(first: 100) {
        edges {
          node {
            id
            title
            sku
            barcode
            availableForSale
            currentlyNotInStock
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            # quantityAvailable removed (requires inventory scope)
            weight
            weightUnit
            requiresShipping
            selectedOptions {
              name
              value
            }
            image {
              id
              url
              width
              height
              altText
            }
          }
        }
      }
      
      # Metafields - For custom size/dimension data
      metafields(identifiers: [
        {namespace: "custom", key: "dimensions"},
        {namespace: "custom", key: "sizes"},
        {namespace: "custom", key: "fit_notes"},
        {namespace: "custom", key: "features"}
      ]) {
        namespace
        key
        value
      }
    }
  }
`;

export const SEARCH_PRODUCTS_QUERY = /* GraphQL */ `
  query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          description
          descriptionHtml
          productType
          vendor
          availableForSale
          featuredImage {
            id
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          options {
            id
            name
            values
          }
          variants(first: 10) {
            edges {
              node {
                title
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Minimal query for FitFinder - only essential fields
export const MINIMAL_PRODUCTS_QUERY = /* GraphQL */ `
  query MinimalProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          availableForSale
          onlineStoreUrl
          tags
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 50) {
            edges {
              node {
                id
                sku
                availableForSale
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;