export type GraphQLImage = {
  sourceUrl: string;
  altText?: string | null;
};

export type GraphQLCategory = {
  name: string;
  slug: string;
  parent?: {
    node?: {
      slug: string;
    } | null;
  } | null;
};

export type GraphQLMetaData = {
  key: string;
  value: string | null;
};

export type GraphQLVariationAttribute = {
  name: string;
  value: string;
};

export type GraphQLProductVariation = {
  databaseId: number;
  sku: string | null;
  name: string | null;
  price: string | null;
  regularPrice: string | null;
  stockStatus: string | null;
  image?: GraphQLImage | null;
  attributes?: {
    nodes: GraphQLVariationAttribute[];
  } | null;
};

export type GraphQLProductAttribute = {
  name: string;
  options: string[] | null;
  variation: boolean | null;
};

export type GraphQLProductBase = {
  databaseId: number;
  name: string;
  slug: string;
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  image?: GraphQLImage | null;
  galleryImages?: {
    nodes: GraphQLImage[];
  } | null;
  productCategories?: {
    nodes: GraphQLCategory[];
  } | null;
  metaData?: GraphQLMetaData[] | null;
};

export type GraphQLSimpleProduct = GraphQLProductBase & {
  __typename: "SimpleProduct";
  price?: string | null;
  regularPrice?: string | null;
  stockStatus?: string | null;
  attributes?: {
    nodes: GraphQLProductAttribute[];
  } | null;
};

export type GraphQLVariableProduct = GraphQLProductBase & {
  __typename: "VariableProduct";
  price?: string | null;
  regularPrice?: string | null;
  stockStatus?: string | null;
  attributes?: {
    nodes: GraphQLProductAttribute[];
  } | null;
  variations?: {
    nodes: GraphQLProductVariation[];
  } | null;
};

export type GraphQLProduct = GraphQLSimpleProduct | GraphQLVariableProduct;

export type GraphQLProductCard = GraphQLProductBase & {
  __typename: string;
  price?: string | null;
  regularPrice?: string | null;
  stockStatus?: string | null;
  attributes?: {
    nodes: GraphQLProductAttribute[];
  } | null;
};
