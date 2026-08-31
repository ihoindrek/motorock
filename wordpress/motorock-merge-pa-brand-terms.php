<?php
/**
 * One-time: merge duplicate pa_brand terms and normalize brand names/slugs.
 *
 * Fixes WPML/import duplicates (e.g. two "bobhead" terms with different term_ids).
 *
 * DO NOT place in wp-content/mu-plugins/ — WordPress auto-loads those on every request.
 * Copy to the WordPress root (next to wp-config.php) and run via WP-CLI only.
 *
 * Dry run (no writes):
 *   MOTOROCK_MERGE_DRY_RUN=1 php wp-cli.phar eval-file motorock-merge-pa-brand-terms.php
 *
 * Apply changes:
 *   php wp-cli.phar eval-file motorock-merge-pa-brand-terms.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

// Loaded accidentally as mu-plugin or via web — do nothing.
if ( ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
	return;
}

function motorock_merge_brands_cli_error( string $message ): void {
	if ( class_exists( 'WP_CLI' ) ) {
		WP_CLI::error( $message );
	}
	exit( 1 );
}

if ( ! taxonomy_exists( 'pa_brand' ) ) {
	motorock_merge_brands_cli_error( 'Taxonomy pa_brand not found.' );
}

$dry_run = getenv( 'MOTOROCK_MERGE_DRY_RUN' ) === '1'
	|| in_array( '--dry-run', $GLOBALS['argv'] ?? array(), true );

/**
 * Map raw term slugs to a canonical merge group + display metadata.
 *
 * @return array{group: string, name: string, slug: string}|null Null = delete when empty.
 */
function motorock_brand_canonical_meta( string $slug ): ?array {
	$map = array(
		'bobhead'      => array(
			'group' => 'bobhead',
			'name'  => 'Bobhead',
			'slug'  => 'bobhead',
		),
		'pando'        => array(
			'group' => 'pando-moto',
			'name'  => 'Pando Moto',
			'slug'  => 'pando-moto',
		),
		'pando-moto'   => array(
			'group' => 'pando-moto',
			'name'  => 'Pando Moto',
			'slug'  => 'pando-moto',
		),
		'johnnyreb'    => array(
			'group' => 'johnny-reb',
			'name'  => 'Johnny Reb',
			'slug'  => 'johnny-reb',
		),
		'johnny-reb'   => array(
			'group' => 'johnny-reb',
			'name'  => 'Johnny Reb',
			'slug'  => 'johnny-reb',
		),
		'johnny-reb-et' => array(
			'group' => 'johnny-reb',
			'name'  => 'Johnny Reb',
			'slug'  => 'johnny-reb',
		),
		'holyfreedom'  => array(
			'group' => 'holyfreedom',
			'name'  => 'Holyfreedom',
			'slug'  => 'holyfreedom',
		),
		'john-doe'     => array(
			'group' => 'john-doe',
			'name'  => 'John Doe',
			'slug'  => 'john-doe',
		),
		'johndoe'      => array(
			'group' => 'john-doe',
			'name'  => 'John Doe',
			'slug'  => 'john-doe',
		),
		'motogirl'     => array(
			'group' => 'motogirl',
			'name'  => 'Motogirl',
			'slug'  => 'motogirl',
		),
		'makita'       => array(
			'group' => 'makita',
			'name'  => 'Makita',
			'slug'  => 'makita',
		),
		'brixton'      => array(
			'group' => 'brixton',
			'name'  => 'Brixton',
			'slug'  => 'brixton',
		),
		'malaguti'     => array(
			'group' => 'malaguti',
			'name'  => 'Malaguti',
			'slug'  => 'malaguti',
		),
		'motron'       => array(
			'group' => 'motron',
			'name'  => 'Motron',
			'slug'  => 'motron',
		),
		'mutt'         => array(
			'group' => 'mutt',
			'name'  => 'Mutt',
			'slug'  => 'mutt',
		),
	);

	if ( isset( $map[ $slug ] ) ) {
		return $map[ $slug ];
	}

	$group = sanitize_title( $slug );
	if ( $group === '' ) {
		return null;
	}

	return array(
		'group' => $group,
		'name'  => ucwords( str_replace( array( '-', '_' ), ' ', $group ) ),
		'slug'  => $group,
	);
}

