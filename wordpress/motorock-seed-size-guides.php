<?php
/**
 * Seed pilot size guides into motorock_size_guide CPT.
 *
 * Run on the WordPress server (from site root):
 *   wp eval-file wordpress/motorock-seed-size-guides.php
 *
 * Safe to re-run — updates existing entries by slug.
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run via WP-CLI eval-file inside WordPress root.\n" );
	exit( 1 );
}

if ( ! function_exists( 'update_field' ) ) {
	fwrite( STDERR, "ACF is required.\n" );
	exit( 1 );
}

if ( ! defined( 'MOTOROCK_SIZE_GUIDE_POST_TYPE' ) ) {
	fwrite( STDERR, "motorock-size-guides.php mu-plugin must be active.\n" );
	exit( 1 );
}

$guides = array(
	array(
		'slug'       => 'pando-moto-jackets-men',
		'title'      => "Pando Moto — men's jackets",
		'brand_slug' => 'pando-moto',
		'category'   => 'jackets',
		'gender'     => 'men',
		'fit'        => 'slim',
		'note'       => 'Body measurements in cm. Measure chest under the armpits across the back; waist at the narrowest point above the hips. Pando Moto sizing often runs slimmer than casual brands — if between sizes, size up for layering.',
		'columns'    => array(
			array( 'key' => 'chest', 'label' => 'Chest' ),
			array( 'key' => 'waist', 'label' => 'Waist' ),
		),
		'rows'       => array(
			array( 'size' => 'XS', 'chest' => 82, 'waist' => 81 ),
			array( 'size' => 'S', 'chest' => 88, 'waist' => 85 ),
			array( 'size' => 'M', 'chest' => 94, 'waist' => 89 ),
			array( 'size' => 'L', 'chest' => 100, 'waist' => 93 ),
			array( 'size' => 'XL', 'chest' => 107, 'waist' => 97 ),
			array( 'size' => 'XXL', 'chest' => 114, 'waist' => 101 ),
		),
	),
	array(
		'slug'       => 'johnny-reb-pants-men',
		'title'      => "Johnny Reb — men's pants",
		'brand_slug' => 'johnny-reb',
		'category'   => 'pants',
		'gender'     => 'men',
		'fit'        => 'regular',
		'note'       => 'Waist and inseam in cm. Measure at the narrowest point and along the inside leg.',
		'columns'    => array(
			array( 'key' => 'waist', 'label' => 'Waist' ),
			array( 'key' => 'inseam', 'label' => 'Inseam' ),
			array( 'key' => 'hips', 'label' => 'Hips' ),
		),
		'rows'       => array(
			array( 'size' => '28', 'waist' => 71, 'inseam' => 76, 'hips' => 92 ),
			array( 'size' => '30', 'waist' => 76, 'inseam' => 76, 'hips' => 96 ),
			array( 'size' => '32', 'waist' => 81, 'inseam' => 81, 'hips' => 100 ),
			array( 'size' => '34', 'waist' => 86, 'inseam' => 81, 'hips' => 104 ),
			array( 'size' => '36', 'waist' => 91, 'inseam' => 81, 'hips' => 108 ),
		),
	),
	array(
		'slug'       => 'holyfreedom-hoodies-unisex',
		'title'      => 'Holyfreedom — hoodies',
		'brand_slug' => 'holyfreedom',
		'category'   => 'hoodies',
		'gender'     => 'unisex',
		'fit'        => 'relaxed',
		'note'       => 'Relaxed fit. Measurements in cm.',
		'columns'    => array(
			array( 'key' => 'chest', 'label' => 'Chest' ),
			array( 'key' => 'length', 'label' => 'Length' ),
			array( 'key' => 'sleeve', 'label' => 'Sleeve' ),
		),
		'rows'       => array(
			array( 'size' => 'S', 'chest' => 104, 'length' => 68, 'sleeve' => 62 ),
			array( 'size' => 'M', 'chest' => 110, 'length' => 70, 'sleeve' => 64 ),
			array( 'size' => 'L', 'chest' => 116, 'length' => 72, 'sleeve' => 66 ),
			array( 'size' => 'XL', 'chest' => 122, 'length' => 74, 'sleeve' => 68 ),
		),
	),
);

function motorock_find_size_guide_post_id_by_slug( string $slug ): int {
	$existing = get_posts(
		array(
			'post_type'              => MOTOROCK_SIZE_GUIDE_POST_TYPE,
			'name'                   => $slug,
			'post_status'            => array( 'publish', 'draft', 'pending' ),
			'posts_per_page'         => 1,
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
		)
	);

	return ! empty( $existing[0] ) ? (int) $existing[0] : 0;
}

function motorock_seed_size_guide( array $guide ): int {
	$post_id = motorock_find_size_guide_post_id_by_slug( $guide['slug'] );

	if ( ! $post_id ) {
		$post_id = wp_insert_post(
			array(
				'post_type'   => MOTOROCK_SIZE_GUIDE_POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => $guide['title'],
				'post_name'   => $guide['slug'],
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			throw new RuntimeException( $post_id->get_error_message() );
		}
	} else {
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_title'  => $guide['title'],
				'post_status' => 'publish',
				'post_name'   => $guide['slug'],
			)
		);
	}

	update_field( 'size_guide_brand_slug', $guide['brand_slug'], $post_id );
	update_field( 'size_guide_category', $guide['category'], $post_id );
	update_field( 'size_guide_gender', $guide['gender'], $post_id );
	update_field( 'size_guide_note', $guide['note'], $post_id );
	update_field( 'size_guide_fit', $guide['fit'], $post_id );
	update_field( 'size_guide_columns', $guide['columns'], $post_id );
	update_field( 'size_guide_rows', $guide['rows'], $post_id );

	do_action( 'acf/save_post', $post_id );

	return (int) $post_id;
}

$created = 0;
$updated = 0;

foreach ( $guides as $guide ) {
	$existed = motorock_find_size_guide_post_id_by_slug( $guide['slug'] ) > 0;
	$post_id = motorock_seed_size_guide( $guide );

	if ( $existed ) {
		++$updated;
		WP_CLI::log( sprintf( 'Updated size guide #%d (%s)', $post_id, $guide['slug'] ) );
	} else {
		++$created;
		WP_CLI::log( sprintf( 'Created size guide #%d (%s)', $post_id, $guide['slug'] ) );
	}
}

WP_CLI::success(
	sprintf(
		'Size guides seeded: %d created, %d updated. Check /wp-json/motorock/v1/size-guides',
		$created,
		$updated
	)
);
