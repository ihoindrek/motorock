<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Admin_Bulk {

	const PAGE_SLUG = 'motorock-ai-bulk';
	const MAX_PRODUCTS = 25;
	const DEFAULT_CHUNK_SIZE = 2;

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'bulk_actions-edit-product', array( __CLASS__, 'register_bulk_action' ) );
		add_filter( 'handle_bulk_actions-edit-product', array( __CLASS__, 'handle_bulk_action' ), 10, 3 );
		add_filter( 'manage_product_posts_columns', array( __CLASS__, 'register_status_column' ) );
		add_action( 'manage_product_posts_custom_column', array( __CLASS__, 'render_status_column' ), 10, 2 );
	}

	public static function register_bulk_action( $actions ) {
		$actions['motorock_ai_generate'] = __( 'Commerce AI (draft)', 'motorock-commerce-ai' );
		return $actions;
	}

	public static function handle_bulk_action( $redirect, $action, $post_ids ) {
		if ( $action !== 'motorock_ai_generate' ) {
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

	public static function register_status_column( $columns ) {
		$new_columns = array();
		$inserted    = false;

		foreach ( $columns as $key => $label ) {
			$new_columns[ $key ] = $label;

			if ( ! $inserted && ( $key === 'thumb' || $key === 'name' ) ) {
				$new_columns['motorock_ai_status'] = __( 'AI', 'motorock-ai-writer' );
				$inserted = true;
			}
		}

		if ( ! $inserted ) {
			$new_columns['motorock_ai_status'] = __( 'AI', 'motorock-ai-writer' );
		}

		return $new_columns;
	}

	public static function render_status_column( $column, $post_id ) {
		if ( $column !== 'motorock_ai_status' ) {
			return;
		}

		$summary = self::get_ai_status_summary( (int) $post_id );
		if ( $summary === null ) {
			echo '<span class="motorock-ai-list-empty" aria-hidden="true">—</span>';
			echo '<span class="screen-reader-text">' . esc_html__( 'No AI content', 'motorock-ai-writer' ) . '</span>';
			return;
		}

		$icon_class = $summary['status'] === 'draft'
			? 'dashicons-edit'
			: 'dashicons-superhero';

		$badge_class = $summary['status'] === 'draft'
			? 'motorock-ai-list-badge motorock-ai-list-badge--draft'
			: 'motorock-ai-list-badge motorock-ai-list-badge--published';

		printf(
			'<span class="%1$s" title="%2$s"><span class="dashicons %3$s" aria-hidden="true"></span><span class="screen-reader-text">%2$s</span></span>',
			esc_attr( $badge_class ),
			esc_attr( $summary['label'] ),
			esc_attr( $icon_class )
		);
	}

	/**
	 * @return array{status: string, label: string, sections: string[]}|null
	 */
	private static function get_ai_status_summary( $post_id ) {
		$status = get_post_meta( $post_id, '_motorock_ai_content_status', true );
		if ( ! is_string( $status ) || $status === '' ) {
			return null;
		}

		$sections = self::parse_sections_meta(
			get_post_meta( $post_id, '_motorock_ai_sections', true )
		);
		$generated_at = get_post_meta( $post_id, '_motorock_ai_generated_at', true );
		$sections_label = ! empty( $sections )
			? implode( ', ', $sections )
			: __( 'content', 'motorock-ai-writer' );

		$status_label = $status === 'draft'
			? __( 'AI draft', 'motorock-ai-writer' )
			: __( 'AI published', 'motorock-ai-writer' );

		$label = $status_label . ' — ' . $sections_label;
		if ( is_string( $generated_at ) && $generated_at !== '' ) {
			$label .= ' (' . $generated_at . ')';
		}

		return array(
			'status'   => $status,
			'label'    => $label,
			'sections' => $sections,
		);
	}

	/**
	 * @return string[]
	 */
	private static function parse_sections_meta( $raw ) {
		if ( ! is_string( $raw ) || $raw === '' ) {
			return array();
		}

		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		return array_values(
			array_filter(
				array_map(
					static function ( $section ) {
						return is_string( $section ) ? $section : '';
					},
					$decoded
				)
			)
		);
	}

	public static function enqueue_assets( $hook ) {
		if ( $hook === 'edit.php' ) {
			$screen = get_current_screen();
			if ( $screen && $screen->post_type === 'product' ) {
				wp_enqueue_style(
					'motorock-ai-admin-bulk',
					content_url( 'mu-plugins/motorock-ai-writer/assets/admin-bulk.css' ),
					array(),
					'0.4.1'
				);
			}
			return;
		}

		if ( $hook !== 'motorock-commerce-ai_page_' . self::PAGE_SLUG ) {
			return;
		}

		wp_enqueue_style(
			'motorock-ai-admin-bulk',
			content_url( 'mu-plugins/motorock-ai-writer/assets/admin-bulk.css' ),
			array(),
			'0.4.0'
		);

		wp_register_script(
			'motorock-ai-admin-bulk',
			content_url( 'mu-plugins/motorock-ai-writer/assets/admin-bulk.js' ),
			array( 'motorock-ai-storefront-client' ),
			defined( 'MOTOROCK_COMMERCE_AI_VERSION' ) ? MOTOROCK_COMMERCE_AI_VERSION : '0.5.6',
			true
		);

		Motorock_Ai_Admin_Storefront_Config::enqueue_for(
			'motorock-ai-admin-bulk',
			'MotorockAiBulk',
			array(
				'chunkSize' => self::DEFAULT_CHUNK_SIZE,
				'i18n'      => array(
					'starting'      => __( 'Starting batch…', 'motorock-ai-writer' ),
					'chunk'         => __( 'Processing chunk', 'motorock-ai-writer' ),
					'done'          => __( 'Batch complete.', 'motorock-ai-writer' ),
					'failed'        => __( 'Batch failed.', 'motorock-ai-writer' ),
					'notConfigured' => __( 'AI API not configured on server (MOTOROCK_AI_API_SECRET).', 'motorock-ai-writer' ),
					'pickProducts'  => __( 'Select at least one product.', 'motorock-ai-writer' ),
					'pickSections'  => __( 'Pick at least one locale and section.', 'motorock-ai-writer' ),
					'succeeded'     => __( 'Succeeded', 'motorock-ai-writer' ),
					'failedCount'   => __( 'Failed', 'motorock-ai-writer' ),
				),
			)
		);
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-ai-writer' ) );
		}

		$selected_ids = self::parse_product_ids_from_request();
		$load_category = isset( $_GET['load_category'] ) ? sanitize_key( wp_unslash( $_GET['load_category'] ) ) : '';
		$load_limit = isset( $_GET['load_limit'] ) ? (int) $_GET['load_limit'] : 15;

		if ( $load_category !== '' ) {
			$selected_ids = self::find_product_ids_by_category( $load_category, min( max( $load_limit, 1 ), self::MAX_PRODUCTS ) );
		}

		$products = self::load_products( $selected_ids );
		?>
		<div class="wrap motorock-ai-bulk-wrap">
			<h1><?php esc_html_e( 'Commerce AI — Product content', 'motorock-commerce-ai' ); ?></h1>

			<p class="description">
				<?php esc_html_e( 'Bulk-generate product descriptions, SEO, FAQ, and image ALT text. Part of the Commerce AI Engine.', 'motorock-commerce-ai' ); ?>
			</p>

			<div class="motorock-ai-bulk-grid">
				<div class="motorock-ai-bulk-panel">
					<h2><?php esc_html_e( 'Load products', 'motorock-ai-writer' ); ?></h2>
					<form method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
						<input type="hidden" name="page" value="<?php echo esc_attr( self::PAGE_SLUG ); ?>" />
						<p>
							<label for="motorock-ai-load-category"><?php esc_html_e( 'Category', 'motorock-ai-writer' ); ?></label><br />
							<select id="motorock-ai-load-category" name="load_category">
								<option value="motorcycles"><?php esc_html_e( 'Motorcycles', 'motorock-ai-writer' ); ?></option>
								<option value=""><?php esc_html_e( 'All products', 'motorock-ai-writer' ); ?></option>
							</select>
						</p>
						<p>
							<label for="motorock-ai-load-limit"><?php esc_html_e( 'Max products', 'motorock-ai-writer' ); ?></label><br />
							<input type="number" id="motorock-ai-load-limit" name="load_limit" min="1" max="<?php echo esc_attr( self::MAX_PRODUCTS ); ?>" value="15" />
						</p>
						<p>
							<button type="submit" class="button"><?php esc_html_e( 'Load products', 'motorock-ai-writer' ); ?></button>
						</p>
					</form>
					<p class="description">
						<?php esc_html_e( 'Tip: select products on the Products list and choose Bulk actions → AI Generate (draft).', 'motorock-ai-writer' ); ?>
					</p>
				</div>

				<div class="motorock-ai-bulk-panel">
					<h2><?php esc_html_e( 'Generation options', 'motorock-ai-writer' ); ?></h2>
					<p>
						<label><input type="checkbox" name="motorock_ai_bulk_locale" value="en" checked /> EN</label><br />
						<label><input type="checkbox" name="motorock_ai_bulk_locale" value="et" checked /> ET</label>
					</p>
					<p>
						<label><input type="checkbox" name="motorock_ai_bulk_section" value="description" checked /> <?php esc_html_e( 'Description', 'motorock-ai-writer' ); ?></label><br />
						<label><input type="checkbox" name="motorock_ai_bulk_section" value="seo" checked /> SEO</label><br />
						<label><input type="checkbox" name="motorock_ai_bulk_section" value="faq" checked /> FAQ</label><br />
						<label><input type="checkbox" name="motorock_ai_bulk_section" value="alt_text" /> <?php esc_html_e( 'Image ALT text', 'motorock-ai-writer' ); ?></label>
					</p>
					<p>
						<label><input type="checkbox" id="motorock-ai-bulk-dry-run" /> <?php esc_html_e( 'Dry run (preview only)', 'motorock-ai-writer' ); ?></label>
					</p>
					<p>
						<label for="motorock-ai-bulk-overwrite"><?php esc_html_e( 'Overwrite', 'motorock-ai-writer' ); ?></label><br />
						<select id="motorock-ai-bulk-overwrite">
							<option value="always" selected><?php esc_html_e( 'Always', 'motorock-ai-writer' ); ?></option>
							<option value="if_empty"><?php esc_html_e( 'Only if empty', 'motorock-ai-writer' ); ?></option>
							<option value="never"><?php esc_html_e( 'Never (fail if exists)', 'motorock-ai-writer' ); ?></option>
						</select>
					</p>
					<p>
						<label for="motorock-ai-bulk-provider"><?php esc_html_e( 'AI provider', 'motorock-ai-writer' ); ?></label><br />
						<select id="motorock-ai-bulk-provider">
							<option value=""><?php esc_html_e( 'Default (from env)', 'motorock-ai-writer' ); ?></option>
							<option value="anthropic">Anthropic (Claude)</option>
							<option value="openai">OpenAI</option>
							<option value="gemini">Google Gemini</option>
						</select>
					</p>
					<p>
						<button type="button" class="button button-primary" id="motorock-ai-bulk-start">
							<?php esc_html_e( 'Start bulk generate', 'motorock-ai-writer' ); ?>
						</button>
					</p>
				</div>
			</div>

			<h2><?php esc_html_e( 'Products in batch', 'motorock-ai-writer' ); ?> (<?php echo esc_html( (string) count( $products ) ); ?>)</h2>

			<?php if ( empty( $products ) ) : ?>
				<p><?php esc_html_e( 'No products loaded yet. Use Load products or bulk-select from the product list.', 'motorock-ai-writer' ); ?></p>
			<?php else : ?>
				<table class="widefat striped motorock-ai-bulk-table">
					<thead>
						<tr>
							<td class="check-column"><input type="checkbox" id="motorock-ai-bulk-select-all" checked /></td>
							<th><?php esc_html_e( 'Product', 'motorock-ai-writer' ); ?></th>
							<th><?php esc_html_e( 'ID', 'motorock-ai-writer' ); ?></th>
							<th><?php esc_html_e( 'AI status', 'motorock-ai-writer' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $products as $product ) : ?>
							<tr>
								<th scope="row" class="check-column">
									<input
										type="checkbox"
										class="motorock-ai-bulk-product"
										value="<?php echo esc_attr( (string) $product['id'] ); ?>"
										checked
									/>
								</th>
								<td>
									<a href="<?php echo esc_url( get_edit_post_link( $product['id'] ) ); ?>">
										<?php echo esc_html( $product['title'] ); ?>
									</a>
								</td>
								<td><?php echo esc_html( (string) $product['id'] ); ?></td>
								<td><?php echo esc_html( $product['status'] ?: '—' ); ?></td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>

			<div id="motorock-ai-bulk-progress" class="motorock-ai-bulk-progress" aria-live="polite"></div>
			<div id="motorock-ai-bulk-log" class="motorock-ai-bulk-log"></div>
		</div>
		<?php
	}

	private static function parse_product_ids_from_request() {
		if ( empty( $_GET['product_ids'] ) ) {
			return array();
		}

		$raw = sanitize_text_field( wp_unslash( $_GET['product_ids'] ) );
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

			$products[] = array(
				'id'     => $product_id,
				'title'  => get_the_title( $product_id ),
				'status' => (string) get_post_meta( $product_id, '_motorock_ai_content_status', true ),
			);
		}

		return $products;
	}
}
