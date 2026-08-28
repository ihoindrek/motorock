<?php
/**
 * One-time: assign pa_brand to published products missing the brand attribute.
 *
 * DO NOT place in wp-content/mu-plugins/.
 *
 * Dry run:
 *   MOTOROCK_BACKFILL_DRY_RUN=1 php wp-cli.phar eval-file motorock-backfill-pa-brand.php
 *
 * Apply:
 *   php wp-cli.phar eval-file motorock-backfill-pa-brand.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
	return;
}

if ( ! taxonomy_exists( 'pa_brand' ) ) {
	WP_CLI::error( 'Taxonomy pa_brand not found.' );
}

$dry_run = getenv( 'MOTOROCK_BACKFILL_DRY_RUN' ) === '1';

function motorock_backfill_brand_slug_map(): array {
	return array(
		'bobhead'      => 'bobhead',
		'pando-moto'   => 'pando-moto',
		'motogirl'     => 'motogirl',
		'mutt'         => 'mutt',
		'brixton'      => 'brixton',
		'holyfreedom'  => 'holyfreedom',
		'johnny-reb'   => 'johnny-reb',
		'makita'       => 'makita',
		'malaguti'     => 'malaguti',
		'motron'       => 'motron',
	);
}

function motorock_backfill_get_brand_term_id( string $brand_slug ): ?int {
	static $cache = array();

	if ( isset( $cache[ $brand_slug ] ) ) {
		return $cache[ $brand_slug ];
	}

	global $wpdb;

	$term_id = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT t.term_id
			FROM {$wpdb->terms} t
			INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
			WHERE tt.taxonomy = %s AND t.slug = %s
			LIMIT 1",
			'pa_brand',
			$brand_slug
		)
	);

	$cache[ $brand_slug ] = $term_id > 0 ? $term_id : null;

	return $cache[ $brand_slug ];
}

function motorock_backfill_product_has_pa_brand( int $product_id ): bool {
	global $wpdb;

	$has = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*)
			FROM {$wpdb->term_relationships} tr
			INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
			WHERE tr.object_id = %d AND tt.taxonomy = %s",
			$product_id,
			'pa_brand'
		)
	);

	return $has > 0;
}

function motorock_backfill_assign_pa_brand( int $product_id, int $term_id, bool $dry_run ): bool {
	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		return false;
	}

	if ( $dry_run ) {
		return true;
	}

	wp_set_object_terms( $product_id, array( $term_id ), 'pa_brand', false );

	$attributes      = $product->get_attributes();
	$brand_attribute = new WC_Product_Attribute();
	$attribute_id    = wc_attribute_taxonomy_id_by_name( 'pa_brand' );

	if ( $attribute_id ) {
		$brand_attribute->set_id( $attribute_id );
	}

	$brand_attribute->set_name( 'pa_brand' );
	$brand_attribute->set_options( array( $term_id ) );
	$brand_attribute->set_visible( true );
	$brand_attribute->set_variation( false );

	$attributes['pa_brand'] = $brand_attribute;
	$product->set_attributes( $attributes );
	$product->save();

	return true;
}

function motorock_backfill_resolve_brand_slug( WC_Product $product ): ?string {
	$product_id = $product->get_id();
	$title      = $product->get_name();
	$sku        = strtoupper( (string) $product->get_sku() );
	$slug       = $product->get_slug();

	if (
		$sku === 'GFTV'
		|| stripos( $title, 'kinkekaart' ) !== false
		|| stripos( $slug, 'kinkekaart' ) !== false
	) {
		return null;
	}

	$fb_brand = get_post_meta( $product_id, 'fb_brand', true );
	if ( is_string( $fb_brand ) && $fb_brand !== '' ) {
		$normalized = motorock_backfill_normalize_brand_name( $fb_brand );
		if ( $normalized !== null ) {
			return $normalized;
		}
	}

	$shopify_site_id = get_post_meta( $product_id, '_shopify_site_id', true );
	if ( is_string( $shopify_site_id ) && $shopify_site_id !== '' ) {
		$site_slug = sanitize_title( $shopify_site_id );
		if ( str_contains( $site_slug, 'motogirl' ) ) {
			return 'motogirl';
		}
		if ( str_contains( $site_slug, 'pando' ) ) {
			return 'pando-moto';
		}
	}

	$import_source = get_post_meta( $product_id, '_import_source', true );
	$motomad_product_id = get_post_meta( $product_id, '_motomad_product_id', true );
	$shopify_product_id = get_post_meta( $product_id, '_shopify_product_id', true );

	if (
		$import_source === 'motomad'
		&& is_string( $motomad_product_id )
		&& $motomad_product_id !== ''
		&& ( ! is_string( $shopify_product_id ) || $shopify_product_id === '' )
		&& ( ! is_string( $shopify_site_id ) || $shopify_site_id === '' )
	) {
		return 'motogirl';
	}

	if ( str_starts_with( $sku, 'BH' ) ) {
		return 'bobhead';
	}

	if ( str_starts_with( $sku, 'PANDO' ) || str_starts_with( $sku, 'PM-' ) ) {
		return 'pando-moto';
	}

	if ( str_starts_with( $sku, 'NANDI' ) ) {
		return 'motogirl';
	}

	if ( stripos( $sku, 'FALCON-LEATHER-AVIATOR' ) !== false || stripos( $title, 'FALCON LEATHER AVIATOR' ) !== false ) {
		return 'pando-moto';
	}

	if ( stripos( $sku, 'DRK-01' ) !== false || stripos( $slug, 'drk-01' ) !== false ) {
		return 'mutt';
	}

	$category_slugs = wp_list_pluck(
		wp_get_object_terms( $product_id, 'product_cat', array( 'fields' => 'all' ) ),
		'slug'
	);

	if ( is_array( $category_slugs ) ) {
		$motorcycle_brand_map = array(
			'brixton-2'  => 'brixton',
			'mutt-2'     => 'mutt',
			'motron-2'   => 'motron',
			'malaguti-2' => 'malaguti',
			'brixton'    => 'brixton',
			'mutt'       => 'mutt',
			'motron'     => 'motron',
			'malaguti'   => 'malaguti',
		);

		foreach ( $motorcycle_brand_map as $category_slug => $brand_slug ) {
			if ( in_array( $category_slug, $category_slugs, true ) ) {
				return $brand_slug;
			}
		}
	}

	return null;
}

function motorock_backfill_normalize_brand_name( string $brand_name ): ?string {
	$slug = sanitize_title( $brand_name );
	$map  = motorock_backfill_brand_slug_map();

	if ( isset( $map[ $slug ] ) ) {
		return $map[ $slug ];
	}

	foreach ( $map as $canonical => $_unused ) {
		if ( str_starts_with( $slug, $canonical ) ) {
			return $canonical;
		}
	}

	return null;
}

function motorock_backfill_missing_product_ids(): array {
	global $wpdb;

	$ids = $wpdb->get_col(
		"SELECT p.ID
		FROM {$wpdb->posts} p
		WHERE p.post_type = 'product'
		AND p.post_status = 'publish'
		AND p.ID NOT IN (
			SELECT DISTINCT tr.object_id
			FROM {$wpdb->term_relationships} tr
			INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
			WHERE tt.taxonomy = 'pa_brand'
		)
		ORDER BY p.ID ASC"
	);

	return array_map( 'intval', $ids ?: array() );
}

$assigned = 0;
$skipped  = 0;
$failed   = 0;

WP_CLI::log( $dry_run ? 'DRY RUN — no changes will be saved.' : 'LIVE RUN — writing changes.' );

foreach ( motorock_backfill_missing_product_ids() as $product_id ) {
	if ( motorock_backfill_product_has_pa_brand( $product_id ) ) {
		continue;
	}

	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		++$failed;
		WP_CLI::warning( sprintf( '#%d — product not loadable', $product_id ) );
		continue;
	}

	$brand_slug = motorock_backfill_resolve_brand_slug( $product );

	if ( $brand_slug === null ) {
		++$skipped;
		WP_CLI::log(
			sprintf(
				'skip #%d "%s" (sku: %s)',
				$product_id,
				$product->get_name(),
				$product->get_sku() ?: '-'
			)
		);
		continue;
	}

	$term_id = motorock_backfill_get_brand_term_id( $brand_slug );
	if ( ! $term_id ) {
		++$failed;
		WP_CLI::warning( sprintf( '#%d — brand term missing for slug %s', $product_id, $brand_slug ) );
		continue;
	}

	WP_CLI::log(
		sprintf(
			'%sassign #%d "%s" → %s (#%d)',
			$dry_run ? '[dry-run] ' : '',
			$product_id,
			mb_substr( $product->get_name(), 0, 70 ),
			$brand_slug,
			$term_id
		)
	);

	if ( motorock_backfill_assign_pa_brand( $product_id, $term_id, $dry_run ) ) {
		++$assigned;
	} else {
		++$failed;
	}
}

if ( ! $dry_run && function_exists( 'wc_recount_all_terms' ) ) {
	wc_recount_all_terms();
}

WP_CLI::success(
	sprintf(
		'Done. Assigned: %d. Skipped: %d. Failed: %d. Still missing: %d.',
		$assigned,
		$skipped,
		$failed,
		count( motorock_backfill_missing_product_ids() )
	)
);
