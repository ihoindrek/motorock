export const PRODUCT_CATEGORY_NAV_TREE = `
  query ProductCategoryNavTree {
    forMen: productCategories(where: { slug: "for-men" }) {
      nodes {
        slug
        name
        languageCode
        translations {
          name
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
    productCategories(first: 100, where: { hideEmpty: false }) {
      nodes {
        slug
        name
        count
        languageCode
        translations {
          name
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
