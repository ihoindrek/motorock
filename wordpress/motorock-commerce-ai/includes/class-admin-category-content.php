<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Category_Content {

	const PAGE_SLUG = 'motorock-commerce-ai-category-content';

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	private static function taxonomy_options() {
		if ( ! taxonomy_exists( 'product_cat' ) ) {
			return array();
		}

		$terms = get_terms(
			array(
				'taxonomy'   => 'product_cat',
				'hide_empty' => false,
				'orderby'    => 'name',
				'number'     => 300,
			)
		);

		return is_wp_error( $terms ) ? array() : $terms;
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== Motorock_Commerce_Ai_Admin_Menu::page_hook( self::PAGE_SLUG ) ) {
			return;
		}

		wp_register_script(
			'motorock-commerce-ai-admin-category-content',
			content_url( 'mu-plugins/motorock-commerce-ai/assets/admin-category-content.js' ),
			array( 'motorock-ai-storefront-client' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		Motorock_Ai_Admin_Storefront_Config::enqueue_for(
			'motorock-commerce-ai-admin-category-content',
			'MotorockCommerceAiCategoryContent',
			array(
				'i18n' => array(
					'running'    => __( 'Generating category SEO text… 20–60 seconds.', 'motorock-commerce-ai' ),
					'dryRunOk'   => __( 'Preview below — nothing saved yet.', 'motorock-commerce-ai' ),
					'saved'      => __( 'Category description saved in WooCommerce.', 'motorock-commerce-ai' ),
					'failed'     => __( 'Generation failed.', 'motorock-commerce-ai' ),
					'needCategory' => __( 'Select a category.', 'motorock-commerce-ai' ),
				),
			)
		);
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-commerce-ai' ) );
		}

		$categories = self::taxonomy_options();
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Commerce AI — Category SEO content', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Generate SEO intro text for equipment category pages. Text appears at the top of category pages on motorock.eu and in meta descriptions.', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="motorock-cat-content-category"><?php esc_html_e( 'Category', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<select id="motorock-cat-content-category" class="regular-text">
							<option value=""><?php esc_html_e( '— Select category —', 'motorock-commerce-ai' ); ?></option>
							<?php foreach ( $categories as $term ) : ?>
								<option value="<?php echo esc_attr( $term->slug ); ?>">
									<?php echo esc_html( $term->name . ' (' . $term->count . ')' ); ?>
								</option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row" id="motorock-cat-content-locale-label"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td role="radiogroup" aria-labelledby="motorock-cat-content-locale-label">
						<label><input type="radio" name="motorock-cat-content-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-cat-content-locale" value="et" /> ET</label>
						&nbsp;
						<label><input type="radio" name="motorock-cat-content-locale" value="both" /> <?php esc_html_e( 'Both (EN + ET)', 'motorock-commerce-ai' ); ?></label>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-cat-content-dry-run"><?php esc_html_e( 'Options', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<label for="motorock-cat-content-dry-run">
							<input type="checkbox" id="motorock-cat-content-dry-run" checked />
							<?php esc_html_e( 'Dry run (preview only)', 'motorock-commerce-ai' ); ?>
						</label>
					</td>
				</tr>
			</table>

			<p>
				<button type="button" class="button button-primary" id="motorock-cat-content-generate">
					<?php esc_html_e( 'Generate category text', 'motorock-commerce-ai' ); ?>
				</button>
			</p>

			<div id="motorock-cat-content-result" aria-live="polite"></div>
		</div>
		<?php
	}
}