function motorock_get_term_product_ids( int $term_id ): array {
	global $wpdb;

	$term_taxonomy_id = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT term_taxonomy_id FROM {$wpdb->term_taxonomy}
			WHERE term_id = %d AND taxonomy = %s
			LIMIT 1",
			$term_id,
			'pa_brand'
		)
	);

	if ( $term_taxonomy_id <= 0 ) {
		return array();
	}

	$product_ids = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT DISTINCT object_id FROM {$wpdb->term_relationships}
			WHERE term_taxonomy_id = %d",
			$term_taxonomy_id
		)
	);

	if ( empty( $product_ids ) ) {
		return array();
	}

	return array_values(
		array_unique(
			array_filter(
				array_map( 'intval', $product_ids ),
				static function ( int $id ): bool {
					return $id > 0;
				}
			)
		)
	);
}

function motorock_count_term_products( int $term_id ): int {
	return count( motorock_get_term_product_ids( $term_id ) );
}

function motorock_assign_pa_brand_to_product( int $product_id, int $term_id, bool $dry_run ): bool {
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

function motorock_merge_term_products(
	int $from_term_id,
	int $to_term_id,
	bool $dry_run
): int {
	$product_ids = motorock_get_term_product_ids( $from_term_id );

	if ( empty( $product_ids ) ) {
		return 0;
	}

	$moved = 0;

	foreach ( $product_ids as $product_id ) {
		if ( motorock_assign_pa_brand_to_product( $product_id, $to_term_id, $dry_run ) ) {
			++$moved;
		}
	}

	return $moved;
}

function motorock_delete_orphan_pa_brand_terms( bool $dry_run ): int {
	global $wpdb;

	$orphan_ids = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT t.term_id
			FROM {$wpdb->terms} t
			LEFT JOIN {$wpdb->term_taxonomy} tt
				ON t.term_id = tt.term_id AND tt.taxonomy = %s
			WHERE tt.term_taxonomy_id IS NULL
			AND t.slug IN (
				SELECT DISTINCT t2.slug
				FROM {$wpdb->terms} t2
				INNER JOIN {$wpdb->term_taxonomy} tt2
					ON t2.term_id = tt2.term_id AND tt2.taxonomy = %s
			)",
			'pa_brand',
			'pa_brand'
		)
	);

	if ( empty( $orphan_ids ) ) {
		return 0;
	}

	$deleted = 0;

	foreach ( array_map( 'intval', $orphan_ids ) as $term_id ) {
		if ( $term_id <= 0 ) {
			continue;
		}

		WP_CLI::log( sprintf( '  delete orphan term #%d (no pa_brand taxonomy row)', $term_id ) );

		if ( ! $dry_run ) {
			$wpdb->delete( $wpdb->terms, array( 'term_id' => $term_id ), array( '%d' ) );
		}

		++$deleted;
	}

	return $deleted;
}

function motorock_pick_canonical_term( array $terms ) {
	usort(
		$terms,
		static function ( $a, $b ) {
			$a_count = motorock_count_term_products( (int) $a->term_id );
			$b_count = motorock_count_term_products( (int) $b->term_id );

			if ( $a_count !== $b_count ) {
				return $b_count <=> $a_count;
			}

			return (int) $a->term_id <=> (int) $b->term_id;
		}
	);

	return $terms[0];
}

function motorock_get_all_pa_brand_terms(): array {
	global $wpdb;

	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT t.term_id, t.name, t.slug
			FROM {$wpdb->terms} t
			INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
			WHERE tt.taxonomy = %s
			ORDER BY t.term_id ASC",
			'pa_brand'
		)
	);

	if ( empty( $rows ) ) {
		return array();
	}

	$terms = array();

	foreach ( $rows as $row ) {
		$term           = new stdClass();
		$term->term_id  = (int) $row->term_id;
		$term->name     = (string) $row->name;
		$term->slug     = (string) $row->slug;
		$terms[]        = $term;
	}

	return $terms;
}

$all_terms = motorock_get_all_pa_brand_terms();

$groups = array();

foreach ( $all_terms as $term ) {
	if ( ! is_object( $term ) || empty( $term->term_id ) ) {
		continue;
	}

	$meta = motorock_brand_canonical_meta( $term->slug );
	if ( $meta === null ) {
		WP_CLI::warning( "Skipping unmapped empty slug term #{$term->term_id}" );
		continue;
	}

	$groups[ $meta['group'] ]['meta']   = $meta;
	$groups[ $meta['group'] ]['terms'][] = $term;
}

$merged_products = 0;
$deleted_terms   = 0;
$renamed_terms   = 0;

