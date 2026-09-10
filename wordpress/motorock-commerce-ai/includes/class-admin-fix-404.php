<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Fix_404 {

	const PAGE_SLUG = 'motorock-commerce-ai-fix-404';

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== Motorock_Commerce_Ai_Admin_Menu::page_hook( self::PAGE_SLUG ) ) {
			return;
		}

		wp_register_script(
			'motorock-commerce-ai-admin-fix-404',
			content_url( 'mu-plugins/motorock-commerce-ai/assets/admin-fix-404.js' ),
			array( 'motorock-ai-storefront-client' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		Motorock_Ai_Admin_Storefront_Config::enqueue_for(
			'motorock-commerce-ai-admin-fix-404',
			'MotorockCommerceAiFix404',
			array(
				'i18n' => array(
					'running'   => __( 'Matching broken URLs to live pages…', 'motorock-commerce-ai' ),
					'done'      => __( 'Redirect suggestions below. Add these in Vercel redirects or your redirect plugin.', 'motorock-commerce-ai' ),
					'failed'    => __( 'Analysis failed.', 'motorock-commerce-ai' ),
					'needUrls'  => __( 'Paste at least one broken URL.', 'motorock-commerce-ai' ),
					'unmatched' => __( 'No match found for:', 'motorock-commerce-ai' ),
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
			<h1><?php esc_html_e( 'Commerce AI — 404 repair', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Paste broken URLs from Google Search Console or a crawl report. The AI suggests redirect targets from your live catalog.', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="motorock-fix-404-urls"><?php esc_html_e( 'Broken URLs', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<textarea id="motorock-fix-404-urls" class="large-text code" rows="10" placeholder="/en/product/old-slug&#10;https://motorock.eu/et/toode/vana-slug"></textarea>
					</td>
				</tr>
				<tr>
					<th scope="row" id="motorock-fix-404-locale-label"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td role="radiogroup" aria-labelledby="motorock-fix-404-locale-label">
						<label><input type="radio" name="motorock-fix-404-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-fix-404-locale" value="et" /> ET</label>
					</td>
				</tr>
			</table>

			<p>
				<button type="button" class="button button-primary" id="motorock-fix-404-run">
					<?php esc_html_e( 'Suggest redirects', 'motorock-commerce-ai' ); ?>
				</button>
			</p>

			<div id="motorock-fix-404-result" aria-live="polite"></div>
		</div>
		<?php
	}
}
