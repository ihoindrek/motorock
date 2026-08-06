<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Related_Products {

	const PAGE_SLUG = 'motorock-commerce-ai-related';

	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function register_menu() {
		add_submenu_page(
			'edit.php?post_type=product',
			__( 'Related products', 'motorock-commerce-ai' ),
			__( '↳ Related products', 'motorock-commerce-ai' ),
			'edit_products',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' )
		);
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== 'product_page_' . self::PAGE_SLUG ) {
			return;
		}

		wp_enqueue_script(
			'motorock-commerce-ai-admin-related',
			plugins_url( '../assets/admin-related-products.js', __FILE__ ),
			array( 'wp-api-fetch' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		wp_localize_script(
			'motorock-commerce-ai-admin-related',
			'MotorockCommerceAiRelated',
			array(
				'restUrl' => rest_url( 'motorock/v1/commerce-ai/run' ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'i18n'    => array(
					'running'      => __( 'Generating recommendations… this can take 20–60 seconds.', 'motorock-commerce-ai' ),
					'dryRunOk'     => __( 'Dry run complete — preview below. Nothing saved.', 'motorock-commerce-ai' ),
					'saved'        => __( 'Related product slugs saved to WooCommerce meta.', 'motorock-commerce-ai' ),
					'failed'       => __( 'Generation failed.', 'motorock-commerce-ai' ),
					'notDeployed'  => __( 'Skill not deployed on storefront yet — push the latest code to Vercel (motorock.eu).', 'motorock-commerce-ai' ),
					'needProduct'  => __( 'Enter a valid WooCommerce product ID.', 'motorock-commerce-ai' ),
					'relatedSlugs' => __( 'Recommended slugs', 'motorock-commerce-ai' ),
				),
			)
		);
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-commerce-ai' ) );
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Commerce AI — Related products', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Recommend 3–6 related products from the same catalog segment. Saved slugs appear on the storefront PDP (overrides rule-based similar products).', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="motorock-related-product-id"><?php esc_html_e( 'Product ID', 'motorock-commerce-ai' ); ?></label></th>
					<td><input type="number" id="motorock-related-product-id" min="1" step="1" class="small-text" /></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td>
						<label><input type="radio" name="motorock-related-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-related-locale" value="et" /> ET</label>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Options', 'motorock-commerce-ai' ); ?></th>
					<td>
						<label><input type="checkbox" id="motorock-related-dry-run" checked /> <?php esc_html_e( 'Dry run (preview only)', 'motorock-commerce-ai' ); ?></label>
					</td>
				</tr>
			</table>

			<p>
				<button type="button" class="button button-primary" id="motorock-related-generate">
					<?php esc_html_e( 'Generate related products', 'motorock-commerce-ai' ); ?>
				</button>
			</p>

			<div id="motorock-related-result" aria-live="polite"></div>
		</div>
		<?php
	}
}
