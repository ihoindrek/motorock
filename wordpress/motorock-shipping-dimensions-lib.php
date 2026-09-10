<?php
/**
 * Shared shipping dimension defaults for WooCommerce products (Montonio DPD).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * @return array<string, array{length: float, width: float, height: float, weight: float, label: string}>
 */
function motorock_shipping_dimensions_profiles(): array {
	return array(
		'helmet'     => array(
			'length' => 35,
			'width'  => 35,
			'height' => 35,
			'weight' => 1.8,
			'label'  => 'helmet',
		),
		'jacket'     => array(
			'length' => 45,
			'width'  => 35,
			'height' => 12,
			'weight' => 1.5,
			'label'  => 'jacket',
		),
		'hoodie'     => array(
			'length' => 40,
			'width'  => 30,
			'height' => 8,
			'weight' => 0.65,
			'label'  => 'hoodie',
		),
		'pants'      => array(
			'length' => 38,
			'width'  => 28,
			'height' => 6,
			'weight' => 0.45,
			'label'  => 'pants',
		),
		'boots'      => array(
			'length' => 35,
			'width'  => 25,
			'height' => 15,
			'weight' => 1.2,
			'label'  => 'boots',
		),
		'gloves'     => array(
			'length' => 25,
			'width'  => 15,
			'height' => 5,
			'weight' => 0.25,
			'label'  => 'gloves',
		),
		'accessory'  => array(
			'length' => 25,
			'width'  => 15,
			'height' => 4,
			'weight' => 0.15,
			'label'  => 'accessory',
		),
		'tshirt'     => array(
			'length' => 35,
			'width'  => 25,
			'height' => 5,
			'weight' => 0.3,
			'label'  => 'tshirt',
		),
		'apparel'    => array(
			'length' => 35,
			'width'  => 28,
			'height' => 6,
			'weight' => 0.4,
			'label'  => 'apparel',
		),
		'general'    => array(
			'length' => 30,
			'width'  => 25,
			'height' => 8,
			'weight' => 0.5,
			'label'  => 'general',
		),
	);
}

function motorock_shipping_dimensions_is_gift_product( WC_Product $product ): bool {
	$needles = array( 'kinkekaart', 'gift card', 'gift-card', 'giftcard' );
	$haystack = strtolower(
		$product->get_name() . ' ' .
		$product->get_slug() . ' ' .
		(string) $product->get_sku()
	);

	foreach ( $needles as $needle ) {
		if ( str_contains( $haystack, $needle ) ) {
			return true;
		}
	}

	return false;
}

function motorock_shipping_dimensions_is_missing( WC_Product $product ): bool {
	$length = $product->get_length( 'edit' );
	$width  = $product->get_width( 'edit' );
	$height = $product->get_height( 'edit' );
	$weight = $product->get_weight( 'edit' );

	return $length === '' || $width === '' || $height === '' || $weight === '';
}

/**
 * @return array{length: float, width: float, height: float, weight: float, label: string}|null
 */
function motorock_shipping_dimensions_resolve( WC_Product $product ): ?array {
	if ( motorock_shipping_dimensions_is_gift_product( $product ) ) {
		return null;
	}

	if ( $product->is_type( 'variable' ) ) {
		return null;
	}

	$profiles = motorock_shipping_dimensions_profiles();
	$context  = motorock_shipping_dimensions_build_context( $product );
	$profile  = motorock_shipping_dimensions_match_profile( $context, $profiles );

	return $profiles[ $profile ];
}

/**
 * @return array{terms: string, category_slugs: string[]}
 */
function motorock_shipping_dimensions_build_context( WC_Product $product ): array {
	$product_id = $product->get_id();
	$name       = $product->get_name();
	$slug       = $product->get_slug();
	$sku        = (string) $product->get_sku();

	if ( $product->is_type( 'variation' ) ) {
		$parent = wc_get_product( $product->get_parent_id() );
		if ( $parent ) {
			$product_id = $parent->get_id();
			$name       = $parent->get_name() . ' ' . $name;
			$slug       = $parent->get_slug() . ' ' . $slug;
		}
	}

	$terms = strtolower( $name . ' ' . $slug . ' ' . $sku );
	$terms = preg_replace( '/\s+/', ' ', $terms ) ?? $terms;

	$category_slugs = wp_list_pluck(
		wp_get_object_terms( $product_id, 'product_cat', array( 'fields' => 'all' ) ),
		'slug'
	);

	if ( ! is_array( $category_slugs ) ) {
		$category_slugs = array();
	}

	return array(
		'terms'          => $terms,
		'category_slugs' => array_map( 'strtolower', $category_slugs ),
	);
}

