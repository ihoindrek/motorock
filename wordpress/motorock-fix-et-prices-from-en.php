<?php
/**
 * One-time: copy canonical EN WooCommerce prices to ET translations.
 *
 * Use when ET translations still carry stale Motomadi prices after wpml_sync_all_custom_fields.
 *
 * Run on the WordPress server (from site root):
 *   php wp-cli.phar eval-file wordpress/motorock-fix-et-prices-from-en.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run via WP-CLI eval-file inside WordPress root.\n" );
	exit( 1 );
}

if ( ! function_exists( 'wc_get_products' ) ) {
	fwrite( STDERR, "WooCommerce is required.\n" );
	exit( 1 );
}

$default_lang = apply_filters( 'wpml_default_language', 'en' );
$et_lang      = 'et';
$fixed        = 0;
$checked      = 0;
$skipped      = 0;

function motorock_get_translation_product_id( int $product_id, string $lang ) {
	$translated = apply_filters( 'wpml_object_id', $product_id, 'product', false, $lang );

	return $translated ? (int) $translated : 0;
}

function motorock_prices_match( WC_Product $left, WC_Product $right ): bool {
	$fields = array( 'regular_price', 'sale_price', 'price' );

	foreach ( $fields as $field ) {
		$getter = "get_{$field}";
		if ( (string) $left->$getter( 'edit' ) !== (string) $right->$getter( 'edit' ) ) {
			return false;
		}
	}

	return true;
}

function motorock_copy_product_prices( WC_Product $source, WC_Product $target ): void {
	$target->set_regular_price( $source->get_regular_price( 'edit' ) );
	$target->set_sale_price( $source->get_sale_price( 'edit' ) );
	$target->set_price( $source->get_price( 'edit' ) );
	$target->save();
}

function motorock_variation_attribute_key( WC_Product_Variation $variation ): string {
	$attributes = $variation->get_attributes();
	ksort( $attributes );

	$parts = array();
	foreach ( $attributes as $name => $value ) {
		$parts[] = "{$name}:{$value}";
	}

	return implode( '|', $parts );
}

function motorock_copy_variable_prices( WC_Product_Variable $source, WC_Product_Variable $target ): void {
	motorock_copy_product_prices( $source, $target );

	$source_variations = array();
	foreach ( $source->get_children() as $child_id ) {
		$variation = wc_get_product( $child_id );
		if ( $variation instanceof WC_Product_Variation ) {
			$source_variations[ motorock_variation_attribute_key( $variation ) ] = $variation;
		}
	}

	foreach ( $target->get_children() as $child_id ) {
		$variation = wc_get_product( $child_id );
		if ( ! $variation instanceof WC_Product_Variation ) {
			continue;
		}

		$key    = motorock_variation_attribute_key( $variation );
		$source = $source_variations[ $key ] ?? null;
		if ( ! $source ) {
			continue;
		}

		motorock_copy_product_prices( $source, $variation );
	}
}

foreach ( wc_get_products( array( 'limit' => -1, 'status' => 'publish', 'return' => 'ids' ) ) as $product_id ) {
	$product_id = (int) $product_id;
	$lang       = apply_filters(
		'wpml_element_language_code',
		null,
		array(
			'element_id'   => $product_id,
			'element_type' => 'post_product',
		)
	);

	if ( $lang !== $default_lang ) {
		$skipped++;
		continue;
	}

	$checked++;

	$et_id = motorock_get_translation_product_id( $product_id, $et_lang );
	if ( ! $et_id || $et_id === $product_id ) {
		continue;
	}

	$en_product = wc_get_product( $product_id );
	$et_product = wc_get_product( $et_id );

	if ( ! $en_product || ! $et_product ) {
		continue;
	}

	if ( motorock_prices_match( $en_product, $et_product ) ) {
		continue;
	}

	if ( $en_product instanceof WC_Product_Variable && $et_product instanceof WC_Product_Variable ) {
		motorock_copy_variable_prices( $en_product, $et_product );
	} else {
		motorock_copy_product_prices( $en_product, $et_product );
	}

	$fixed++;
	WP_CLI::log( sprintf( 'Fixed #%d -> #%d (%s)', $product_id, $et_id, $en_product->get_name() ) );
}

WP_CLI::success( "Checked {$checked} EN products. Fixed {$fixed} ET translations. Skipped {$skipped} non-source products." );
