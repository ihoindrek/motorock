<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Blog {

	const PAGE_SLUG = 'motorock-commerce-ai-blog';

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== Motorock_Commerce_Ai_Admin_Menu::page_hook( self::PAGE_SLUG ) ) {
			return;
		}

		wp_enqueue_script(
			'motorock-commerce-ai-admin-blog',
			plugins_url( '../assets/admin-blog.js', __FILE__ ),
			array( 'wp-api-fetch' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		wp_localize_script(
			'motorock-commerce-ai-admin-blog',
			'MotorockCommerceAiBlog',
			array(
				'restUrl'     => rest_url( 'motorock/v1/commerce-ai/run' ),
				'nonce'       => wp_create_nonce( 'wp_rest' ),
				'postEditUrl' => admin_url( 'post.php?post=POST_ID&action=edit' ),
				'i18n'        => array(
					'running'   => __( 'Generating article… this can take 30–90 seconds.', 'motorock-commerce-ai' ),
					'dryRunOk'  => __( 'Dry run complete — preview below. Nothing saved.', 'motorock-commerce-ai' ),
					'saved'     => __( 'Draft post created in WordPress.', 'motorock-commerce-ai' ),
					'failed'    => __( 'Generation failed.', 'motorock-commerce-ai' ),
					'needTopic' => __( 'Enter a topic, brief, or product ID.', 'motorock-commerce-ai' ),
					'openDraft' => __( 'Open draft in editor', 'motorock-commerce-ai' ),
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
			<h1><?php esc_html_e( 'Commerce AI — Blog generator', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Draft a journal post from a topic, brief, or product context. Posts are saved as WordPress drafts for review.', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="motorock-blog-topic"><?php esc_html_e( 'Topic', 'motorock-commerce-ai' ); ?></label></th>
					<td><input type="text" id="motorock-blog-topic" class="regular-text" placeholder="<?php esc_attr_e( 'Spring riding gear essentials', 'motorock-commerce-ai' ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-brief"><?php esc_html_e( 'Brief', 'motorock-commerce-ai' ); ?></label></th>
					<td><textarea id="motorock-blog-brief" class="large-text" rows="4" placeholder="<?php esc_attr_e( 'Optional angle, audience, or CTA…', 'motorock-commerce-ai' ); ?>"></textarea></td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-product-id"><?php esc_html_e( 'Product ID', 'motorock-commerce-ai' ); ?></label></th>
					<td><input type="number" id="motorock-blog-product-id" min="1" step="1" class="small-text" /></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td>
						<label><input type="radio" name="motorock-blog-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-blog-locale" value="et" /> ET</label>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Options', 'motorock-commerce-ai' ); ?></th>
					<td>
						<label><input type="checkbox" id="motorock-blog-dry-run" checked /> <?php esc_html_e( 'Dry run (preview only)', 'motorock-commerce-ai' ); ?></label>
					</td>
				</tr>
			</table>

			<p>
				<button type="button" class="button button-primary" id="motorock-blog-generate">
					<?php esc_html_e( 'Generate article', 'motorock-commerce-ai' ); ?>
				</button>
			</p>

			<div id="motorock-blog-result" aria-live="polite"></div>
		</div>
		<?php
	}
}
