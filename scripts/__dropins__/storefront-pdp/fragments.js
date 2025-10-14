/*! Copyright 2025 Adobe
All Rights Reserved. */
const e=`
fragment PRODUCT_OPTION_FRAGMENT on ProductViewOption {
    id
    title
    required
    multi
    values {
      id
      title
      inStock
      __typename
      ... on ProductViewOptionValueProduct {
        title
        quantity
        isDefault
        __typename
        product {
          sku
          shortDescription
          metaDescription
          metaKeyword
          metaTitle
          name
          price {
            final {
              amount {
                value
                currency
              }
            }
            regular {
              amount {
                value
                currency
              }
            }
            roles
          }
        }
      }
      ... on ProductViewOptionValueSwatch {
        id
        title
        type
        value
        inStock
      }
    }
  }
`,t=`
  fragment PRICE_RANGE_FRAGMENT on ComplexProductView {
    priceRange {
      maximum {
        final {
          amount {
            value
            currency
          }
        }
        regular {
          amount {
            value
            currency
          }
        }
        roles
      }
      minimum {
        final {
          amount {
            value
            currency
          }
        }
        regular {
          amount {
            value
            currency
          }
        }
        roles
      }
    }
  }
`,r=`
fragment PRODUCT_FRAGMENT on ProductView {
  __typename
  id
  sku
  name
  shortDescription
  metaDescription
  metaKeyword
  metaTitle
  description
  inStock
  addToCartAllowed
  url
  urlKey
  externalId

  images(roles: []) {
    url
    label
    roles
  }

  videos {
    url
    description
    title
  }

  attributes(roles: []) {
    name
    label
    value
    roles
  }

... on SimpleProductView {
    price {
        roles

        regular {
            amount {
                value
                currency
            }
        }

        final {
            amount {
                value
                currency
            }
        }
      }
      nasm_price {
        monthly_price
        strike_out_monthly_price
        down_payment
        instalment_type
        instalment_number
        instalment_number_display
      }
    }

  ... on ComplexProductView {
    nasm_price {
        monthly_price
        strike_out_monthly_price
        down_payment
        instalment_type
        instalment_number
        instalment_number_display
    }
    options {
      ...PRODUCT_OPTION_FRAGMENT
    }

    ...PRICE_RANGE_FRAGMENT
  }
}

${e}
${t}
`;export{t as PRICE_RANGE_FRAGMENT,r as PRODUCT_FRAGMENT,e as PRODUCT_OPTION_FRAGMENT};
