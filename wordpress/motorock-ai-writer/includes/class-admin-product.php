<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Ai_Admin_Product {

	public static function register() {
		add_action( 'add_meta_boxes', array( __CLASS__, 'register_meta_box' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function register_meta_box() {
		add_meta_box(
			'motorock-ai-writer',
			__( 'Motorock AI', 'motorock-ai-writer' ),
			array( __CLASS__, 'render_meta_box' ),
			'product',
			'side',
			'default'
		);
	}

	public static function enqueue_assets( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || $screen->post_type !== 'product' ) {
			return;
		}

		wp_enqueue_script(
			'motorock-ai-admin-product',
			content_url( 'mu-plugins/motorock-ai-writer/assets/admin-product.js' ),
			array( 'wp-api-fetch' ),
			'0.3.2',
			true
		);

		$product_id = (int) get_the_ID();
		$draft_locales = self::list_draft_locales( $product_id );

		wp_localize_script(
			'motorock-ai-admin-product',
			'MotorockAiAdmin',
			array(
				'restUrl'       => rest_url( 'motorock/v1/ai/generate' ),
				'publishUrl'    => rest_url( 'motorock/v1/ai/publish-admin' ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'productId'     => $product_id,
				'draftLocales'  => $draft_locales,
				'status'        => self::read_status( $product_id ),
				'i18n'          => array(
					'running'        => __( 'Generating… this can take 30–60 seconds.', 'motorock-ai-writer' ),
					'dryRunOk'       => __( 'Dry run complete — preview below. Nothing saved.', 'motorock-ai-writer' ),
					'saved'          => __( 'Content saved to WooCommerce.', 'motorock-ai-writer' ),
					'savedDraft'     => __( 'Draft saved for review. Use Approve & publish when ready.', 'motorock-ai-writer' ),
					'published'      => __( 'Draft content published.', 'motorock-ai-writer' ),
					'failed'         => __( 'Generation failed.', 'motorock-ai-writer' ),
					'notConfigured'  => __( 'AI API not configured on server (MOTOROCK_AI_API_SECRET).', 'motorock-ai-writer' ),
					'pickSections'   => __( 'Pick at least one locale and section.', 'motorock-ai-writer' ),
					'publishing'     => __( 'Publishing draft content…', 'motorock-ai-writer' ),
					'publishingAll'  => __( 'Publishing draft content for all locales…', 'motorock-ai-writer' ),
				),
			)
		);
	}

	public static function render_meta_box( $post ) {
		$status = self::read_status( (int) $post->ID );
		$content_status = get_post_meta( (int) $post->ID, '_motorock_ai_content_status', true );
		$draft_locales = self::list_draft_locales( (int) $post->ID );
		?>
		<div id="motorock-ai-panel">
			<p class="description">
				<?php esc_html_e( 'Generate product content via the headless AI engine. Select only the sections you want to regenerate.', 'motorock-ai-writer' ); ?>
				<br />
				<strong><?php esc_html_e( 'Specs:', 'motorock-ai-writer' ); ?></strong>
				<?php esc_html_e( 'Paste technical specifications in the Motorock toode → Technical specifications (HTML) field. AI does not update that field.', 'motorock-ai-writer' ); ?>
			</p>

			<?php if ( ! empty( $status['generatedAt'] ) ) : ?>
				<p>
					<strong><?php esc_html_e( 'Last AI run', 'motorock-ai-writer' ); ?>:</strong><br />
					<?php echo esc_html( $status['generatedAt'] ); ?>
					<?php if ( ! empty( $status['sections'] ) ) : ?>
						<br /><span class="description"><?php echo esc_html( implode( ', ', $status['sections'] ) ); ?></span>
					<?php endif; ?>
					<?php if ( is_string( $content_status ) && $content_status !== '' ) : ?>
						<br /><span class="description"><?php esc_html_e( 'Status', 'motorock-ai-writer' ); ?>: <?php echo esc_html( $content_status ); ?></span>
					<?php endif; ?>
				</p>
			<?php endif; ?>

			<p>
				<label><input type="checkbox" name="motorock_ai_locale" value="en" checked /> EN</label><br />
				<label><input type="checkbox" name="motorock_ai_locale" value="et" checked /> ET</label>
			</p>

			<p>
				<label><input type="checkbox" name="motorock_ai_section" value="description" checked /> <?php esc_html_e( 'Description', 'motorock-ai-writer' ); ?></label><br />
				<label><input type="checkbox" name="motorock_ai_section" value="seo" checked /> SEO</label><br />
				<label><input type="checkbox" name="motorock_ai_section" value="faq" /> FAQ</label><br />
				<label><input type="checkbox" name="motorock_ai_section" value="alt_text" /> <?php esc_html_e( 'Image ALT text', 'motorock-ai-writer' ); ?></label>
			</p>

			<p>
				<label>
					<input type="checkbox" id="motorock-ai-dry-run" />
					<?php esc_html_e( 'Dry run (preview only)', 'motorock-ai-writer' ); ?>
				</label>
			</p>

			<p>
				<label for="motorock-ai-overwrite"><?php esc_html_e( 'Overwrite', 'motorock-ai-writer' ); ?></label><br />
				<select id="motorock-ai-overwrite">
					<option value="if_empty"><?php esc_html_e( 'Only if empty', 'motorock-ai-writer' ); ?></option>
					<option value="always" selected><?php esc_html_e( 'Always', 'motorock-ai-writer' ); ?></option>
					<option value="never"><?php esc_html_e( 'Never (fail if exists)', 'motorock-ai-writer' ); ?></option>
				</select>
			</p>

			<p>
				<label for="motorock-ai-publish-status"><?php esc_html_e( 'Save as', 'motorock-ai-writer' ); ?></label><br />
				<select id="motorock-ai-publish-status">
					<option value="draft"><?php esc_html_e( 'Draft (review first)', 'motorock-ai-writer' ); ?></option>
					<option value="published"><?php esc_html_e( 'Published (live immediately)', 'motorock-ai-writer' ); ?></option>
				</select>
			</p>

			<p>
				<button type="button" class="button button-primary" id="motorock-ai-generate">
					<?php esc_html_e( 'Generate with AI', 'motorock-ai-writer' ); ?>
				</button>
			</p>

			<?php if ( ! empty( $draft_locales ) ) : ?>
				<p>
					<button type="button" class="button" id="motorock-ai-publish">
						<?php esc_html_e( 'Approve & publish draft', 'motorock-ai-writer' ); ?>
					</button>
				</p>
			<?php endif; ?>

			<div id="motorock-ai-result" aria-live="polite"></div>
		</div>
		<?php
	}

	private static function read_status( $product_id ) {
		$sections_json = get_post_meta( $product_id, '_motorock_ai_sections', true );
		$sections = array();

		if ( is_string( $sections_json ) && $sections_json !== '' ) {
			$decoded = json_decode( $sections_json, true );
			if ( is_array( $decoded ) ) {
				$sections = array_values( array_filter( array_map( 'strval', $decoded ) ) );
			}
		}

		return array(
			'generatedAt' => get_post_meta( $product_id, '_motorock_ai_generated_at', true ),
			'provider'    => get_post_meta( $product_id, '_motorock_ai_provider', true ),
			'sections'    => $sections,
		);
	}

	private static function list_draft_locales( $product_id ) {
		$locales = array();

		foreach ( array( 'en', 'et' ) as $locale ) {
			$resolved_id = Motorock_Ai_Wpml_Helper::resolve_product_for_locale( $product_id, $locale );
			if ( ! $resolved_id ) {
				continue;
			}

			if ( get_post_meta( $resolved_id, '_motorock_ai_content_status', true ) === 'draft' ) {
				$locales[] = $locale;
			}
		}

		return $locales;
	}
}
