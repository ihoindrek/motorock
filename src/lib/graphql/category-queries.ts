export const PRODUCT_CATEGORY_NAV_TREE = `
  query ProductCategoryNavTree {
    forMen: productCategories(where: { slug: "for-men" }) {
      nodes {
        slug
        name
        languageCode
        translations {
          name
          slug
          language {
            code
          }
        }
        children(first: 50) {
          nodes {
            slug
            name
            count
            languageCode
            translations {
              name
              slug
              language {
                code
              }
            }
          }
        }
      }
    }
    forWomen: productCategories(where: { slug: "for-women" }) {
      nodes {
        slug
        name
        languageCode
        translations {
          name
          slug
          language {
            code
          }
        }
        children(first: 50) {
          nodes {
            slug
            name
            count
            languageCode
            translations {
              name
              slug
              language {
                code
              }
            }
          }
        }
      }
    }
    accessories: productCategories(where: { slug: "accessories" }) {
      nodes {
        slug
        name
        languageCode
        translations {
          name
          slug
          language {
            code
          }
        }
        children(first: 50) {
          nodes {
            slug
            name
            count
            languageCode
            translations {
              name
              slug
              language {
                code
              }
            }
          }
        }
      }
    }
    helmets: productCategories(where: { slug: "helmets" }) {
      nodes {
        slug
        name
        languageCode
        translations {
          name
          slug
          language {
            code
          }
        }
        children(first: 50) {
          nodes {
            slug
            name
            count
            languageCode
            translations {
              name
              slug
              language {
                code
              }
            }
          }
        }
      }
    }
  }
`;

export const EQUIPMENT_CATEGORY_INDEX = `
  query EquipmentCategoryIndex {
    productCategories(first: 200, where: { hideEmpty: false }) {
      nodes {
        slug
        name
        description
        count
        image {
          sourceUrl
          altText
        }
        languageCode
        translations {
          name
          description
          slug
          language {
            code
          }
        }
        parent {
          node {
            slug
          }
        }
      }
    }
  }
`;

export const PRODUCT_CATEGORY_BY_SLUG = `
  query ProductCategoryBySlug($slug: String!) {
    productCategories(where: { slug: [$slug] }) {
      nodes {
        slug
        name
        description
        count
        image {
          sourceUrl
          altText
        }
        languageCode
        translations {
          name
          description
          slug
          language {
            code
          }
        }
      }
    }
  }
`;
