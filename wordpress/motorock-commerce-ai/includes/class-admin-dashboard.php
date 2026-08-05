<?php

defined( 'ABSPATH' ) || exit;

class Motorock_Commerce_Ai_Admin_Dashboard {

	const PAGE_SLUG = 'motorock-commerce-ai';

	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function register_menu() {
		add_submenu_page(
			'edit.php?post_type=product',
			__( 'Commerce AI', 'motorock-commerce-ai' ),
			__( 'Commerce AI', 'motorock-commerce-ai' ),
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
			'motorock-commerce-ai-dashboard',
			plugins_url( 'assets/admin-dashboard.css', dirname( __FILE__ ) ),
			array(),
			'0.1.0'
		);
	}

	public static function get_skill_catalog() {
		return array(
			array(
				'id'          => 'product.content_writer',
				'domain'      => 'product',
				'status'      => 'active',
				'title'       => __( 'Product content writer', 'motorock-commerce-ai' ),
				'description' => __( 'Generate descriptions, SEO meta, FAQ, and image ALT text.', 'motorock-commerce-ai' ),
				'action_url'  => admin_url( 'admin.php?page=motorock-ai-bulk' ),
				'action_label'=> __( 'Open product content', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'content.blog_generate',
				'domain'      => 'content',
				'status'      => 'active',
				'title'       => __( 'Blog article generator', 'motorock-commerce-ai' ),
				'description' => __( 'Draft journal posts from a topic, product, or campaign brief.', 'motorock-commerce-ai' ),
				'action_url'  => admin_url( 'admin.php?page=motorock-commerce-ai-blog' ),
				'action_label'=> __( 'Open blog generator', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'catalog.fill_attributes',
				'domain'      => 'catalog',
				'status'      => 'planned',
				'title'       => __( 'Fill missing attributes', 'motorock-commerce-ai' ),
				'description' => __( 'Suggest WooCommerce attributes for incomplete product records.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'catalog.related_products',
				'domain'      => 'catalog',
				'status'      => 'planned',
				'title'       => __( 'Related products', 'motorock-commerce-ai' ),
				'description' => __( 'Recommend and apply related product links in bulk.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'catalog.detect_duplicates',
				'domain'      => 'catalog',
				'status'      => 'planned',
				'title'       => __( 'Duplicate detection', 'motorock-commerce-ai' ),
				'description' => __( 'Find likely duplicate products by SKU, title, and images.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'catalog.organize_categories',
				'domain'      => 'catalog',
				'status'      => 'planned',
				'title'       => __( 'Category organizer', 'motorock-commerce-ai' ),
				'description' => __( 'Suggest category cleanup and WPML-safe taxonomy moves.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'seo.audit',
				'domain'      => 'seo',
				'status'      => 'active',
				'title'       => __( 'SEO audit', 'motorock-commerce-ai' ),
				'description' => __( 'Score PDPs and posts for missing meta, thin content, and ALT gaps.', 'motorock-commerce-ai' ),
				'action_url'  => admin_url( 'admin.php?page=motorock-commerce-ai-seo-audit' ),
				'action_label'=> __( 'Open SEO audit', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'seo.internal_links',
				'domain'      => 'seo',
				'status'      => 'planned',
				'title'       => __( 'Internal link suggestions', 'motorock-commerce-ai' ),
				'description' => __( 'Recommend internal links between products, categories, and blog posts.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'seo.fix_404',
				'domain'      => 'seo',
				'status'      => 'planned',
				'title'       => __( '404 repair assistant', 'motorock-commerce-ai' ),
				'description' => __( 'Suggest redirects for broken URLs from crawl or GSC exports.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'intelligence.pricing',
				'domain'      => 'intelligence',
				'status'      => 'planned',
				'title'       => __( 'Pricing intelligence', 'motorock-commerce-ai' ),
				'description' => __( 'Compare competitor pricing and suggest margin-safe price updates.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'content.email_campaign',
				'domain'      => 'content',
				'status'      => 'planned',
				'title'       => __( 'Email & campaigns', 'motorock-commerce-ai' ),
				'description' => __( 'Draft newsletter and campaign copy from catalog highlights.', 'motorock-commerce-ai' ),
			),
			array(
				'id'          => 'support.cs_replies',
				'domain'      => 'support',
				'status'      => 'planned',
				'title'       => __( 'Customer support drafts', 'motorock-commerce-ai' ),
				'description' => __( 'Prepare support replies using order context and store policies.', 'motorock-commerce-ai' ),
			),
		);
	}

	public static function render_page() {
		if ( ! current_user_can( 'edit_products' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'motorock-commerce-ai' ) );
		}

		$skills = self::get_skill_catalog();
		$domains = array(
			'product'      => __( 'Product', 'motorock-commerce-ai' ),
			'content'      => __( 'Content', 'motorock-commerce-ai' ),
			'catalog'      => __( 'Catalog', 'motorock-commerce-ai' ),
			'seo'          => __( 'SEO', 'motorock-commerce-ai' ),
			'intelligence' => __( 'Intelligence', 'motorock-commerce-ai' ),
			'support'      => __( 'Support', 'motorock-commerce-ai' ),
		);

		$grouped = array();
		foreach ( $skills as $skill ) {
			$grouped[ $skill['domain'] ][] = $skill;
		}
		?>
		<div class="wrap motorock-commerce-ai-wrap">
			<h1><?php esc_html_e( 'Commerce AI', 'motorock-commerce-ai' ); ?></h1>
			<p class="description">
				<?php esc_html_e( 'One engine, many skills — catalog, content, SEO, pricing, and support tools. Active skills run on the Next.js storefront.', 'motorock-commerce-ai' ); ?>
			</p>

			<?php foreach ( $grouped as $domain => $domain_skills ) : ?>
				<section class="motorock-commerce-ai-domain">
					<h2><?php echo esc_html( $domains[ $domain ] ?? $domain ); ?></h2>
					<div class="motorock-commerce-ai-grid">
						<?php foreach ( $domain_skills as $skill ) : ?>
							<article class="motorock-commerce-ai-card motorock-commerce-ai-card--<?php echo esc_attr( $skill['status'] ); ?>">
								<header>
									<h3><?php echo esc_html( $skill['title'] ); ?></h3>
									<span class="motorock-commerce-ai-badge"><?php echo esc_html( $skill['status'] ); ?></span>
								</header>
								<p><?php echo esc_html( $skill['description'] ); ?></p>
								<footer>
									<code><?php echo esc_html( $skill['id'] ); ?></code>
									<?php if ( ! empty( $skill['action_url'] ) ) : ?>
										<a class="button button-primary" href="<?php echo esc_url( $skill['action_url'] ); ?>">
											<?php echo esc_html( $skill['action_label'] ?? __( 'Open', 'motorock-commerce-ai' ) ); ?>
										</a>
									<?php else : ?>
										<span class="motorock-commerce-ai-soon"><?php esc_html_e( 'Coming soon', 'motorock-commerce-ai' ); ?></span>
									<?php endif; ?>
								</footer>
							</article>
						<?php endforeach; ?>
					</div>
				</section>
			<?php endforeach; ?>
		</div>
		<?php
	}
}
