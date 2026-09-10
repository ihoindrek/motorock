<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Internal_Links {

	const PAGE_SLUG = 'motorock-commerce-ai-internal-links';

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== Motorock_Commerce_Ai_Admin_Menu::page_hook( self::PAGE_SLUG ) ) {
			return;
		}

		wp_register_script(
			'motorock-commerce-ai-admin-internal-links',
			content_url( 'mu-plugins/motorock-commerce-ai/assets/admin-internal-links.js' ),
			array( 'motorock-ai-storefront-client' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		Motorock_Ai_Admin_Storefront_Config::enqueue_for(
			'motorock-commerce-ai-admin-internal-links',
			'MotorockCommerceAiInternalLinks',
			array(
				'i18n' => array(
					'running'  => __( 'Analyzing blog posts for internal link opportunities…', 'motorock-commerce-ai' ),
					'done'     => __( 'Suggestions below — add links manually in the post editor.', 'motorock-commerce-ai' ),
					'failed'   => __( 'Analysis failed.', 'motorock-commerce-ai' ),
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
			<h1><?php esc_html_e( 'Commerce AI — Internal links', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Suggest internal links to add inside journal articles — products, categories, and related posts.', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="motorock-internal-links-limit"><?php esc_html_e( 'Posts to scan', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<input type="number" id="motorock-internal-links-limit" min="1" max="10" value="5" class="small-text" />
						<p class="description"><?php esc_html_e( 'Latest journal posts (max 10). Leave post slug empty to scan multiple.', 'motorock-commerce-ai' ); ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-internal-links-slug"><?php esc_html_e( 'Post slug (optional)', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<input type="text" id="motorock-internal-links-slug" class="regular-text" placeholder="<?php esc_attr_e( 'e.g. autumn-riding-gear-guide', 'motorock-commerce-ai' ); ?>" />
					</td>
				</tr>
				<tr>
					<th scope="row" id="motorock-internal-links-locale-label"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td role="radiogroup" aria-labelledby="motorock-internal-links-locale-label">
						<label><input type="radio" name="motorock-internal-links-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-internal-links-locale" value="et" /> ET</label>
					</td>
				</tr>
			</table>

			<p>
				<button type="button" class="button button-primary" id="motorock-internal-links-run">
					<?php esc_html_e( 'Suggest links', 'motorock-commerce-ai' ); ?>
				</button>
			</p>

			<div id="motorock-internal-links-result" aria-live="polite"></div>
		</div>
		<?php
	}
}
