<?php
/**
 * Backfill missing WooCommerce shipping dimensions (Montonio DPD).
 *
 * DO NOT place in wp-content/mu-plugins/.
 *
 * Dry run:
 *   MOTOROCK_BACKFILL_DRY_RUN=1 php wp-cli.phar eval-file motorock-backfill-shipping-dimensions.php
 *
 * Apply:
 *   php wp-cli.phar eval-file motorock-backfill-shipping-dimensions.php
 *
 * Single product/variation:
 *   MOTOROCK_BACKFILL_PRODUCT_ID=23019 php wp-cli.phar eval-file motorock-backfill-shipping-dimensions.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
	return;
}

if ( ! function_exists( 'motorock_shipping_dimensions_profiles' ) ) {
	require_once WP_CONTENT_DIR . '/mu-plugins/motorock-shipping-dimensions-lib.php';
}

$dry_run   = getenv( 'MOTOROCK_BACKFILL_DRY_RUN' ) === '1';
$single_id = (int) getenv( 'MOTOROCK_BACKFILL_PRODUCT_ID' );

$product_ids = $single_id > 0 ? array( $single_id ) : motorock_shipping_dimensions_missing_product_ids();

$updated = 0;
$skipped = 0;
$failed  = 0;

WP_CLI::log( $dry_run ? 'DRY RUN — no changes will be saved.' : 'LIVE RUN — writing shipping dimensions.' );
WP_CLI::log( sprintf( 'Scanning %d products/variations.', count( $product_ids ) ) );

foreach ( $product_ids as $product_id ) {
	$product = wc_get_product( $product_id );
	if ( ! $product ) {
		++$failed;
		WP_CLI::warning( sprintf( '#%d — product not loadable', $product_id ) );
		continue;
	}

	if ( ! motorock_shipping_dimensions_is_missing( $product ) ) {
		continue;
	}

	$profile = motorock_shipping_dimensions_resolve( $product );
	if ( ! $profile ) {
		++$skipped;
		WP_CLI::log(
			sprintf(
				'skip #%d "%s" (sku: %s)',
				$product_id,
				mb_substr( $product->get_name(), 0, 70 ),
				$product->get_sku() ?: '-'
			)
		);
		continue;
	}

	WP_CLI::log(
		sprintf(
			'%s#%d "%s" → %s (L×W×H %s×%s×%s cm, %s kg)',
			$dry_run ? '[dry-run] ' : '',
			$product_id,
			mb_substr( $product->get_name(), 0, 60 ),
			$profile['label'],
			$profile['length'],
			$profile['width'],
			$profile['height'],
			$profile['weight']
		)
	);

	if ( $dry_run ) {
		++$updated;
		continue;
	}

	if ( motorock_shipping_dimensions_apply_profile( $product, $profile, true ) ) {
		$product->save();
		++$updated;
	} else {
		++$failed;
	}
}

WP_CLI::success(
	sprintf(
		'Done. Updated: %d. Skipped: %d. Failed: %d. Still missing: %d.',
		$updated,
		$skipped,
		$failed,
		count( motorock_shipping_dimensions_missing_product_ids() )
	)
);
