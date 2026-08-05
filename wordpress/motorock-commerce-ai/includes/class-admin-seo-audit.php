<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Seo_Audit {

	const PAGE_SLUG = 'motorock-commerce-ai-seo-audit';

	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function register_menu() {
		add_submenu_page(
			'edit.php?post_type=product',
			__( 'SEO audit', 'motorock-commerce-ai' ),
			__( '↳ SEO audit', 'motorock-commerce-ai' ),
			'edit_products',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' )
		);
	}

	public static function enqueue_assets( $hook_suffix ) {
		if ( $hook_suffix !== 'product_page_' . self::PAGE_SLUG ) {
			return;
		}

		wp_enqueue_style(
			'motorock-commerce-ai-admin-seo-audit',
			plugins_url( '../assets/admin-seo-audit.css', __FILE__ ),
			array(),
			MOTOROCK_COMMERCE_AI_VERSION
		);

		wp_enqueue_script(
			'motorock-commerce-ai-admin-seo-audit',
			plugins_url( '../assets/admin-seo-audit.js', __FILE__ ),
			array( 'wp-api-fetch' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		wp_localize_script(
			'motorock-commerce-ai-admin-seo-audit',
			'MotorockCommerceAiSeoAudit',
			array(
				'restUrl'        => rest_url( 'motorock/v1/commerce-ai/run' ),
				'nonce'          => wp_create_nonce( 'wp_rest' ),
				'productEditUrl' => admin_url( 'post.php?post=PRODUCT_ID&action=edit' ),
				'chunkSize'      => 20,
				'i18n'           => array(
					'running'          => __( 'Starting SEO audit…', 'motorock-commerce-ai' ),
					'done'             => __( 'Audit complete.', 'motorock-commerce-ai' ),
					'failed'           => __( 'Audit failed.', 'motorock-commerce-ai' ),
					'finalizing'       => __( 'Finalizing report…', 'motorock-commerce-ai' ),
					'progressProducts' => __( 'Scanning products', 'motorock-commerce-ai' ),
					'progressPosts'    => __( 'Scanning blog posts', 'motorock-commerce-ai' ),
					'progressCount'    => __( '%1$d of ~%2$d items', 'motorock-commerce-ai' ),
					'scanned'      => __( 'Scanned', 'motorock-commerce-ai' ),
					'errors'       => __( 'Errors', 'motorock-commerce-ai' ),
					'warnings'     => __( 'Warnings', 'motorock-commerce-ai' ),
					'avgScore'     => __( 'Avg score', 'motorock-commerce-ai' ),
					'noIssues'     => __( 'No issues found in scanned items.', 'motorock-commerce-ai' ),
					'showingTop100'=> __( 'Showing top 100 of %d items.', 'motorock-commerce-ai' ),
					'fixWithAi'    => __( 'Fix with AI', 'motorock-commerce-ai' ),
					'openProduct'  => __( 'Open product', 'motorock-commerce-ai' ),
					'fixRunning'   => __( 'Generating draft… 30–60s', 'motorock-commerce-ai' ),
					'fixDone'      => __( 'Draft saved — review in product editor', 'motorock-commerce-ai' ),
					'fixFailed'    => __( 'AI fix failed.', 'motorock-commerce-ai' ),
				),
			)
		);
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-commerce-ai' ) );
		}
		?>
		<div class="wrap motorock-seo-audit-wrap">
			<h1><?php esc_html_e( 'Commerce AI — SEO audit', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Read-only scan for missing meta, thin content, ALT gaps, and duplicate titles. Use Fix with AI on product rows to generate draft content for the gaps found.', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><?php esc_html_e( 'Scope', 'motorock-commerce-ai' ); ?></th>
					<td>
						<select id="motorock-seo-audit-scope">
							<option value="all"><?php esc_html_e( 'Products + blog posts', 'motorock-commerce-ai' ); ?></option>
							<option value="products"><?php esc_html_e( 'Products only', 'motorock-commerce-ai' ); ?></option>
							<option value="posts"><?php esc_html_e( 'Blog posts only', 'motorock-commerce-ai' ); ?></option>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-seo-audit-category"><?php esc_html_e( 'Product category', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<input type="text" id="motorock-seo-audit-category" class="regular-text" placeholder="<?php esc_attr_e( 'Optional, e.g. motorcycles', 'motorock-commerce-ai' ); ?>" />
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-seo-audit-limit"><?php esc_html_e( 'Limit', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<input type="number" id="motorock-seo-audit-limit" min="10" max="500" value="200" class="small-text" />
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td>
						<label><input type="radio" name="motorock-seo-audit-locale" value="en" checked /> EN</label>
						&nbsp;
						<label><input type="radio" name="motorock-seo-audit-locale" value="et" /> ET</label>
					</td>
				</tr>
			</table>

			<p>
				<button type="button" class="button button-primary" id="motorock-seo-audit-run">
					<?php esc_html_e( 'Run audit', 'motorock-commerce-ai' ); ?>
				</button>
			</p>

			<div id="motorock-seo-audit-summary" aria-live="polite"></div>
			<div id="motorock-seo-audit-results"></div>
		</div>
		<?php
	}
}
