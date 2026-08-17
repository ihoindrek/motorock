<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Related_Products {

	const PAGE_SLUG    = 'motorock-commerce-ai-related';
	const MAX_PRODUCTS = 25;

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'bulk_actions-edit-product', array( __CLASS__, 'register_bulk_action' ) );
		add_filter( 'handle_bulk_actions-edit-product', array( __CLASS__, 'handle_bulk_action' ), 10, 3 );
	}

	public static function register_bulk_action( $actions ) {
		$actions['motorock_ai_related'] = __( 'Commerce AI (related products)', 'motorock-commerce-ai' );
		return $actions;
	}

	public static function handle_bulk_action( $redirect, $action, $post_ids ) {
		if ( $action !== 'motorock_ai_related' ) {
			return $redirect;
		}

		$ids = array_values(
			array_filter(
				array_map( 'intval', (array) $post_ids ),
				static function ( $id ) {
					return $id > 0;
				}
			)
		);

		if ( empty( $ids ) ) {
			return $redirect;
		}

		return add_query_arg(
			array(
				'page'        => self::PAGE_SLUG,
				'product_ids' => implode( ',', $ids ),
			),
			admin_url( 'admin.php' )
		);
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== Motorock_Commerce_Ai_Admin_Menu::page_hook( self::PAGE_SLUG ) ) {
			return;
		}

		wp_enqueue_style(
			'motorock-commerce-ai-admin-related',
			plugins_url( '../assets/admin-related-products.css', __FILE__ ),
			array(),
			MOTOROCK_COMMERCE_AI_VERSION
		);

		wp_register_script(
			'motorock-commerce-ai-admin-related',
			plugins_url( '../assets/admin-related-products.js', __FILE__ ),
			array( 'motorock-ai-storefront-client' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		Motorock_Ai_Admin_Storefront_Config::enqueue_for(
			'motorock-commerce-ai-admin-related',
			'MotorockCommerceAiRelated',
			array(
				'maxBulk' => self::MAX_PRODUCTS,
				'i18n'    => array(
					'running'          => __( 'Generating recommendations… this can take 20–60 seconds. WordPress stays responsive.', 'motorock-commerce-ai' ),
					'dryRunOk'         => __( 'Dry run complete — preview below. Nothing saved.', 'motorock-commerce-ai' ),
					'saved'            => __( 'Related product slugs saved to WooCommerce meta.', 'motorock-commerce-ai' ),
					'failed'           => __( 'Generation failed.', 'motorock-commerce-ai' ),
					'notDeployed'      => __( 'Skill not deployed on storefront yet — push the latest code to Vercel (motorock.eu).', 'motorock-commerce-ai' ),
					'needProduct'      => __( 'Enter a valid WooCommerce product ID.', 'motorock-commerce-ai' ),
					'relatedSlugs'     => __( 'Recommended slugs', 'motorock-commerce-ai' ),
					'bulkPick'         => __( 'Select at least one product in the batch table.', 'motorock-commerce-ai' ),
					'bulkStarting'     => __( 'Starting bulk related products…', 'motorock-commerce-ai' ),
					'bulkProgress'     => __( 'Processing %1$d of %2$d', 'motorock-commerce-ai' ),
					'bulkDone'         => __( 'Bulk run complete.', 'motorock-commerce-ai' ),
					'bulkSummary'      => __( 'Succeeded: %1$d, failed: %2$d.', 'motorock-commerce-ai' ),
					'bulkTruncated'    => __( 'Limited to the first %d products in this run.', 'motorock-commerce-ai' ),
					'bulkItemOk'       => __( 'saved', 'motorock-commerce-ai' ),
					'bulkItemDryRun'   => __( 'preview ok', 'motorock-commerce-ai' ),
				),
			)
		);
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-commerce-ai' ) );
		}

		$selected_ids  = self::parse_product_ids_from_request();
		$load_category = isset( $_GET['load_category'] ) ? sanitize_key( wp_unslash( $_GET['load_category'] ) ) : '';
		$load_limit    = isset( $_GET['load_limit'] ) ? (int) $_GET['load_limit'] : 15;

		if ( $load_category !== '' ) {
			$selected_ids = self::find_product_ids_by_category(
				$load_category,
				min( max( $load_limit, 1 ), self::MAX_PRODUCTS )
			);
		}

		$products = self::load_products( $selected_ids );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Commerce AI — Related products', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Recommend 3–6 related products per PDP. Saved slugs override rule-based similar products on the storefront.', 'motorock-commerce-ai' ); ?>
			</p>

			<div class="motorock-related-bulk-grid">
				<div class="motorock-related-bulk-panel">
					<h2><?php esc_html_e( 'Single product', 'motorock-commerce-ai' ); ?></h2>
					<p>
						<label for="motorock-related-product-id"><?php esc_html_e( 'Product ID', 'motorock-commerce-ai' ); ?></label><br />
						<input type="number" id="motorock-related-product-id" min="1" step="1" class="small-text" />
					</p>
					<p>
						<label><input type="radio" name="motorock-related-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-related-locale" value="et" /> ET</label>
					</p>
					<p>
						<label><input type="checkbox" id="motorock-related-dry-run" checked /> <?php esc_html_e( 'Dry run (preview only)', 'motorock-commerce-ai' ); ?></label>
					</p>
					<p>
						<button type="button" class="button button-primary" id="motorock-related-generate">
							<?php esc_html_e( 'Generate related products', 'motorock-commerce-ai' ); ?>
						</button>
					</p>
					<div id="motorock-related-result" class="motorock-related-single-result" aria-live="polite"></div>
				</div>

				<div class="motorock-related-bulk-panel">
					<h2><?php esc_html_e( 'Load batch', 'motorock-commerce-ai' ); ?></h2>
					<form method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
						<input type="hidden" name="page" value="<?php echo esc_attr( self::PAGE_SLUG ); ?>" />
						<p>
							<label for="motorock-related-load-category"><?php esc_html_e( 'Category', 'motorock-commerce-ai' ); ?></label><br />
							<select id="motorock-related-load-category" name="load_category">
								<option value="motorcycles"><?php esc_html_e( 'Motorcycles', 'motorock-commerce-ai' ); ?></option>
								<option value="brixton">Brixton</option>
								<option value="motron">Motron</option>
								<option value="malaguti">Malaguti</option>
								<option value=""><?php esc_html_e( 'All products', 'motorock-commerce-ai' ); ?></option>
							</select>
						</p>
						<p>
							<label for="motorock-related-load-limit"><?php esc_html_e( 'Max products', 'motorock-commerce-ai' ); ?></label><br />
							<input type="number" id="motorock-related-load-limit" name="load_limit" min="1" max="<?php echo esc_attr( (string) self::MAX_PRODUCTS ); ?>" value="15" />
						</p>
						<p>
							<button type="submit" class="button"><?php esc_html_e( 'Load products', 'motorock-commerce-ai' ); ?></button>
						</p>
					</form>
					<p class="description">
						<?php esc_html_e( 'Tip: filter the Products list, select rows, then Bulk actions → Commerce AI (related products).', 'motorock-commerce-ai' ); ?>
					</p>
				</div>
			</div>

			<h2><?php esc_html_e( 'Bulk run', 'motorock-commerce-ai' ); ?> (<?php echo esc_html( (string) count( $products ) ); ?>)</h2>

			<?php if ( empty( $products ) ) : ?>
				<p><?php esc_html_e( 'No products loaded yet. Use Load batch or bulk-select from the product list.', 'motorock-commerce-ai' ); ?></p>
			<?php else : ?>
				<p>
					<label><input type="radio" name="motorock-related-bulk-locale" value="en" checked /> EN</label>
					&nbsp;
					<label><input type="radio" name="motorock-related-bulk-locale" value="et" /> ET</label>
					&nbsp;&nbsp;
					<label><input type="checkbox" id="motorock-related-bulk-dry-run" checked /> <?php esc_html_e( 'Dry run (preview only)', 'motorock-commerce-ai' ); ?></label>
				</p>
				<table class="widefat striped">
					<thead>
						<tr>
							<td class="check-column"><input type="checkbox" id="motorock-related-bulk-select-all" checked /></td>
							<th><?php esc_html_e( 'Product', 'motorock-commerce-ai' ); ?></th>
							<th><?php esc_html_e( 'ID', 'motorock-commerce-ai' ); ?></th>
							<th><?php esc_html_e( 'Related slugs', 'motorock-commerce-ai' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $products as $product ) : ?>
							<tr>
								<th scope="row" class="check-column">
									<input
										type="checkbox"
										class="motorock-related-bulk-product"
										value="<?php echo esc_attr( (string) $product['id'] ); ?>"
										data-title="<?php echo esc_attr( $product['title'] ); ?>"
										checked
									/>
								</th>
								<td>
									<a href="<?php echo esc_url( get_edit_post_link( $product['id'] ) ); ?>">
										<?php echo esc_html( $product['title'] ); ?>
									</a>
								</td>
								<td><?php echo esc_html( (string) $product['id'] ); ?></td>
								<td><?php echo esc_html( $product['related'] ?: '—' ); ?></td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
				<p>
					<button type="button" class="button button-primary" id="motorock-related-bulk-start">
						<?php esc_html_e( 'Run bulk related products', 'motorock-commerce-ai' ); ?>
					</button>
				</p>
			<?php endif; ?>

			<div id="motorock-related-bulk-progress" class="motorock-related-bulk-progress" aria-live="polite"></div>
			<div id="motorock-related-bulk-log"></div>
		</div>
		<?php
	}

	private static function parse_product_ids_from_request() {
		if ( empty( $_GET['product_ids'] ) ) {
			return array();
		}

		$raw   = sanitize_text_field( wp_unslash( $_GET['product_ids'] ) );
		$parts = array_map( 'intval', explode( ',', $raw ) );

		return array_values(
			array_unique(
				array_filter(
					$parts,
					static function ( $id ) {
						return $id > 0;
					}
				)
			)
		);
	}

	private static function find_product_ids_by_category( $category_slug, $limit ) {
		$args = array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => $limit,
			'fields'         => 'ids',
			'orderby'        => 'modified',
			'order'          => 'ASC',
			'no_found_rows'  => true,
		);

		if ( $category_slug !== '' ) {
			$args['tax_query'] = array(
				array(
					'taxonomy' => 'product_cat',
					'field'    => 'slug',
					'terms'    => array( $category_slug ),
				),
			);
		}

		$query = new WP_Query( $args );
		return is_array( $query->posts ) ? $query->posts : array();
	}

	private static function load_products( $product_ids ) {
		$products = array();

		foreach ( $product_ids as $product_id ) {
			$product_id = (int) $product_id;
			if ( ! $product_id ) {
				continue;
			}

			$post = get_post( $product_id );
			if ( ! $post || $post->post_type !== 'product' ) {
				continue;
			}

			$related_raw = get_post_meta( $product_id, '_motorock_related_slugs', true );
			$related     = self::format_related_meta_summary( $related_raw );

			$products[] = array(
				'id'      => $product_id,
				'title'   => get_the_title( $product_id ),
				'related' => $related,
			);
		}

		return $products;
	}

	private static function format_related_meta_summary( $raw ) {
		if ( ! is_string( $raw ) || $raw === '' ) {
			return '';
		}

		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) ) {
			return '';
		}

		$slugs = array_values(
			array_filter(
				$decoded,
				static function ( $slug ) {
					return is_string( $slug ) && $slug !== '';
				}
			)
		);

		if ( empty( $slugs ) ) {
			return '';
		}

		return implode( ', ', array_slice( $slugs, 0, 4 ) ) . ( count( $slugs ) > 4 ? '…' : '' );
	}
}
