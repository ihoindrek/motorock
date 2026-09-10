<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Blog {

	const PAGE_SLUG = 'motorock-commerce-ai-blog';

	public static function register() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function enqueue_assets( $hook_suffix ) {
		$expected_hook = Motorock_Commerce_Ai_Admin_Menu::page_hook( self::PAGE_SLUG );

		if ( $hook_suffix !== $expected_hook && strpos( (string) $hook_suffix, self::PAGE_SLUG ) === false ) {
			return;
		}

		wp_enqueue_script( 'wp-api-fetch' );

		wp_register_script(
			'motorock-ai-storefront-client',
			content_url( 'mu-plugins/motorock-ai-writer/assets/admin-storefront-client.js' ),
			array(),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		wp_register_script(
			'motorock-commerce-ai-admin-blog',
			content_url( 'mu-plugins/motorock-commerce-ai/assets/admin-blog.js' ),
			array( 'wp-api-fetch', 'motorock-ai-storefront-client' ),
			MOTOROCK_COMMERCE_AI_VERSION,
			true
		);

		wp_localize_script(
			'motorock-commerce-ai-admin-blog',
			'MotorockCommerceAiBlog',
			array(
				'postEditUrl' => admin_url( 'post.php?post=POST_ID&action=edit' ),
				'i18n'        => array(
					'running'      => __( 'Generating article… this can take 30–90 seconds. WordPress stays responsive.', 'motorock-commerce-ai' ),
					'runningBoth'  => __( 'Generating EN + ET articles… this can take 1–3 minutes. WordPress stays responsive.', 'motorock-commerce-ai' ),
					'dryRunOk'     => __( 'Dry run complete — preview below. Edit it if needed, then save as draft.', 'motorock-commerce-ai' ),
					'saved'        => __( 'Draft post created in WordPress.', 'motorock-commerce-ai' ),
					'failed'       => __( 'Generation failed.', 'motorock-commerce-ai' ),
					'needTopic'    => __( 'Enter a topic, brief, product ID, category, or brand.', 'motorock-commerce-ai' ),
					'openDraft'    => __( 'Open draft in editor', 'motorock-commerce-ai' ),
					'saveDraft'    => __( 'Save as draft', 'motorock-commerce-ai' ),
					'savingDraft'  => __( 'Saving draft…', 'motorock-commerce-ai' ),
					'draftSaved'   => __( 'Draft saved.', 'motorock-commerce-ai' ),
					'draftFailed'  => __( 'Saving draft failed.', 'motorock-commerce-ai' ),
					'secondLocale' => __( 'Second language version', 'motorock-commerce-ai' ),
				),
			)
		);

		wp_enqueue_script( 'motorock-commerce-ai-admin-blog' );
	}

	private static function taxonomy_options( $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			return array();
		}

		$terms = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => true,
				'orderby'    => 'name',
				'number'     => 300,
			)
		);

		if ( is_wp_error( $terms ) ) {
			return array();
		}

		return $terms;
	}

	private static function render_term_select( $id, $terms, $empty_label ) {
		?>
		<select id="<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( str_replace( '-', '_', $id ) ); ?>">
			<option value=""><?php echo esc_html( $empty_label ); ?></option>
			<?php foreach ( $terms as $term ) : ?>
				<option value="<?php echo esc_attr( $term->slug ); ?>">
					<?php echo esc_html( $term->name . ' (' . $term->count . ')' ); ?>
				</option>
			<?php endforeach; ?>
		</select>
		<?php
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-commerce-ai' ) );
		}

		$categories = self::taxonomy_options( 'product_cat' );
		$brands     = self::taxonomy_options( 'pa_brand' );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Commerce AI — Blog generator', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'Draft a journal post from a topic, brief, or product context. Posts are saved as WordPress drafts for review.', 'motorock-commerce-ai' ); ?>
			</p>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="motorock-blog-topic"><?php esc_html_e( 'Topic', 'motorock-commerce-ai' ); ?></label></th>
					<td><input type="text" id="motorock-blog-topic" name="motorock_blog_topic" class="regular-text" placeholder="<?php esc_attr_e( 'Spring riding gear essentials', 'motorock-commerce-ai' ); ?>" /></td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-brief"><?php esc_html_e( 'Brief', 'motorock-commerce-ai' ); ?></label></th>
					<td><textarea id="motorock-blog-brief" name="motorock_blog_brief" class="large-text" rows="4" placeholder="<?php esc_attr_e( 'Optional angle, audience, or CTA…', 'motorock-commerce-ai' ); ?>"></textarea></td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-product-id"><?php esc_html_e( 'Product ID', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<input type="number" id="motorock-blog-product-id" name="motorock_blog_product_id" min="1" step="1" class="small-text" />
						<p class="description">
							<?php esc_html_e( 'Optional. WooCommerce product ID from the edit URL (post=12345). Leave empty if you only use Topic/Brief.', 'motorock-commerce-ai' ); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-article-type"><?php esc_html_e( 'Article type', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<select id="motorock-blog-article-type" name="motorock_blog_article_type">
							<option value=""><?php esc_html_e( 'Freeform article', 'motorock-commerce-ai' ); ?></option>
							<option value="gear_guide"><?php esc_html_e( 'Buying guide', 'motorock-commerce-ai' ); ?></option>
							<option value="top_list"><?php esc_html_e( 'Top list (Top 5)', 'motorock-commerce-ai' ); ?></option>
							<option value="how_to"><?php esc_html_e( 'How-to tutorial', 'motorock-commerce-ai' ); ?></option>
							<option value="brand_story"><?php esc_html_e( 'Brand story', 'motorock-commerce-ai' ); ?></option>
							<option value="news"><?php esc_html_e( 'Store news', 'motorock-commerce-ai' ); ?></option>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-category"><?php esc_html_e( 'Product category', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<?php self::render_term_select( 'motorock-blog-category', $categories, __( '— No category —', 'motorock-commerce-ai' ) ); ?>
						<p class="description">
							<?php esc_html_e( 'Optional. Real products from this category are offered to the AI as recommendations (live product cards with image, price, and link).', 'motorock-commerce-ai' ); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-brand"><?php esc_html_e( 'Brand', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<?php self::render_term_select( 'motorock-blog-brand', $brands, __( '— No brand —', 'motorock-commerce-ai' ) ); ?>
						<p class="description">
							<?php esc_html_e( 'Optional. Uses this brand’s products as recommendations. Overrides category. Pair with the “Brand story” article type.', 'motorock-commerce-ai' ); ?>
						</p>
					</td>
				</tr>
				<tr>
					<th scope="row" id="motorock-blog-locale-label"><?php esc_html_e( 'Locale', 'motorock-commerce-ai' ); ?></th>
					<td role="radiogroup" aria-labelledby="motorock-blog-locale-label">
						<label for="motorock-blog-locale-en">
							<input type="radio" id="motorock-blog-locale-en" name="motorock-blog-locale" value="en" checked />
							EN
						</label>
						&nbsp;
						<label for="motorock-blog-locale-et">
							<input type="radio" id="motorock-blog-locale-et" name="motorock-blog-locale" value="et" />
							ET
						</label>
						&nbsp;
						<label for="motorock-blog-locale-both">
							<input type="radio" id="motorock-blog-locale-both" name="motorock-blog-locale" value="both" />
							<?php esc_html_e( 'Both (EN + ET, linked as translations)', 'motorock-commerce-ai' ); ?>
						</label>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="motorock-blog-dry-run"><?php esc_html_e( 'Options', 'motorock-commerce-ai' ); ?></label></th>
					<td>
						<label for="motorock-blog-dry-run">
							<input type="checkbox" id="motorock-blog-dry-run" name="motorock_blog_dry_run" checked />
							<?php esc_html_e( 'Dry run (preview only)', 'motorock-commerce-ai' ); ?>
						</label>
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