/**
 * @param array{terms: string, category_slugs: string[]} $context
 * @param array<string, array{length: float, width: float, height: float, weight: float, label: string}> $profiles
 */
function motorock_shipping_dimensions_match_profile( array $context, array $profiles ): string {
	$terms      = $context['terms'];
	$categories = $context['category_slugs'];

	$rules = array(
		'helmet'    => array( 'helmet', 'kiiver', 'helmets' ),
		'jacket'    => array( 'jacket', 'jope', 'jackets', 'flis', 'fleece' ),
		'hoodie'    => array( 'hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'dressipluus' ),
		'pants'     => array( 'jegging', 'jeans', 'pant', 'pants', 'trouser', 'puks', 'teks', 'legging', 'bikini', 'short' ),
		'boots'     => array( 'boot', 'shoe', 'saabas', 'king', 'footwear' ),
		'gloves'    => array( 'glove', 'kindad', 'gloves' ),
		'accessory' => array( 'tubular', 'buff', 'scarf', 'ring', 'sleeve', 'headwear', 'cap', 'hat', 'tubulars' ),
		'tshirt'    => array( 't-shirt', 'tshirt', 'tee', 'shirt', 'särk', 'topwear', 'top ' ),
	);

	foreach ( $rules as $profile => $needles ) {
		if ( ! isset( $profiles[ $profile ] ) ) {
			continue;
		}

		foreach ( $needles as $needle ) {
			if ( str_contains( $terms, $needle ) ) {
				return $profile;
			}
		}

		foreach ( $categories as $category_slug ) {
			foreach ( $needles as $needle ) {
				if ( str_contains( $category_slug, sanitize_title( $needle ) ) ) {
					return $profile;
				}
			}
		}
	}

	if ( motorock_shipping_dimensions_context_is_apparel( $terms, $categories ) ) {
		return 'apparel';
	}

	return 'general';
}

function motorock_shipping_dimensions_context_is_apparel( string $terms, array $category_slugs ): bool {
	$apparel_terms = array( 'equipment', 'riided', 'women', 'men', 'naistele', 'meestele', 'apparel', 'clothing' );

	foreach ( $apparel_terms as $needle ) {
		if ( str_contains( $terms, $needle ) ) {
			return true;
		}
	}

	foreach ( $category_slugs as $category_slug ) {
		foreach ( $apparel_terms as $needle ) {
			if ( str_contains( $category_slug, sanitize_title( $needle ) ) ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * @param array{length: float, width: float, height: float, weight: float, label: string} $profile
 */
function motorock_shipping_dimensions_apply_profile( WC_Product $product, array $profile, bool $only_if_missing = true ): bool {
	if ( $only_if_missing && ! motorock_shipping_dimensions_is_missing( $product ) ) {
		return false;
	}

	$changed = false;

	if ( ! $only_if_missing || $product->get_length( 'edit' ) === '' ) {
		$product->set_length( (string) $profile['length'] );
		$changed = true;
	}

	if ( ! $only_if_missing || $product->get_width( 'edit' ) === '' ) {
		$product->set_width( (string) $profile['width'] );
		$changed = true;
	}

	if ( ! $only_if_missing || $product->get_height( 'edit' ) === '' ) {
		$product->set_height( (string) $profile['height'] );
		$changed = true;
	}

	if ( ! $only_if_missing || $product->get_weight( 'edit' ) === '' ) {
		$product->set_weight( (string) $profile['weight'] );
		$changed = true;
	}

	return $changed;
}

function motorock_shipping_dimensions_apply_if_missing( WC_Product $product ): bool {
	$profile = motorock_shipping_dimensions_resolve( $product );
	if ( ! $profile ) {
		return false;
	}

	return motorock_shipping_dimensions_apply_profile( $product, $profile, true );
}

/**
 * @return array<int, int>
 */
function motorock_shipping_dimensions_missing_product_ids(): array {
	global $wpdb;

	$ids = $wpdb->get_col(
		"SELECT ID
		FROM {$wpdb->posts}
		WHERE post_type IN ('product', 'product_variation')
		AND post_status IN ('publish', 'private')
		ORDER BY ID ASC"
	);

	$missing = array();

	foreach ( array_map( 'intval', $ids ?: array() ) as $product_id ) {
		$product = wc_get_product( $product_id );
		if ( $product && motorock_shipping_dimensions_is_missing( $product ) ) {
			$missing[] = $product_id;
		}
	}

	return $missing;
}