WP_CLI::log( $dry_run ? 'DRY RUN — no changes will be saved.' : 'LIVE RUN — writing changes.' );

foreach ( $groups as $group_key => $group ) {
	$terms = $group['terms'];
	$meta  = $group['meta'];

	if ( count( $terms ) <= 1 ) {
		$term = $terms[0];
		$actual_count = motorock_count_term_products( (int) $term->term_id );

		if ( $term->name !== $meta['name'] || $term->slug !== $meta['slug'] ) {
			WP_CLI::log(
				sprintf(
					'[%s] normalize term #%d "%s" (%s) → "%s" (%s)',
					$group_key,
					$term->term_id,
					$term->name,
					$term->slug,
					$meta['name'],
					$meta['slug']
				)
			);

			if ( ! $dry_run ) {
				$result = wp_update_term(
					(int) $term->term_id,
					'pa_brand',
					array(
						'name' => $meta['name'],
						'slug' => $meta['slug'],
					)
				);

				if ( is_wp_error( $result ) ) {
					WP_CLI::warning( $result->get_error_message() );
				} else {
					++$renamed_terms;
				}
			}
		} else {
			WP_CLI::log( sprintf( '[%s] ok — single term #%d (%d products)', $group_key, $term->term_id, $actual_count ) );
		}

		continue;
	}

	$canonical = motorock_pick_canonical_term( $terms );
	$losers    = array_values(
		array_filter(
			$terms,
			static function ( $term ) use ( $canonical ) {
				return (int) $term->term_id !== (int) $canonical->term_id;
			}
		)
	);

	WP_CLI::log(
		sprintf(
			'[%s] merge %d terms → keep #%d "%s" (%s)',
			$group_key,
			count( $terms ),
			$canonical->term_id,
			$canonical->name,
			$canonical->slug
		)
	);

	foreach ( $losers as $loser ) {
		$loser_count = motorock_count_term_products( (int) $loser->term_id );
		WP_CLI::log(
			sprintf(
				'  - merge term #%d "%s" (%s) — %d products',
				$loser->term_id,
				$loser->name,
				$loser->slug,
				$loser_count
			)
		);

		if ( $loser_count > 0 ) {
			$moved = motorock_merge_term_products( (int) $loser->term_id, (int) $canonical->term_id, $dry_run );
			$merged_products += $moved;
			WP_CLI::log( sprintf( '    moved %d products', $moved ) );

			if ( ! $dry_run && $moved < $loser_count ) {
				WP_CLI::warning(
					sprintf(
						'    expected to move %d products but only moved %d — skipping delete for term #%d',
						$loser_count,
						$moved,
						$loser->term_id
					)
				);
				continue;
			}
		}

		if ( ! $dry_run ) {
			$deleted = wp_delete_term( (int) $loser->term_id, 'pa_brand' );
			if ( is_wp_error( $deleted ) ) {
				WP_CLI::warning( '    delete failed: ' . $deleted->get_error_message() );
			} else {
				++$deleted_terms;
				WP_CLI::log( '    deleted duplicate term' );
			}
		} else {
			++$deleted_terms;
		}
	}

	if ( $canonical->name !== $meta['name'] || $canonical->slug !== $meta['slug'] ) {
		WP_CLI::log(
			sprintf(
				'  rename canonical #%d → "%s" (%s)',
				$canonical->term_id,
				$meta['name'],
				$meta['slug']
			)
		);

		if ( ! $dry_run ) {
			$result = wp_update_term(
				(int) $canonical->term_id,
				'pa_brand',
				array(
					'name' => $meta['name'],
					'slug' => $meta['slug'],
				)
			);

			if ( is_wp_error( $result ) ) {
				WP_CLI::warning( $result->get_error_message() );
			} else {
				++$renamed_terms;
			}
		}
	}
}

$orphan_terms = motorock_delete_orphan_pa_brand_terms( $dry_run );

if ( $orphan_terms > 0 ) {
	WP_CLI::log( sprintf( 'Removed %d orphan pa_brand term rows from wp_terms.', $orphan_terms ) );
}

if ( ! $dry_run && function_exists( 'wc_recount_all_terms' ) ) {
	wc_recount_all_terms();
}

WP_CLI::success(
	sprintf(
		'Done. Groups: %d. Products reassigned: %d. Duplicate terms removed: %d. Terms renamed: %d. Orphan terms removed: %d.',
		count( $groups ),
		$merged_products,
		$deleted_terms,
		$renamed_terms,
		$orphan_terms
	)
);
